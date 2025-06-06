import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SkipToContent } from './components/SkipToContent';
import { SEO } from './components/SEO';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'sonner';
import { NetworkStatus } from './components/NetworkStatus';
import { startHeartbeat, stopHeartbeat } from './lib/supabase';
import { useAuthStore } from './lib/store';
import { startRealtimeMonitoring, stopRealtimeMonitoring } from './lib/realtimeManager';
import { trackPageView } from './lib/analytics';
import { useChatNotificationStore } from './stores/useChatNotificationStore';

// Eagerly import core components to ensure they're initialized
import * as LucideReact from 'lucide-react';

// Lazy load pages with proper error boundaries and suspense
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const MyListings = lazy(() => import('./pages/MyListings'));
const NewListing = lazy(() => import('./pages/NewListing'));
const EditListing = lazy(() => import('./pages/EditListing'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const InSearchOf = lazy(() => import('./pages/InSearchOf'));
const NewISOListing = lazy(() => import('./pages/NewISOListing'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const TestPage = lazy(() => import('./pages/TestPage'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ChatsListPage = lazy(() => import('./pages/ChatsListPage'));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App: React.FC = () => {
  const { refetch } = useAuthStore();
  const location = useLocation();
  const { user } = useAuthStore();
  const { subscribeToNotifications, unsubscribeFromNotifications } = useChatNotificationStore();
  
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
  
  useEffect(() => {
    startHeartbeat();
    startRealtimeMonitoring();
    
    let activityTimeout: number | null = null;
    let lastActivity = Date.now();
    
    const resetActivityTimer = () => {
      lastActivity = Date.now();
      
      if (activityTimeout) {
        window.clearTimeout(activityTimeout);
      }
      
      activityTimeout = window.setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        
        if (timeSinceLastActivity < 60000) {
          refetch().catch(console.error);
        }
      }, 20 * 60 * 1000);
    };
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetActivityTimer);
    });
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing auth state');
        refetch().catch(console.error);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    resetActivityTimer();
    
    return () => {
      stopHeartbeat();
      stopRealtimeMonitoring();
      
      if (activityTimeout) {
        window.clearTimeout(activityTimeout);
      }
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);
  
  // Set up chat notification subscription
  useEffect(() => {
    if (user?.id) {
      subscribeToNotifications(user.id);
    }
    
    return () => {
      unsubscribeFromNotifications();
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen flex flex-col">
      <SkipToContent />
      <ErrorBoundary boundary="navigation" errorCallback={(error) => console.error("Navigation error:", error)}>
        <header role="banner">
          <Navbar />
        </header>
      </ErrorBoundary>
      
      <ScrollToTop />
      
      <main id="main-content" role="main" aria-label="Main content" className="flex-grow container mx-auto px-4 py-8 mt-16">
        <ErrorBoundary boundary="main content" errorCallback={(error) => console.error("Main content error:", error)}>
          <SEO />
          <Routes>
            <Route path="/" element={
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ErrorBoundary boundary="home page">
                  <Home />
                </ErrorBoundary>
              </Suspense>
            } />
            
            <Route path="/login" element={
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ErrorBoundary boundary="login page">
                  <Login />
                </ErrorBoundary>
              </Suspense>
            } />
            
            <Route path="/register" element={
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ErrorBoundary boundary="registration page">
                  <Register />
                </ErrorBoundary>
              </Suspense>
            } />
            
            <Route path="/forgot-password" element={
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ErrorBoundary boundary="forgot password page">
                  <ForgotPassword />
                </ErrorBoundary>
              </Suspense>
            } />
            
            <Route path="/reset-password" element={
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ErrorBoundary boundary="reset password page">
                  <ResetPassword />
                </ErrorBoundary>
              </Suspense>
            } />
            
            <Route path="/pending-approval" element={
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ErrorBoundary boundary="pending approval page">
                  <PendingApproval />
                </ErrorBoundary>
              </Suspense>
            } />
            
            <Route path="/test" element={
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ErrorBoundary boundary="test page">
                  <TestPage />
                </ErrorBoundary>
              </Suspense>
            } />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="profile page">
                    <Profile />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/dashboard" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="dashboard page">
                    <Dashboard />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/inventory" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="inventory listings">
                    <Inventory />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/notifications" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="notifications">
                    <Notifications />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/my-listings" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="my listings page">
                    <MyListings />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/inventory/new" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="new listing page">
                    <NewListing />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/inventory/edit/:id" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="edit listing page">
                    <EditListing />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/inventory/:id" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="listing details page">
                    <ListingDetails />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/iso" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="in search of page">
                    <InSearchOf />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/iso/new" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="new ISO listing page">
                    <NewISOListing />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/chat" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="chats list page">
                    <ChatsListPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              
              <Route path="/chat/:channelId" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="chat page">
                    <ChatPage />
                  </ErrorBoundary>
                </Suspense>
              } />
            </Route>

            <Route element={<ProtectedRoute requireAdmin />}>
              <Route path="/admin" element={
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <ErrorBoundary boundary="admin dashboard">
                    <AdminDashboard />
                  </ErrorBoundary>
                </Suspense>
              } />
            </Route>

            <Route path="*" element={
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ErrorBoundary boundary="not found page">
                  <NotFoundPage />
                </ErrorBoundary>
              </Suspense>
            } />
          </Routes>
        </ErrorBoundary>
      </main>

      <ErrorBoundary boundary="footer">
        <Footer />
      </ErrorBoundary>

      <div aria-hidden="true">
        <NetworkStatus />
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          closeButton
          theme="light"
          visibleToasts={6}
          duration={4000}
        />
      </div>
    </div>
  );
}

export default App;