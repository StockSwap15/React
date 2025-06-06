// Interface for analytics events
interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
  timestamp?: string;
}

// Interface for error events
interface ErrorEvent {
  error: Error;
  componentStack?: string;
  boundary?: string;
  context?: Record<string, any>;
  timestamp?: string;
}

// Queue for offline events
const offlineQueue: Array<{type: 'event' | 'error', data: any}> = [];

// Load queue from localStorage
try {
  const savedQueue = localStorage.getItem('analytics_offline_queue');
  if (savedQueue) {
    const parsed = JSON.parse(savedQueue);
    if (Array.isArray(parsed)) {
      offlineQueue.push(...parsed);
    }
  }
} catch (e) {
  console.error('Failed to load offline analytics queue:', e);
}

// Process offline queue when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processOfflineQueue();
  });
}

// Process the offline queue
function processOfflineQueue() {
  if (!navigator.onLine || offlineQueue.length === 0) return;
  
  // Process each item in the queue
  while (offlineQueue.length > 0) {
    const item = offlineQueue.shift();
    if (!item) continue;
    
    try {
      if (item.type === 'event') {
        sendEvent(item.data, false);
      } else if (item.type === 'error') {
        sendError(item.data, false);
      }
    } catch (e) {
      console.error('Failed to process offline queue item:', e);
      // Put the item back in the queue
      offlineQueue.unshift(item);
      break;
    }
  }
  
  // Save the updated queue
  try {
    localStorage.setItem('analytics_offline_queue', JSON.stringify(offlineQueue));
  } catch (e) {
    console.error('Failed to save offline analytics queue:', e);
  }
}

// Send an analytics event
function sendEvent(event: AnalyticsEvent, queueIfOffline = true) {
  // Add timestamp if not provided
  if (!event.timestamp) {
    event.timestamp = new Date().toISOString();
  }
  
  // If online, send the event
  if (navigator.onLine) {
    try {
      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug('Analytics event:', event);
        return;
      }
      
      // In production, use a simple logging approach
      // This avoids 404 errors when no analytics endpoint exists
      console.debug('Analytics event:', event.category, event.action, event.label);
    } catch (e) {
      console.error('Failed to send analytics event:', e);
      if (queueIfOffline) {
        offlineQueue.push({ type: 'event', data: event });
        try {
          localStorage.setItem('analytics_offline_queue', JSON.stringify(offlineQueue));
        } catch (storageError) {
          console.error('Failed to save to offline queue:', storageError);
        }
      }
    }
  } else if (queueIfOffline) {
    // If offline, queue the event
    offlineQueue.push({ type: 'event', data: event });
    try {
      localStorage.setItem('analytics_offline_queue', JSON.stringify(offlineQueue));
    } catch (e) {
      console.error('Failed to save to offline queue:', e);
    }
  }
}

// Send an error event
function sendError(errorEvent: ErrorEvent, queueIfOffline = true) {
  // Add timestamp if not provided
  if (!errorEvent.timestamp) {
    errorEvent.timestamp = new Date().toISOString();
  }
  
  // If online, send the error
  if (navigator.onLine) {
    try {
      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug('Error event:', errorEvent);
        return;
      }
      
      // In production, use a simple logging approach
      console.error('Application error:', 
        errorEvent.error.name, 
        errorEvent.error.message, 
        errorEvent.boundary || 'unknown boundary'
      );
    } catch (e) {
      console.error('Failed to send error event:', e);
      if (queueIfOffline) {
        offlineQueue.push({ type: 'error', data: errorEvent });
        try {
          localStorage.setItem('analytics_offline_queue', JSON.stringify(offlineQueue));
        } catch (storageError) {
          console.error('Failed to save to offline queue:', storageError);
        }
      }
    }
  } else if (queueIfOffline) {
    // If offline, queue the error
    offlineQueue.push({ type: 'error', data: errorEvent });
    try {
      localStorage.setItem('analytics_offline_queue', JSON.stringify(offlineQueue));
    } catch (e) {
      console.error('Failed to save to offline queue:', e);
    }
  }
}

// Track page view
export function trackPageView(path: string) {
  sendEvent({
    category: 'navigation',
    action: 'page_view',
    label: path
  });
}

// Track user action
function trackEvent(category: string, action: string, label?: string, value?: number) {
  sendEvent({
    category,
    action,
    label,
    value
  });
}

// Track error
export function trackError(error: Error, componentStack?: string, boundary?: string, context?: Record<string, any>) {
  sendError({
    error,
    componentStack,
    boundary,
    context
  });
}

// Track performance metrics
function trackPerformance(metric: {name: string, value: number}) {
  sendEvent({
    category: 'performance',
    action: metric.name,
    value: metric.value,
    nonInteraction: true
  });
}

