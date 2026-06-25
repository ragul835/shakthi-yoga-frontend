'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from '../signin/auth.module.css';
import { digitalMediaWaiverHtml, liabilityWaiverHtml } from './waivers';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    experienceLevel: 'BEGINNER', practiceFrequency: '',
    emergencyContactName: '', emergencyContactPhone: '',
    purposeOfJoining: [] as string[],
    physicalHealth: '', mentalHealth: '',
    digitalMediaWaiver: false, liabilityWaiver: false, terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const router = useRouter();

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const passwordStrength = () => {
    const p = form.password;
    if (p.length < 4) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const canNext = () => {
    if (step === 1) return form.email && form.password && form.password === form.confirmPassword && form.password.length >= 8;
    if (step === 2) return form.name && form.phone && form.emergencyContactName && form.emergencyContactPhone;
    if (step === 3) return form.practiceFrequency && form.purposeOfJoining.length > 0 && form.physicalHealth;
    return form.terms && form.liabilityWaiver && form.digitalMediaWaiver;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) { setStep(step + 1); return; }
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        experienceLevel: form.experienceLevel,
        practiceFrequency: form.practiceFrequency,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        purposeOfJoining: form.purposeOfJoining,
        physicalHealth: form.physicalHealth,
        mentalHealth: form.mentalHealth || undefined,
        digitalMediaWaiver: form.digitalMediaWaiver,
        liabilityWaiver: form.liabilityWaiver,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };


  const strength = passwordStrength();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.formSide}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h1>Create Account</h1>
              <p>Join SHAKTHI YOGA and start your wellness journey</p>
            </div>

            {/* Step Indicator */}
            <div className={styles.steps}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`${styles.step} ${s === step ? styles.stepActive : ''} ${s < step ? styles.stepDone : ''}`} />
              ))}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className={styles.passwordWrapper}>
                      <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={e => update('password', e.target.value)} required />
                      <button type="button" className={styles.eyeToggle} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                    <div className={styles.strengthBar}>
                      {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`${styles.strengthSegment} ${strength >= s ? (strength <= 1 ? styles.strengthWeak : strength <= 2 ? styles.strengthMedium : styles.strengthStrong) : ''}`} />
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className={styles.passwordWrapper}>
                      <input className={`form-input ${form.confirmPassword && form.password !== form.confirmPassword ? 'form-input-error' : ''}`} type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required />
                      <button type="button" className={styles.eyeToggle} onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle password visibility">
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                    {form.confirmPassword && form.password !== form.confirmPassword && <span className="form-error">Passwords do not match</span>}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name (Last Name, First Name) [For kid's yoga program, use kid's name]</label>
                    <input className="form-input" placeholder="Doe, John" value={form.name} onChange={e => update('name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => update('phone', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Contact Name</label>
                    <input className="form-input" placeholder="Jane Doe" value={form.emergencyContactName} onChange={e => update('emergencyContactName', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Contact Phone Number</label>
                    <input className="form-input" type="tel" placeholder="+1 (555) 000-0000" value={form.emergencyContactPhone} onChange={e => update('emergencyContactPhone', e.target.value)} required />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="form-group">
                    <label className="form-label">How often do you practice Yoga?</label>
                    <select className="form-select" value={form.practiceFrequency === 'Daily' || form.practiceFrequency === 'Weekly' || form.practiceFrequency === 'Beginner' || form.practiceFrequency === '' ? form.practiceFrequency : 'Other'} onChange={e => {
                      if (e.target.value !== 'Other') {
                        update('practiceFrequency', e.target.value);
                      } else {
                        update('practiceFrequency', 'Other');
                      }
                    }} required>
                      <option value="">Select an option</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Other">Other:</option>
                    </select>
                    {form.practiceFrequency !== '' && !['Daily', 'Weekly', 'Beginner'].includes(form.practiceFrequency) && (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Please specify" 
                        value={form.practiceFrequency === 'Other' ? '' : form.practiceFrequency} 
                        onChange={e => update('practiceFrequency', e.target.value || 'Other')} 
                        style={{ marginTop: '8px' }}
                        required 
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purpose of Joining</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {['Stress relief/ Relaxation', 'Cultivate Inner peace', 'Improve Flexibility', 'Setup some Regular Routine', 'Other'].map(opt => {
                        const standardOptions = ['Stress relief/ Relaxation', 'Cultivate Inner peace', 'Improve Flexibility', 'Setup some Regular Routine'];
                        const isOther = opt === 'Other';
                        const isChecked = isOther 
                          ? form.purposeOfJoining.some(p => !standardOptions.includes(p))
                          : form.purposeOfJoining.includes(opt);
                        
                        const otherValue = form.purposeOfJoining.find(p => !standardOptions.includes(p)) || '';

                        return (
                          <div key={opt} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="checkbox" checked={isChecked} onChange={e => {
                                if (isOther) {
                                  if (e.target.checked) {
                                    update('purposeOfJoining', [...form.purposeOfJoining, 'Other']);
                                  } else {
                                    update('purposeOfJoining', form.purposeOfJoining.filter(p => standardOptions.includes(p)));
                                  }
                                } else {
                                  const newPurpose = e.target.checked 
                                    ? [...form.purposeOfJoining, opt] 
                                    : form.purposeOfJoining.filter(p => p !== opt);
                                  update('purposeOfJoining', newPurpose);
                                }
                              }} />
                              <span>{isOther ? 'Other:' : opt}</span>
                            </label>
                            {isOther && isChecked && (
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Please specify"
                                value={otherValue === 'Other' ? '' : otherValue}
                                onChange={e => {
                                  const newPurpose = form.purposeOfJoining.filter(p => standardOptions.includes(p));
                                  newPurpose.push(e.target.value || 'Other');
                                  update('purposeOfJoining', newPurpose);
                                }}
                                style={{ marginLeft: '24px', padding: '8px', width: 'calc(100% - 24px)' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Physical health condition if any (Major illness/Injuries/Surgery)</label>
                    <textarea className="form-input" rows={2} placeholder="Required" value={form.physicalHealth} onChange={e => update('physicalHealth', e.target.value)} required style={{ resize: 'vertical' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mental /Emotional Health condition if any (Anxiety, Depression, ADHS, Bipolar, Grief or loss, etc...)</label>
                    <textarea className="form-input" rows={2} placeholder="Optional" value={form.mentalHealth} onChange={e => update('mentalHealth', e.target.value)} style={{ resize: 'vertical' }} />
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <div className="form-label" style={{ marginBottom: '8px' }}>Digital Media Waiver</div>
                    <div 
                      style={{ height: '120px', overflowY: 'auto', background: 'var(--surface-light, rgba(255,255,255,0.05))', padding: '12px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem', marginBottom: '8px' }}
                      dangerouslySetInnerHTML={{ __html: digitalMediaWaiverHtml }}
                    />
                    <label className={styles.termsLabel} style={{ marginBottom: '0' }}>
                      <input type="checkbox" checked={form.digitalMediaWaiver} onChange={e => update('digitalMediaWaiver', e.target.checked)} />
                      <span>I agree to the Digital Media Waiver (allowing photos/videos during class)</span>
                    </label>
                  </div>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <div className="form-label" style={{ marginBottom: '8px' }}>Waiver of Liability and Release</div>
                    <div 
                      style={{ height: '120px', overflowY: 'auto', background: 'var(--surface-light, rgba(255,255,255,0.05))', padding: '12px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem', marginBottom: '8px' }}
                      dangerouslySetInnerHTML={{ __html: liabilityWaiverHtml }}
                    />
                    <label className={styles.termsLabel} style={{ marginBottom: '0' }}>
                      <input type="checkbox" checked={form.liabilityWaiver} onChange={e => update('liabilityWaiver', e.target.checked)} />
                      <span>I agree to the Waiver of Liability and Release</span>
                    </label>
                  </div>
                  <label className={styles.termsLabel}>
                    <input type="checkbox" checked={form.terms} onChange={e => update('terms', e.target.checked)} />
                    <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
                  </label>
                </>
              )}

              <div className={styles.btnRow}>
                {step > 1 && (
                  <button type="button" className={`btn btn-secondary ${styles.submitBtn}`} onClick={() => setStep(step - 1)}>
                    Back
                  </button>
                )}
                <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={!canNext() || loading}>
                  {step < 4 ? 'Next' : loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </form>

            <p className={styles.switchText}>
              Already have an account? <Link href="/signin">Sign in</Link>
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
