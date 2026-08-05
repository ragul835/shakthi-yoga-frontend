'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import styles from './ManualPaymentForm.module.css';

interface ManualPaymentFormProps {
  token: string;
  purchaseType: 'CLASS' | 'PASS';
  purchaseId: string;
  itemName: string;
  amountUsd: number;
  onSubmitted: (submission: { id: string; status: string }) => void;
}

export default function ManualPaymentForm({ token, purchaseType, purchaseId, itemName, amountUsd, onSubmitted }: ManualPaymentFormProps) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const accountName = process.env.NEXT_PUBLIC_ADMIN_PAYMENT_ACCOUNT_NAME || 'SHAKTHI YOGA';
  const accountDetails = process.env.NEXT_PUBLIC_ADMIN_PAYMENT_ACCOUNT_DETAILS || 'Contact the administrator for transfer details.';

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    setSubmitting(true);
    try {
      const result = await apiPost<{ id: string; status: string }>('/payments/manual', {
        purchaseType,
        [purchaseType === 'CLASS' ? 'classId' : 'passOptionId']: purchaseId,
        amountUsd: amountUsd.toFixed(2),
      }, token);
      onSubmitted(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit the payment request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <section className={styles.transferCard} aria-labelledby="transfer-heading">
        <div><span className={styles.eyebrow}>Bank transfer</span><h2 id="transfer-heading">Transfer ${amountUsd.toFixed(2)} to the admin account</h2></div>
        <dl><div><dt>Account name</dt><dd>{accountName}</dd></div><div><dt>Transfer details</dt><dd>{accountDetails}</dd></div><div><dt>For</dt><dd>{itemName}</dd></div></dl>
      </section>

      <div className={styles.notice} role="note">
        <strong>Already completed the transfer?</strong>
        <span>The administrator will record the bank reference and payment screenshot, verify the payment, and then release your receipt and class access.</span>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Submitting request…' : 'I have completed the transfer'}</button>
    </form>
  );
}
