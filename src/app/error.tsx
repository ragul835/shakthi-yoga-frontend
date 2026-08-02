'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/logger';

export default function ErrorPage({
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
    <main className="container" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', paddingBlock: '120px' }}>
      <div>
        <p style={{ color: 'var(--primary)', marginBottom: 12 }}>Something went wrong</p>
        <h1 style={{ marginBottom: 16 }}>We couldn’t load this page.</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>The problem has been logged. Please try again.</p>
        <button className="btn btn-primary" type="button" onClick={() => unstable_retry()}>Try again</button>
      </div>
    </main>
  );
}
