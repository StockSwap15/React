import React, { StrictMode } from 'react';
import ReactDOM, { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { ReportHandler, getCLS, getFID, getLCP } from 'web-vitals';
import { AuthProvider } from './lib/AuthProvider';

// Validate environment variables
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_APP_URL'];
requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    console.error(`Error: Missing environment variable ${envVar}`);
    if (import.meta.env.PROD) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
});

// Rehydrate auth store
(async () => {
  const { useAuthStore } = await import('./stores/useAuthStore');
  useAuthStore.persist?.rehydrate();
})();

// Report web vitals
const reportWebVitals: ReportHandler = ({ name, value, id }) => {
  // Only report in production
  if (import.meta.env.PROD) {
    try {
      // Use console logging instead of sending to an endpoint
      console.debug('Web Vital:', name, Math.round(value * 1000) / 1000);
    } catch (e) {
      console.debug('Error sending metrics:', e);
    }
  }
};

// Measure performance metrics
getCLS(reportWebVitals);
getFID(reportWebVitals);
getLCP(reportWebVitals);

// Check if running in StackBlitz
const isStackBlitz = typeof window !== 'undefined' && 
  (window.navigator.userAgent.includes('StackBlitz') || 
   window.location.hostname.includes('stackblitz.io'));

// Register service worker if not in StackBlitz and in production
if ('serviceWorker' in navigator && !isStackBlitz && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt to reload
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
      
      console.log('Service worker registered successfully');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });
}

// Initialize axe-core for accessibility testing in development
if (import.meta.env.DEV) {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  }).catch(err => {
    console.error('Error initializing axe-core:', err);
  });
}

// Render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);