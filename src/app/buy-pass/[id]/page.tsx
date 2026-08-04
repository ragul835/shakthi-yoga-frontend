'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import Link from 'next/link';
import styles from './buy-pass.module.css';

interface PassOption {
  id: string;
  name: string;
  description: string;
  priceUsd: string;
  totalClasses: number | null;
  validityDays: number | null;
}

export default function BuyPassWizard() {
  const params = useParams();
  const passId = params.id as string;
  const router = useRouter();
  const { isAuthenticated, token, isLoading: authLoading } = useAuth();
  
  const [passOption, setPassOption] = useState<PassOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/signin?redirect=/buy-pass/${passId}`);
      return;
    }

    const fetchData = async () => {
      try {
        const passes = await apiGet<PassOption[]>('/passes/options', token ?? undefined);
        const found = passes.find(p => p.id === passId);
        if (found) {
          setPassOption(found);
        } else {
          setErrorMsg('Class pass not found.');
        }
      } catch {
        setErrorMsg('Failed to load pass details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [passId, isAuthenticated, authLoading, router, token]);

  const handleNext = () => {
    if (step === 2) {
      // Go to payment step
      setStep(3);
    } else {
      setStep((s) => Math.min(s + 1, 4) as any);
    }
  };
  
  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as any);

  const handlePay = async () => {
    setPaymentError('');
    if (paymentMethod === 'Card' && cardNumber.toLowerCase().includes('fail')) {
      setPaymentError('Your card was declined. Please try a different payment method.');
      return;
    }

    setIsProcessing(true);
    
    try {
      if (!token) throw new Error("Authentication required. Please sign in again.");

      await apiPost(`/passes/purchase/${passId}`, {}, token);
      setStep(4);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to process purchase.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return <div className={styles.loadingWrapper}><div className={styles.spinner} /></div>;
  }

  if (!passOption) {
    return (
      <div className={styles.page}>
        <div className="container">
          <h2>Error</h2>
          <p>{errorMsg}</p>
          <button className="btn btn-secondary" onClick={() => router.push('/pricing')}>Back to Pricing</button>
        </div>
      </div>
    );
  }

  // Cost calculations
  const price = parseFloat(passOption.priceUsd) || 0;
  const taxRate = 0.0875; // 8.75%
  const tax = price * taxRate;
  const total = price + tax;

  const steps = [
    { num: 1, label: 'Summary' },
    { num: 2, label: 'Order' },
    { num: 3, label: 'Payment' },
    { num: 4, label: 'Confirmation' },
  ];

  return (
    <div className={styles.page}>
      
      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        {steps.map((s, idx) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={styles.stepWrapper}>
              <div className={`${styles.stepCircle} ${step === s.num ? styles.active : step > s.num ? styles.completed : styles.inactive}`}>
                {step > s.num ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : s.num}
              </div>
              <div className={`${styles.stepLabel} ${step === s.num ? styles.active : step > s.num ? styles.active : styles.inactive}`}>
                {s.label}
              </div>
            </div>
            {idx < steps.length - 1 && <div className={styles.stepLine} />}
          </div>
        ))}
      </div>

      <div className={styles.contentArea}>
        
        {/* Step 1: Summary */}
        {step === 1 && (
          <div>
            <h1 className={styles.stepTitle}>Selected Pass</h1>
            <div className={styles.card}>
              <div className={styles.classTitleRow}>
                <div className={styles.classTitle}>{passOption.name}</div>
                <div className={styles.classPrice}>${price.toFixed(0)}</div>
              </div>
              <div className={styles.classMeta}>
                {passOption.totalClasses ? `${passOption.totalClasses} classes included` : 'Unlimited classes'} &middot; {passOption.validityDays ? `Valid for ${passOption.validityDays} days` : 'No expiry date'}
              </div>
              <div className={styles.classDesc} style={{ marginTop: '16px' }}>
                {passOption.description}
              </div>
              <div className={styles.classSchedule} style={{ marginTop: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Access to all regular classes
              </div>
              <div className={styles.classSchedule} style={{ marginTop: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Book & manage via dashboard
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => router.push('/pricing')} aria-label="Back to pricing">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handleNext}>
                Continue to Order Summary
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Order */}
        {step === 2 && (
          <div>
            <h1 className={styles.stepTitle}>Order Summary</h1>
            <div className={styles.card}>
              <div className={styles.orderTable}>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Pass</span>
                  <span className={styles.orderValue}>{passOption.name}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Classes</span>
                  <span className={styles.orderValue}>{passOption.totalClasses ? passOption.totalClasses : 'Unlimited'}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Validity</span>
                  <span className={styles.orderValue}>{passOption.validityDays ? `${passOption.validityDays} days` : 'No expiry'}</span>
                </div>
                <div className={styles.orderRow} style={{ marginTop: '16px', borderBottom: 'none' }}>
                  <span className={styles.orderLabel}>Subtotal</span>
                  <span className={styles.orderValue}>${price.toFixed(2)}</span>
                </div>
                <div className={styles.orderRow} style={{ borderBottom: 'none' }}>
                  <span className={styles.orderLabel}>Sales Tax (8.75%)</span>
                  <span className={styles.orderValue}>${tax.toFixed(2)}</span>
                </div>
                <div className={styles.orderTotalRow}>
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={handleBack} disabled={isProcessing}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handleNext} disabled={isProcessing}>
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div>
            <h1 className={styles.stepTitle}>Payment</h1>
            <div className={styles.paymentTabs}>
              {['Card', 'ACH', 'Apple Pay', 'Google Pay'].map(m => (
                <button 
                  key={m} 
                  className={`${styles.paymentTab} ${paymentMethod === m ? styles.active : ''}`}
                  onClick={() => setPaymentMethod(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            
            <div className={styles.card} style={{ padding: '24px' }}>
              <div className={styles.stripeHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Powered by Stripe
              </div>
              
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Card Number</label>
                <input 
                  className={styles.inputField} 
                  placeholder="4242 4242 4242 4242" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>Type "fail" to demo a payment error.</div>
              </div>
              
              <div className={styles.row2}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Expiry</label>
                  <input 
                    className={styles.inputField} 
                    placeholder="MM / YY" 
                    value={expiry} 
                    onChange={(e) => setExpiry(e.target.value)} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>CVC</label>
                  <input 
                    className={styles.inputField} 
                    placeholder="123" 
                    value={cvc} 
                    onChange={(e) => setCvc(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            
            {paymentError && (
              <div className={styles.errorMsg}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {paymentError}
              </div>
            )}
            
            <div className={styles.actions} style={{ marginTop: '24px' }}>
              <button className={styles.backBtn} onClick={handleBack} disabled={isProcessing}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handlePay} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div>
            <div className={styles.confirmationCenter}>
              <div className={styles.successCircle}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h1 className={styles.stepTitle} style={{ marginBottom: '8px' }}>Payment Successful!</h1>
              <p className={styles.confirmationSubtitle}>Your pass has been added to your account. A receipt has been sent to your email.</p>
            </div>
            
            <div className={styles.receiptCard}>
              <div className={styles.orderTable}>
                <div className={styles.orderRow} style={{ borderBottom: 'none' }}>
                  <span className={styles.orderLabel}>Pass Purchased</span>
                  <span className={styles.orderValue}>{passOption.name}</span>
                </div>
                <div className={styles.orderRow} style={{ borderBottom: 'none' }}>
                  <span className={styles.orderLabel}>Amount Paid</span>
                  <span className={styles.orderValue}>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <button className={`btn btn-primary ${styles.joinBtn}`} onClick={() => router.push('/dashboard?success=pass')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
