// ═══════════════════════════════════════════════════════════════════════
// ERROR HANDLING & CRASH REPORTING
// Sentry integration for production monitoring
// ═══════════════════════════════════════════════════════════════════════

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';

// Feature flag for error reporting
const ERROR_REPORTING_ENABLED = import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_ENV === 'production';

// Initialize Sentry
export function initializeErrorReporting() {
  if (!ERROR_REPORTING_ENABLED) {
    console.log('[ErrorHandling] Sentry disabled - not in production');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new BrowserTracing(),
    ],
    environment: import.meta.env.VITE_ENV || 'development',
    release: `jolt-time@${import.meta.env.VITE_VERSION || '1.0.0'}`,
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Error collection
    attachStacktrace: true,
    sendDefaultPii: false, // Don't send PII
    
    // Filtering
    ignoreErrors: [
      // Ignore network errors that are expected
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      // Ignore browser extensions
      'Extension context invalidated',
    ],
    
    // Before send hook for custom processing
    beforeSend(event) {
      // Add custom context
      event.tags = {
        ...event.tags,
        'game.version': import.meta.env.VITE_VERSION || 'unknown',
        'game.build': import.meta.env.VITE_BUILD_NUMBER || 'unknown',
      };
      
      // Don't send errors in development
      if (import.meta.env.VITE_ENV === 'development') {
        console.log('[Sentry] Would send event:', event);
        return null;
      }
      
      return event;
    },
  });

  console.log('[ErrorHandling] Sentry initialized');
}

// Capture React errors
export function captureReactError(error: Error, errorInfo: React.ErrorInfo) {
  if (!ERROR_REPORTING_ENABLED) {
    console.error('[React Error]', error, errorInfo);
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
}

// Capture promise rejections
export function captureUnhandledRejection(reason: unknown) {
  if (!ERROR_REPORTING_ENABLED) {
    console.error('[Unhandled Promise Rejection]', reason);
    return;
  }

  Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)), {
    tags: {
      type: 'unhandled_promise_rejection',
    },
  });
}

// Capture Edge Function errors
export function captureEdgeFunctionError(functionName: string, error: Error, context?: Record<string, unknown>) {
  if (!ERROR_REPORTING_ENABLED) {
    console.error(`[EdgeFunction:${functionName}]`, error, context);
    return;
  }

  Sentry.captureException(error, {
    tags: {
      type: 'edge_function',
      function: functionName,
    },
    extra: context,
  });
}

// Capture game-specific errors
export function captureGameError(errorType: string, error: Error, details?: Record<string, unknown>) {
  if (!ERROR_REPORTING_ENABLED) {
    console.error(`[GameError:${errorType}]`, error, details);
    return;
  }

  Sentry.captureException(error, {
    tags: {
      type: 'game_error',
      game_error_type: errorType,
    },
    extra: details,
  });
}

// Set user context
export function setUserContext(telegramId: number, userId: string) {
  if (!ERROR_REPORTING_ENABLED) return;

  Sentry.setUser({
    id: String(telegramId),
    username: userId,
  });
}

// Clear user context (on logout)
export function clearUserContext() {
  if (!ERROR_REPORTING_ENABLED) return;

  Sentry.setUser(null);
}

// Add breadcrumb for game events
export function addGameBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  if (!ERROR_REPORTING_ENABLED) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    timestamp: Date.now(),
  });
}

// Wrap component for error boundary
export const ErrorBoundary = Sentry.ErrorBoundary;
