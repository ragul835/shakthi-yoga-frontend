import { reportClientError } from '@/lib/logger';

try {
  window.addEventListener('error', (event) => {
    reportClientError(event.error || event.message, { source: 'window_error' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason, { source: 'unhandled_rejection' });
  });
} catch {
  // Instrumentation failures must not prevent hydration.
}
