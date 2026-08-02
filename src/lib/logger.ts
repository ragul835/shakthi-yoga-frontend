export type ClientErrorSource = 'window_error' | 'unhandled_rejection' | 'react_error_boundary' | 'api_error';

type ErrorDetails = {
  source: ClientErrorSource;
  digest?: string;
  path?: string;
};

function normalizeError(value: unknown): { name: string; message: string } {
  if (value instanceof Error) return { name: value.name.slice(0, 120), message: value.message.slice(0, 500) };
  return { name: 'Error', message: typeof value === 'string' ? value.slice(0, 500) : 'Unknown client error' };
}

export function reportClientError(value: unknown, details: ErrorDetails): void {
  if (typeof window === 'undefined') return;
  const error = normalizeError(value);
  const payload = {
    ...error,
    source: details.source,
    digest: details.digest?.slice(0, 100),
    path: (details.path || window.location.pathname).split('?')[0].slice(0, 300),
  };

  // Keep a local diagnostic trail while forwarding sanitized metadata to the
  // server logs. Never include request bodies, tokens, cookies, or form data.
  console.error(JSON.stringify({ event: 'client_error', ...payload }));
  try {
    void fetch('/api/observability/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Observability must never interrupt the user experience.
  }
}
