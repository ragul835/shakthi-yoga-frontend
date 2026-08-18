'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import Link from 'next/link';
import styles from './book.module.css';
import { formatAttendanceDate, getAvailableMakeupCredits, getMakeupCreditExpiry, type MakeupCredit } from '@/lib/attendance';
import { isClassFull } from '@/lib/booking';
import VerificationRequestForm from '@/components/VerificationRequestForm/VerificationRequestForm';
import { getUserPassStatus, type UserPass } from '@/lib/pass';

export default function BookClassWizard() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const { isAuthenticated, token, isLoading: authLoading } = useAuth();
  
  const [yogaClass, setYogaClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [makeupCredits, setMakeupCredits] = useState<MakeupCredit[]>([]);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  const [bookedWithMakeupCredit, setBookedWithMakeupCredit] = useState(false);
  const [activePasses, setActivePasses] = useState<UserPass[]>([]);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Verification request state
  const [requestError, setRequestError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationRequestSubmitted, setVerificationRequestSubmitted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/signin?redirect=/book/${classId}`);
      return;
    }

    const fetchData = async () => {
      try {
        const [res, creditsRes, passesRes] = await Promise.all([
          apiGet(`/classes/${classId}`),
          apiGet<any>('/attendance/makeup-credits', token!).catch(() => []),
          apiGet<any>('/passes/me', token!).catch(() => []),
        ]);
        setYogaClass(res);
        const availableCredits = getAvailableMakeupCredits(creditsRes);
        setMakeupCredits(availableCredits);
        if (availableCredits.length > 0) setSelectedPassId(null);
        // Prefer a valid makeup credit so students do not accidentally pay for
        // a class that can be covered. They can still explicitly choose to pay.
        setSelectedCreditId(current => (
          current && availableCredits.some(credit => credit.id === current)
            ? current
            : availableCredits[0]?.id ?? null
        ));
        const passes = passesRes.data || passesRes || [];
        setActivePasses((Array.isArray(passes) ? passes : []).filter(pass => getUserPassStatus(pass) === 'active'));
      } catch {
        setErrorMsg('Class not found or an error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, isAuthenticated, authLoading, router, token]);

  const handleNext = () => {
    if (step === 2) {
      if (selectedCreditId || selectedPassId) void handleCoveredBooking();
      else setStep(3);
    } else {
      setStep((s) => Math.min(s + 1, 4) as any);
    }
  };
  
  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as any);

  const handleCoveredBooking = async () => {
    setRequestError('');
    setIsProcessing(true);
    
    try {
      if (!token) throw new Error("Authentication required. Please sign in again.");

      // Capacity may have changed while the student was reviewing the request.
      const latestClass = await apiGet<any>(`/classes/${encodeURIComponent(classId)}`);
      setYogaClass(latestClass);
      if (isClassFull(latestClass)) {
        setSelectedCreditId(null);
        throw new Error('This class is full. Please choose another class.');
      }

      if (selectedCreditId) {
        const latestCreditsResponse = await apiGet<any>('/attendance/makeup-credits', token);
        const availableCredits = getAvailableMakeupCredits(latestCreditsResponse);
        setMakeupCredits(availableCredits);
        if (!availableCredits.some(credit => credit.id === selectedCreditId)) {
          setSelectedCreditId(null);
          throw new Error('This makeup credit has expired or is no longer available.');
        }
      }
      if (selectedPassId) {
        const latestPassesResponse = await apiGet<any>('/passes/me', token);
        const latestPasses = latestPassesResponse.data || latestPassesResponse || [];
        const availablePasses = (Array.isArray(latestPasses) ? latestPasses : [])
          .filter(pass => getUserPassStatus(pass) === 'active');
        setActivePasses(availablePasses);
        if (!availablePasses.some(pass => pass.id === selectedPassId)) {
          setSelectedPassId(null);
          throw new Error('This class pass has expired or has no classes remaining.');
        }
      }
      await apiPost('/enrollments', {
        classId,
        useMakeupCreditId: selectedCreditId || undefined,
        userPassId: selectedPassId || undefined,
      }, token);

      if (selectedCreditId) {
        setBookedWithMakeupCredit(true);
        setMakeupCredits(current => current.filter(credit => credit.id !== selectedCreditId));
        setSelectedCreditId(null);
      }

      setStep(4);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to process booking.');
      // If we skipped step 3, go back to step 2 to show error
      if ((selectedCreditId || selectedPassId) && step === 2) {
        setRequestError(err.message || 'Failed to process booking.');
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
  const isCoveredBooking = Boolean(selectedCreditId || selectedPassId);
  const total = isCoveredBooking ? 0 : price;
  const classFull = isClassFull(yogaClass);

  const steps = [
    { num: 1, label: 'Summary' },
    { num: 2, label: 'Order' },
    { num: 3, label: 'Verification' },
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
              <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handleNext} disabled={classFull}>
                {classFull ? 'Class Full' : 'Continue to Order Summary'}
              </button>
            </div>
            
            {makeupCredits.length > 0 && (
              <div className={styles.makeupNotice} role="status" aria-live="polite">
                <div className={styles.makeupNoticeContent}>
                  <div className={styles.makeupNoticeIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div className={styles.makeupNoticeBody}>
                    <h2 className={styles.makeupNoticeTitle}>Makeup credit available</h2>
                    <p className={styles.makeupNoticeText}>
                      You have {makeupCredits.length} makeup credit{makeupCredits.length > 1 ? 's' : ''} available. Use a makeup credit to book this class for $0. It expires at the end of the calendar month in which the original class was missed.
                    </p>
                    
                    <select 
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', width: '100%', fontSize: '0.9rem', background: 'var(--bg)' }}
                      value={selectedCreditId || ''}
                      onChange={(e) => {
                        setSelectedCreditId(e.target.value || null);
                        if (e.target.value) setSelectedPassId(null);
                      }}
                    >
                      <option value="">Do not use credit</option>
                      {makeupCredits.map(c => {
                        const expiresAt = getMakeupCreditExpiry(c.sessionDate);
                        return (
                          <option key={c.id} value={c.id}>
                            Missed {formatAttendanceDate(c.sessionDate)} — expires {expiresAt ? formatAttendanceDate(expiresAt) : 'unknown'}
                          </option>
                        );
                      })}
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
                  <span className={styles.orderValue} style={{ textDecoration: isCoveredBooking ? 'line-through' : 'none' }}>${price.toFixed(2)}</span>
                </div>
                {selectedCreditId && (
                  <div className={styles.orderRow} style={{ borderBottom: 'none', color: 'var(--primary)' }}>
                    <span className={styles.orderLabel}>Makeup Credit Applied</span>
                    <span className={styles.orderValue}>-${price.toFixed(2)}</span>
                  </div>
                )}
                {selectedPassId && (
                  <div className={styles.orderRow} style={{ borderBottom: 'none', color: 'var(--primary)' }}>
                    <span className={styles.orderLabel}>Class Pass Applied</span>
                    <span className={styles.orderValue}>-${price.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.orderTotalRow}>
                  <span>Listed price</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {makeupCredits.length > 0 && (
              <div className={`${styles.card} ${styles.makeupOrderCard}`}>
                <div className={styles.makeupOrderStatus} role="status">
                  Makeup credit available
                </div>
                <label htmlFor="makeup-credit" className={styles.makeupOrderLabel}>Use a makeup credit to book this class</label>
                <p className={styles.makeupOrderHelp}>
                  Your valid credit is selected automatically. This booking costs $0 and does not use another class from your class pass.
                </p>
                <select
                  id="makeup-credit"
                  value={selectedCreditId || ''}
                  onChange={(event) => {
                    setSelectedCreditId(event.target.value || null);
                    if (event.target.value) setSelectedPassId(null);
                    setRequestError('');
                  }}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                >
                  <option value="">Pay for this class instead</option>
                  {makeupCredits.map(credit => {
                    const expiresAt = getMakeupCreditExpiry(credit.sessionDate);
                    return (
                      <option key={credit.id} value={credit.id}>
                        Makeup credit from {formatAttendanceDate(credit.sessionDate)} — expires {expiresAt ? formatAttendanceDate(expiresAt) : 'unknown'}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {makeupCredits.length === 0 && activePasses.length > 0 && (
              <div className={styles.card} style={{ marginTop: '16px' }}>
                <label htmlFor="class-pass" className={styles.orderLabel}>Use an active class pass</label>
                <select
                  id="class-pass"
                  value={selectedPassId || ''}
                  onChange={(event) => {
                    setSelectedPassId(event.target.value || null);
                    if (event.target.value) setSelectedCreditId(null);
                    setRequestError('');
                  }}
                  style={{ marginTop: '10px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                >
                  <option value="">Pay for this class instead</option>
                  {activePasses.map(pass => (
                    <option key={pass.id} value={pass.id}>
                      {pass.passOption?.name || 'Class Pass'} — {pass.remainingClasses == null ? 'Unlimited classes' : `${pass.remainingClasses} class${pass.remainingClasses === 1 ? '' : 'es'} remaining`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {requestError && step === 2 && (
              <div className={styles.errorMsg} style={{ marginTop: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {requestError}
              </div>
            )}
            
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={handleBack} disabled={isProcessing}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handleNext} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : selectedPassId ? 'Confirm Pass Booking' : selectedCreditId ? 'Book with Makeup Credit' : 'Continue to Verification'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 3 && (
          <div>
            <h1 className={styles.stepTitle}>Request Booking Verification</h1>
            <VerificationRequestForm token={token!} requestType="CLASS" requestId={classId} itemName={yogaClass.name} onSubmitted={() => { setVerificationRequestSubmitted(true); setStep(4); }} />
            <div className={styles.actions} style={{ marginTop: '24px' }}><button className={styles.backBtn} onClick={handleBack} aria-label="Back to order summary">←</button></div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div>
            <div className={styles.confirmationCenter}>
              <div className={styles.successCircle}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h1 className={styles.stepTitle} style={{ marginBottom: '8px' }}>{verificationRequestSubmitted ? 'Booking request received' : bookedWithMakeupCredit ? 'Makeup class booked!' : 'You’re booked!'}</h1>
              <p className={styles.confirmationSubtitle}>{verificationRequestSubmitted ? 'Your booking is pending administrator verification. Class access will appear in My Classes after approval.' : bookedWithMakeupCredit ? 'Your makeup-class booking is confirmed. The meeting link is available in My Classes.' : 'Your class-pass booking is confirmed. The meeting link is available in My Classes.'}</p>
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
                  <span className={styles.orderLabel}>{verificationRequestSubmitted ? 'Listed price' : 'Amount due'}</span>
                  <span className={styles.orderValue}>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <Link href="/dashboard" className="btn btn-primary">
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
