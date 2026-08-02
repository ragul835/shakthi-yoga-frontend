'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/logger';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { source: 'react_error_boundary', digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#faf9f6', color: '#243126' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
          <div>
            <h1>We’re sorry—something went wrong.</h1>
            <p>The problem has been logged. Please try again.</p>
            <button type="button" onClick={() => unstable_retry()} style={{ padding: '12px 22px', borderRadius: 999, border: 0, background: '#527b5c', color: 'white', cursor: 'pointer' }}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
