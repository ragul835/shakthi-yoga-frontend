'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import Link from 'next/link';
import styles from './book.module.css';

export default function BookClassWizard() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const { isAuthenticated, token, isLoading: authLoading } = useAuth();
  
  const [yogaClass, setYogaClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [makeupCredits, setMakeupCredits] = useState<any[]>([]);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);

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
      router.push(`/signin?redirect=/book/${classId}`);
      return;
    }

    const fetchData = async () => {
      try {
        const [res, creditsRes] = await Promise.all([
          apiGet(`/classes/${classId}`),
          apiGet<any>('/attendance/makeup-credits', token!).catch(() => [])
        ]);
        setYogaClass(res);
        setMakeupCredits(creditsRes.data || creditsRes || []);
      } catch (err: any) {
        setErrorMsg('Class not found or an error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, isAuthenticated, authLoading, router, token]);

  const handleNext = () => {
    if (step === 2 && selectedCreditId) {
      // Skip payment if using makeup credit
      handlePay();
    } else {
      setStep((s) => Math.min(s + 1, 4) as any);
    }
  };
  
  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as any);

  const handlePay = async () => {
    setPaymentError('');
    if (!selectedCreditId && paymentMethod === 'Card' && cardNumber.toLowerCase().includes('fail')) {
      setPaymentError('Your card was declined. Please try a different payment method.');
      return;
    }

    setIsProcessing(true);
    
    try {
      if (token) {
        await apiPost('/enrollments', { classId, useMakeupCreditId: selectedCreditId || undefined }, token);
      }
      setStep(4);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to process booking.');
      // If we skipped step 3, go back to step 2 to show error
      if (selectedCreditId && step === 2) {
        setPaymentError(err.message || 'Failed to process booking.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return <div className={styles.loadingWrapper}><div className={styles.spinner} /></div>;
  }

  if (!yogaClass) {
    return (
      <div className={styles.page}>
        <div className="container">
          <h2>Error</h2>
          <p>{errorMsg}</p>
          <button className="btn btn-secondary" onClick={() => router.push('/classes')}>Back to Classes</button>
        </div>
      </div>
    );
  }

  // Cost calculations
  const price = parseFloat(yogaClass.priceUsd) || 0;
  const taxRate = 0.0875; // 8.75%
  const tax = selectedCreditId ? 0 : price * taxRate;
  const total = selectedCreditId ? 0 : price + tax;

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
            <h1 className={styles.stepTitle}>Selected Class</h1>
            <div className={styles.card}>
              <div className={styles.classTitleRow}>
                <div className={styles.classTitle}>{yogaClass.name}</div>
                <div className={styles.classPrice}>${price.toFixed(0)}</div>
              </div>
              <div className={styles.classMeta}>
                with {yogaClass.instructor?.user?.name} &middot; {yogaClass.durationMinutes} min &middot; {yogaClass.experienceLevel === 'ALL_LEVELS' ? 'All Levels' : 'Beginner Friendly'}
              </div>
              <div className={styles.classDesc}>
                {yogaClass.description || 'A dynamic sequence connecting breath to movement, building heat and inner clarity. Perfect for starting your day with intention.'}
              </div>
              <div className={styles.classSchedule}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {yogaClass.scheduleDay} &middot; {yogaClass.scheduleTime}
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => router.push('/classes')} aria-label="Back to classes">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handleNext}>
                Continue to Order Summary
              </button>
            </div>
            
            {makeupCredits.length > 0 && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--primary-light)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ color: 'var(--primary)', marginTop: '2px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--text)' }}>You have {makeupCredits.length} Makeup Credit{makeupCredits.length > 1 ? 's' : ''}</h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You missed a recent class. You can use a credit to book this class for free.</p>
                    
                    <select 
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', width: '100%', fontSize: '0.9rem', background: 'var(--bg)' }}
                      value={selectedCreditId || ''}
                      onChange={(e) => setSelectedCreditId(e.target.value || null)}
                    >
                      <option value="">Do not use credit</option>
                      {makeupCredits.map(c => (
                        <option key={c.id} value={c.id}>Use credit from missed class on {new Date(c.sessionDate).toLocaleDateString()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Order */}
        {step === 2 && (
          <div>
            <h1 className={styles.stepTitle}>Order Summary</h1>
            <div className={styles.card}>
              <div className={styles.orderTable}>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Class</span>
                  <span className={styles.orderValue}>{yogaClass.name}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Instructor</span>
                  <span className={styles.orderValue}>{yogaClass.instructor?.user?.name}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Schedule</span>
                  <span className={styles.orderValue}>{yogaClass.scheduleDay} &middot; {yogaClass.scheduleTime}</span>
                </div>
                <div className={styles.orderRow} style={{ marginTop: '16px', borderBottom: 'none' }}>
                  <span className={styles.orderLabel}>Subtotal</span>
                  <span className={styles.orderValue} style={{ textDecoration: selectedCreditId ? 'line-through' : 'none' }}>${price.toFixed(2)}</span>
                </div>
                {selectedCreditId && (
                  <div className={styles.orderRow} style={{ borderBottom: 'none', color: 'var(--primary)' }}>
                    <span className={styles.orderLabel}>Makeup Credit Applied</span>
                    <span className={styles.orderValue}>-${price.toFixed(2)}</span>
                  </div>
                )}
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
            
            {paymentError && step === 2 && (
              <div className={styles.errorMsg} style={{ marginTop: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {paymentError}
              </div>
            )}
            
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={handleBack} disabled={isProcessing}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handleNext} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : selectedCreditId ? 'Confirm Free Booking' : 'Proceed to Payment'}
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
              <h1 className={styles.stepTitle} style={{ marginBottom: '8px' }}>You're booked!</h1>
              <p className={styles.confirmationSubtitle}>A confirmation has been sent to your email.</p>
            </div>
            
            <div className={styles.receiptCard}>
              <div className={styles.orderTable}>
                <div className={styles.orderRow} style={{ borderBottom: 'none' }}>
                  <span className={styles.orderLabel}>Class</span>
                  <span className={styles.orderValue}>{yogaClass.name}</span>
                </div>
                <div className={styles.orderRow} style={{ borderBottom: 'none' }}>
                  <span className={styles.orderLabel}>Instructor</span>
                  <span className={styles.orderValue}>{yogaClass.instructor?.user?.name}</span>
                </div>
                <div className={styles.orderRow} style={{ borderBottom: 'none' }}>
                  <span className={styles.orderLabel}>Amount Paid</span>
                  <span className={styles.orderValue}>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <button className={`btn btn-primary ${styles.joinBtn}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              Join via Zoom (Available 10 min before class)
            </button>
            
            <Link href="/dashboard" className={styles.backToDash}>
              Back to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
