/**
 * SENTRY INITIALIZATION
 *
 * Error monitoring and performance tracking for Kosmoi.
 * Captures errors, exceptions, and performance metrics.
 */

import * as Sentry from "@sentry/react";

let sentryInitialized = false;

/**
 * Initialize Sentry (call once on app start)
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn || dsn === "YOUR_SENTRY_DSN") {
    console.warn("[Monitoring] VITE_SENTRY_DSN not set - Sentry disabled");
    return false;
  }

  if (sentryInitialized) return true;

  Sentry.init({
    dsn: dsn,
    environment: import.meta.env.MODE || "development",

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out noise
    beforeSend(event, hint) {
      // Don't send errors from localhost in development
      if (import.meta.env.DEV && window.location.hostname === "localhost") {
        console.log("[Sentry] Skipping error in dev:", event);
        return null;
      }
      return event;
    },

    // Tag all events
    initialScope: {
      tags: {
        app: "kosmoi",
        version: "1.0.0",
      },
    },
  });

  sentryInitialized = true;
  console.log("[Monitoring] Sentry initialized");
  return true;
};

/**
 * Set user context for Sentry
 */
export const setSentryUser = (user) => {
  if (!sentryInitialized) return;

  Sentry.setUser({
    id: user?.id,
    email: user?.email,
    username: user?.full_name || user?.email,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearSentryUser = () => {
  if (!sentryInitialized) return;
  Sentry.setUser(null);
};

/**
 * Capture a custom error
 */
export const captureError = (error, context = {}) => {
  if (!sentryInitialized) {
    console.error("[Sentry disabled] Error:", error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture a custom message
 */
export const captureMessage = (message, level = "info", context = {}) => {
  if (!sentryInitialized) {
    console.log(`[Sentry disabled] ${level}: ${message}`);
    return;
  }

  Sentry.captureMessage(message, {
    level: level,
    extra: context,
  });
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (category, message, data = {}) => {
  if (!sentryInitialized) return;

  Sentry.addBreadcrumb({
    category: category,
    message: message,
    data: data,
    level: "info",
  });
};

/**
 * Error Boundary component for React
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with error boundary
 */
export const withErrorBoundary = Sentry.withErrorBoundary;

export default {
  init: initSentry,
  setUser: setSentryUser,
  clearUser: clearSentryUser,
  captureError,
  captureMessage,
  addBreadcrumb,
  ErrorBoundary: SentryErrorBoundary,
  withErrorBoundary,
};
