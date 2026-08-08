'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';
import styles from '../signin/auth.module.css';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get('token'));

  useEffect(() => {
    if (token) {
      window.history.replaceState(null, '', '/reset-password');
    }
  }, [token]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (success && countdown === 0) {
      router.push('/signin');
    }
    return () => clearTimeout(timer);
  }, [success, countdown, router]);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError('Password must contain at least one uppercase letter and one number');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { apiPost } = await import('@/lib/api');
      await apiPost('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={`${styles.formSide} animate-fade-in`} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.formWrapper} style={{ textAlign: 'center', maxWidth: '420px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '24px' 
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--success-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success)',
                  animation: 'fadeIn 0.5s ease-out'
                }}>
                  <CheckCircle size={48} strokeWidth={2.5} />
                </div>
              </div>
              
              <h1 style={{ 
                marginBottom: '12px', 
                fontFamily: 'var(--font-heading)',
                fontSize: '2.2rem',
                color: 'var(--text)'
              }}>
                Password Updated!
              </h1>
              
              <p style={{ 
                color: 'var(--text-secondary)', 
                marginBottom: '32px',
                fontSize: '1.05rem',
                lineHeight: '1.6'
              }}>
                Your password has been successfully reset. You can now use your new password to sign in to your account.
              </p>

              <div style={{
                background: 'var(--surface-alt)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                fontSize: '0.9rem',
                color: 'var(--text-tertiary)'
              }}>
                Redirecting to sign in in <strong>{countdown}</strong> seconds...
              </div>

              <Link href="/signin" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Go to Sign In <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.formSide}>
          <div className={`${styles.formWrapper} animate-fade-in`}>
            <div className={styles.formHeader}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: 'var(--primary-soft)', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '20px'
              }}>
                <KeyRound size={24} />
              </div>
              <h1>Create New Password</h1>
              <p>Please enter your new password below to regain access to your account.</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {!token && !error && (
              <div className={styles.error}>No reset token found in the URL. Please use the link sent to your email.</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className={styles.eyeToggle} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {password && (
                  <div className={styles.strengthBar}>
                    <div className={`${styles.strengthSegment} ${strength >= 1 ? styles.strengthWeak : ''}`}></div>
                    <div className={`${styles.strengthSegment} ${strength >= 2 ? (strength >= 3 ? styles.strengthStrong : styles.strengthMedium) : ''}`}></div>
                    <div className={`${styles.strengthSegment} ${strength >= 3 ? styles.strengthStrong : ''}`}></div>
                    <div className={`${styles.strengthSegment} ${strength >= 4 ? styles.strengthStrong : ''}`}></div>
                  </div>
                )}
                {password && (
                  <div style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-tertiary)' }}>
                    {strength < 2 && 'Weak: Add uppercase, numbers, or symbols'}
                    {strength === 2 && 'Medium: Good, but could be stronger'}
                    {strength > 2 && 'Strong password'}
                  </div>
                )}
              </div>
              
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label className="form-label">Confirm New Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className={styles.eyeToggle} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading || !token || password !== confirmPassword || !/[A-Z]/.test(password) || !/\d/.test(password) || password.length < 8}>
                {loading ? 'Updating Password...' : 'Reset Password'}
                {!loading && <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
              </button>
              
            </form>
          </div>
        </div>
        <div className={styles.brandSide}>
          <div className={`${styles.brandContent} animate-fade-in`}>
            <div className={styles.brandIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M8.5 15c2.5-3 5.5-4.5 8.5-4.5" />
                <path d="M12 8c-2.5 3-3.5 6-3.5 9" />
              </svg>
            </div>
            <h2>SHAKTHI YOGA</h2>
            <p>Your journey to wellness begins with a single breath.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
