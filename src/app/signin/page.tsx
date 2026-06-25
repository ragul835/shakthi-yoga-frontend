'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './auth.module.css';

import { Suspense } from 'react';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'signin' | 'forgot'>('signin');
  const [resetSent, setResetSent] = useState(false);
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'forgot') {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        setResetSent(true);
      }, 1000);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(email, password);
      
      // Need to retrieve user from localStorage since state update might be delayed
      const userStr = localStorage.getItem('zen_user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      
      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
      } else if (userObj?.role === 'ADMIN' || userObj?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.formSide}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h1>{view === 'forgot' ? 'Reset Password' : 'Welcome Back'}</h1>
              <p>{view === 'forgot' ? 'Enter your email to receive a reset link' : 'Sign in to access your yoga dashboard'}</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✉️</div>
                <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Check your inbox</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.</p>
                <button className="btn btn-secondary" onClick={() => { setView('signin'); setResetSent(false); }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                
                {view === 'signin' && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className={styles.passwordWrapper}>
                      <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                      <button type="button" className={styles.eyeToggle} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {view === 'signin' && (
                  <div className={styles.formActions}>
                    <label className={styles.remember}><input type="checkbox" /> Remember me</label>
                    <button type="button" className={styles.forgot} onClick={() => setView('forgot')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Forgot password?</button>
                  </div>
                )}

                <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
                  {loading ? 'Please wait...' : (view === 'forgot' ? 'Send Reset Link' : 'Sign In')}
                </button>
                
                {view === 'forgot' && (
                  <button type="button" className={`btn btn-secondary ${styles.submitBtn}`} onClick={() => setView('signin')} style={{ marginTop: '12px' }}>
                    Back to Sign In
                  </button>
                )}
              </form>
            )}

            <p className={styles.switchText}>
              Don&apos;t have an account? <Link href="/register">Register here</Link>
            </p>
          </div>
        </div>
        <div className={styles.brandSide}>
          <div className={styles.brandContent}>
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
