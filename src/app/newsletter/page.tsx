'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';
import styles from '../legal.module.css';

function NewsletterAction() {
  const params = useSearchParams();
  const hasAction = Boolean(params.get('confirm') || params.get('unsubscribe'));
  const [message, setMessage] = useState(hasAction ? 'Processing your request…' : 'This newsletter link is incomplete.');
  const [error, setError] = useState(!hasAction);

  useEffect(() => {
    const confirm = params.get('confirm');
    const unsubscribe = params.get('unsubscribe');
    const action = confirm ? '/newsletter/confirm' : unsubscribe ? '/newsletter/unsubscribe' : null;
    const token = confirm || unsubscribe;
    if (!action || !token) return;
    apiPost<{ message: string }>(action, { token })
      .then(result => setMessage(result.message))
      .catch(reason => { setError(true); setMessage(reason instanceof Error ? reason.message : 'Unable to process this newsletter request.'); });
  }, [params]);

  return <div className={styles.container}><h1 className={styles.title}>{error ? 'Newsletter request' : 'Thank you'}</h1><div className={styles.content}><p role={error ? 'alert' : 'status'}>{message}</p><Link href="/" className="btn btn-primary">Return Home</Link></div></div>;
}

export default function NewsletterPage() {
  return <main className={styles.page}><Suspense fallback={<div className={styles.container}>Processing…</div>}><NewsletterAction /></Suspense></main>;
}
