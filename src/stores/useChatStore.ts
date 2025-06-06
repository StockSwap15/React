import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { showError, showSuccess } from '../utils/toast';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { NetworkStatus } from '../lib/network';

type Message = {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
};

type Channel = {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  resource_type?: string;
  resource_id?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_member_id?: string;
  other_member_name?: string;
};

interface ChatState {
  // State
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  subscription: RealtimeChannel | null;
  hasMore: boolean;
  
  // Actions
  setChannels: (channels: Channel[]) => void;
  setActiveChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSubscription: (subscription: RealtimeChannel | null) => void;
  setHasMore: (hasMore: boolean) => void;
  
  // Operations
  fetchChannels: () => Promise<Channel[]>;
  getOrCreateResourceChannel: (params: { 
    type: 'listing' | 'iso', 
    id: string, 
    ownerId: string 
  }) => Promise<Channel>;
  subscribe: (channelId: string) => Promise<void>;
  unsubscribe: () => void;
  fetchHistory: (before?: string) => Promise<Message[]>;
  sendMessage: (content: string) => Promise<void>;
  markChannelAsRead: (channelId: string) => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  channels: [],
  activeChannel: null,
  messages: [],
  loading: false,
  error: null,
  subscription: null,
  hasMore: true,
  
  // State setters
  setChannels: (channels) => set({ channels }),
  setActiveChannel: (channel) => set({ activeChannel: channel }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set(state => ({ 
    messages: [message, ...state.messages] 
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSubscription: (subscription) => set({ subscription }),
  setHasMore: (hasMore) => set({ hasMore }),
  
  // Fetch all channels for the current user
  fetchChannels: async () => {
    const { setLoading, setError, setChannels } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .rpc('get_user_channels');
      
      if (error) throw error;
      
      setChannels(data || []);
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch channels';
      setError(message);
      showError(message);
      return [];
    } finally {
      setLoading(false);
    }
  },
  
  // Get or create a resource channel
  getOrCreateResourceChannel: async ({ type, id, ownerId }) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .rpc('get_or_create_resource_channel', {
          p_resource_type: type,
          p_resource_id: id,
          p_owner_id: ownerId
        });
      
      if (error) throw error;
      
      // Fetch the channel details
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select(`
          id,
          name,
          is_group,
          created_by,
          created_at,
          resource_type,
          resource_id
        `)
        .eq('id', data)
        .single();
      
      if (channelError) throw channelError;
      
      return channelData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create channel';
      setError(message);
      showError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  },
  
  // Subscribe to a channel
  subscribe: async (channelId) => {
    const { 
      setLoading, 
      setError, 
      setMessages, 
      setActiveChannel,
      addMessage, 
      unsubscribe, 
      fetchHistory,
      markChannelAsRead,
      setSubscription
    } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // First unsubscribe from any existing subscription
      unsubscribe();
      
      // Fetch the channel details
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select(`
          id,
          name,
          is_group,
          created_by,
          created_at,
          resource_type,
          resource_id
        `)
        .eq('id', channelId)
        .single();
      
      if (channelError) throw channelError;
      
      setActiveChannel(channelData);
      
      // Fetch initial messages
      const messages = await fetchHistory();
      
      // Mark the channel as read
      await markChannelAsRead(channelId);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${channelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`
          },
          (payload) => {
            // Fetch the sender information
            supabase
              .from('profiles')
              .select('dealer_name, email')
              .eq('id', payload.new.sender_id)
              .single()
              .then(({ data }) => {
                const message = {
                  ...payload.new,
                  sender_name: data?.dealer_name,
                  sender_email: data?.email
                } as Message;
                
                addMessage(message);
              })
              .catch(console.error);
          }
        )
        .subscribe();
      
      // Register the channel with NetworkStatus for proper cleanup
      if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.registerChannel === 'function') {
        NetworkStatus.registerChannel(channel);
      }
      
      setSubscription(channel);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe to channel';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  },
  
  // Unsubscribe from the current channel
  unsubscribe: () => {
    const { subscription, setSubscription, setActiveChannel } = get();
    
    if (subscription) {
      if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.removeChannel === 'function') {
        NetworkStatus.removeChannel(subscription);
      } else {
        supabase.removeChannel(subscription);
      }
      
      setSubscription(null);
      setActiveChannel(null);
    }
  },
  
  // Fetch message history
  fetchHistory: async (before?: string) => {
    const { 
      activeChannel, 
      setLoading, 
      setError, 
      setMessages, 
      messages,
      setHasMore
    } = get();
    
    if (!activeChannel) {
      setError('No active channel');
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .rpc('fetch_channel_messages', {
          p_channel_id: activeChannel.id,
          p_limit: 20,
          p_before_timestamp: before ? new Date(before).toISOString() : null
        });
      
      if (error) throw error;
      
      const newMessages = data || [];
      
      // If we're fetching the initial messages, replace the state
      if (!before) {
        setMessages(newMessages);
      } else {
        // Otherwise append to existing messages
        setMessages([...messages, ...newMessages]);
      }
      
      // Update hasMore flag
      setHasMore(newMessages.length === 20);
      
      return newMessages;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(message);
      showError(message);
      return [];
    } finally {
      setLoading(false);
    }
  },
  
  // Send a message
  sendMessage: async (content) => {
    const { 
      activeChannel, 
      setError, 
      addMessage 
    } = get();
    
    if (!activeChannel) {
      setError('No active channel');
      return;
    }
    
    if (!content.trim()) {
      setError('Message cannot be empty');
      return;
    }
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('Not authenticated');
      }
      
      // Get user profile for optimistic update
      const { data: profileData } = await supabase
        .from('profiles')
        .select('dealer_name, email')
        .eq('id', userData.user.id)
        .single();
      
      // Create optimistic message
      const optimisticMessage: Message = {
        id: crypto.randomUUID(),
        channel_id: activeChannel.id,
        sender_id: userData.user.id,
        content,
        created_at: new Date().toISOString(),
        sender_name: profileData?.dealer_name,
        sender_email: profileData?.email
      };
      
      // Add optimistic message to state
      addMessage(optimisticMessage);
      
      // Send the actual message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          channel_id: activeChannel.id,
          sender_id: userData.user.id,
          content
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Update the optimistic message with the real ID
      // (In this implementation we don't actually update the ID in the UI,
      // but in a more complex implementation we might want to)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      showError(message);
    }
  },
  
  // Mark a channel as read
  markChannelAsRead: async (channelId) => {
    const { setError } = get();
    
    try {
      const { data, error } = await supabase
        .rpc('mark_channel_as_read', {
          p_channel_id: channelId
        });
      
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark channel as read';
      setError(message);
      console.error(message);
    }
  },
  
  // Clear error
  clearError: () => set({ error: null })
}));