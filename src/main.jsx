import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from "@sentry/react";
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { AppModeProvider } from '@/contexts/AppModeContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { LanguageProvider } from '@/components/LanguageContext';
import { AppConfigProvider } from '@/components/AppConfigContext';
import { RxDBProvider } from '@/core/db/RxDBProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/shared/lib/query-client';

// Initialize Sentry only if DSN is present
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <ErrorBoundary>
      <AuthProvider>
        <AppModeProvider>
          <UserProfileProvider>
            <LocationProvider>
              <LanguageProvider>
                <AppConfigProvider>
                  <RxDBProvider>
                    <QueryClientProvider client={queryClientInstance}>
                      <App />
                    </QueryClientProvider>
                  </RxDBProvider>
                </AppConfigProvider>
              </LanguageProvider>
            </LocationProvider>
          </UserProfileProvider>
        </AppModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </HelmetProvider>,
)

// Register Service Worker for PWA / Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => {
        console.log('SW registered:', reg);
      })
      .catch((err) => {
        console.log('SW registration failed:', err);
      });
  });
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}



