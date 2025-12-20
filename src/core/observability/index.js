import * as Sentry from "@sentry/react";
import pino from 'pino';

// Initialize Sentry
// Ensure VITE_SENTRY_DSN is set in your .env file
if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: true,
            }),
            Sentry.browserTracingIntegration(),
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
} else {
    console.warn("VITE_SENTRY_DSN not set. Sentry disabled.");
}

// Initialize Pino Logger
export const logger = pino({
    level: import.meta.env.VITE_LOG_LEVEL || 'info',
    browser: {
        asObject: true
    }
});

// Helper to log errors with context
export const logError = (error, context = {}) => {
    logger.error({ error, ...context }, context.message || 'An error occurred');
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.captureException(error, { extra: context });
    }
};

export default logger;
