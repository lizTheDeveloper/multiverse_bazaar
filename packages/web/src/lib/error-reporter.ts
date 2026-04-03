/**
 * Frontend Error Reporter
 * Captures and reports errors to the Autonomous Error Resolver via the API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const REPORT_ENDPOINT = `${API_BASE_URL}/v1/errors/report`;

interface ErrorReport {
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent?: string;
  timestamp?: string;
  context?: Record<string, unknown>;
}

// Queue for offline error storage
const errorQueue: ErrorReport[] = [];
let isProcessingQueue = false;

// Debounce duplicate errors
const recentErrors = new Map<string, number>();
const DUPLICATE_WINDOW_MS = 5000;

/**
 * Check if this error was recently reported
 */
function isDuplicate(message: string): boolean {
  const now = Date.now();
  const lastReported = recentErrors.get(message);

  if (lastReported && now - lastReported < DUPLICATE_WINDOW_MS) {
    return true;
  }

  recentErrors.set(message, now);

  // Clean old entries
  for (const [key, time] of recentErrors) {
    if (now - time > DUPLICATE_WINDOW_MS) {
      recentErrors.delete(key);
    }
  }

  return false;
}

/**
 * Report an error to the backend
 */
export async function reportError(
  error: Error,
  context?: Record<string, unknown>,
  componentStack?: string
): Promise<void> {
  // Skip duplicate errors
  if (isDuplicate(error.message)) {
    return;
  }

  const report: ErrorReport = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    componentStack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    context,
  };

  try {
    const response = await fetch(REPORT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      // Queue for retry if offline or server error
      errorQueue.push(report);
    }
  } catch {
    // Network error - queue for retry
    errorQueue.push(report);
  }
}

/**
 * Process queued errors (call periodically or on reconnect)
 */
export async function processErrorQueue(): Promise<void> {
  if (isProcessingQueue || errorQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  try {
    const errors = [...errorQueue];
    errorQueue.length = 0;

    const response = await fetch(`${API_BASE_URL}/v1/errors/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errors }),
    });

    if (!response.ok) {
      // Put errors back in queue
      errorQueue.push(...errors);
    }
  } catch {
    // Will retry later
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  // Unhandled errors
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      type: 'unhandled',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    reportError(error, {
      type: 'unhandledrejection',
    });
  });

  // Process queue when coming back online
  window.addEventListener('online', () => {
    processErrorQueue();
  });

  // Periodic queue processing (every 30 seconds)
  setInterval(processErrorQueue, 30000);
}

/**
 * Create an error boundary handler for React
 */
export function createErrorBoundaryHandler() {
  return (error: Error, errorInfo: { componentStack: string }) => {
    reportError(error, { type: 'react-error-boundary' }, errorInfo.componentStack);
  };
}

export default {
  reportError,
  processErrorQueue,
  setupGlobalErrorHandlers,
  createErrorBoundaryHandler,
};
