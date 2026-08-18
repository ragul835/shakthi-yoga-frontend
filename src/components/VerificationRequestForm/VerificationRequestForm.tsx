'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import styles from './VerificationRequestForm.module.css';

interface VerificationRequestFormProps {
  token: string;
  requestType: 'CLASS' | 'PASS';
  requestId: string;
  itemName: string;
  onSubmitted: (submission: { id: string; status: string }) => void;
}

export default function VerificationRequestForm({ token, requestType, requestId, itemName, onSubmitted }: VerificationRequestFormProps) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // The backend records manual verification requests through this endpoint.
      // No card, bank, or payment-provider details are collected in this UI.
      const result = await apiPost<{ id: string; status: string }>('/payments/manual', {
        purchaseType: requestType,
        [requestType === 'CLASS' ? 'classId' : 'passOptionId']: requestId,
      }, token);
      onSubmitted(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit the verification request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <section className={styles.requestCard} aria-labelledby="verification-heading">
        <span className={styles.eyebrow}>Manual verification</span>
        <h2 id="verification-heading">Request {requestType === 'CLASS' ? 'this class booking' : 'this class pass'}</h2>
        <p>Submit your request for <strong>{itemName}</strong>. The administrator will contact you if any details are needed and activate access after review.</p>
      </section>
      <div className={styles.notice} role="note">
        <strong>No online payment is collected.</strong>
        <span>Your request remains pending until an administrator verifies it.</span>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting request…' : 'Submit for verification'}
      </button>
    </form>
  );
}
