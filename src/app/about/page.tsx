'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle } from 'lucide-react';
import styles from './about.module.css';

const instructors = [
  { 
    name: 'Saranya (Raji)', 
    specialization: 'Founder, Vinyasa & Meditation', 
    image: '',
    bio: 'With over 15 years of practice, Saranya founded SHAKTHI YOGA to create a space where movement meets mindfulness. She specializes in flowing sequences that connect breath to body.'
  }
];

export default function AboutPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    
    setStatus('loading');
    setErrorMsg('');
    
    try {
      const { apiPost } = await import('@/lib/api');
      await apiPost('/contact', {
        name: formData.name,
        email: formData.email,
        subject: `New inquiry from ${formData.name}`,
        message: formData.message
      });
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to send message. Please try again later.');
    }
  };

  return (
    <div className={styles.page}>
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.subtext}>Our Story</p>
          <h1 className={styles.title}>Rooted in tradition.<br/>Designed for modern life.</h1>
        </div>
      </section>

      {/* Story Split Section */}
      <section className={styles.storySection}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyContent}>
              <h2>The meaning of Shakthi</h2>
              <p>In yogic philosophy, <em>Shakthi</em> is the quality of balance, harmony, and light. It is the state of mind we strive for when we step onto the mat—a place where clarity meets calm.</p>
              
              <p>Founded in 2014 by Saranya (Raji), SHAKTHI YOGA began as a small community gathering in a sunlit loft. Our goal was simple: to create a sanctuary where people could disconnect from the noise of the world and reconnect with themselves.</p>
              
              <p>Today, SHAKTHI YOGA has grown into a global virtual community, offering premium, intention-driven yoga classes that honor ancient traditions while embracing the realities of modern living.</p>
              
              <div className={styles.signature}>
                <p>Saranya (Raji)</p>
                <span>Founder & Lead Instructor</span>
              </div>
            </div>
            
            <div className={styles.storyVisual}>
              <div className={styles.visualImage} />
              <div className={styles.statCard}>
                <span className={styles.statNum}>12+</span>
                <span className={styles.statLabel}>Years of teaching</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.teamSection}>
        <div className="container">
          <div className={styles.teamHeader}>
            <p className={styles.subtext}>Meet the Team</p>
            <h2>Expert guides for your journey</h2>
          </div>
          
          <div className={styles.teamGrid}>
            {instructors.map((inst, i) => (
              <div key={i} className={styles.teamCard}>
                <div className={styles.teamImageWrap} style={!inst.image ? { background: 'var(--bg-alt)' } : {}}>
                  {inst.image ? (
                    <img src={inst.image} alt={inst.name} className={styles.teamImage} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.teamInfo}>
                  <h3>{inst.name}</h3>
                  <span className={styles.specialization}>{inst.specialization}</span>
                  <p className={styles.bio}>{inst.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Banner */}
      <section className={styles.contactSection}>
        <div className="container">
          <div className={styles.contactHeader}>
            <p className={styles.subtext}>GET IN TOUCH</p>
            <h2>We&apos;d love to hear from you</h2>
          </div>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactLeft}>
              <a 
                href="https://share.google/3dY6zIadXlKrMekTu" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.contactMap}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <MapPin size={32} className={styles.contactMapIcon} />
                <div className={styles.contactMapText}>
                  Private Studio &middot; Pleasanton, CA<br />
                  <span style={{ fontSize: '0.85em', color: 'var(--primary)' }}>View on Google Maps &rarr;</span>
                </div>
              </a>
              
              <div className={styles.contactInfoList}>
                <div className={styles.contactInfoItem}>
                  <MapPin size={20} />
                  <a href="https://share.google/3dY6zIadXlKrMekTu" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span>Pleasanton, CA</span>
                  </a>
                </div>
                <div className={styles.contactInfoItem}>
                  <Phone size={20} />
                  <span>+1-804-972-6951</span>
                </div>
                <div className={styles.contactInfoItem}>
                  <Mail size={20} />
                  <span>raji.saran2010@gmail.com</span>
                </div>
              </div>
            </div>

            <div className={styles.contactRight}>
              {status === 'success' ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--success)', marginBottom: '16px' }}>
                    <CheckCircle size={64} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>Message Sent!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Thank you for reaching out. We've received your message and will get back to you shortly.</p>
                  <button onClick={() => setStatus('idle')} className="btn btn-secondary">Send Another Message</button>
                </div>
              ) : (
                <form className={styles.contactForm} onSubmit={handleContactSubmit}>
                  {status === 'error' && (
                    <div style={{ padding: '12px', background: 'var(--error-soft)', color: 'var(--error)', borderRadius: 'var(--radius-md)', margin: '0 0 20px 0', fontSize: '0.9rem', border: '1px solid var(--error)' }}>
                      {errorMsg}
                    </div>
                  )}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder="Your name" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                      disabled={status === 'loading'}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input 
                      type="email" 
                      className={styles.formInput} 
                      placeholder="your@email.com" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                      disabled={status === 'loading'}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Message</label>
                    <textarea 
                      className={styles.formTextarea} 
                      placeholder="How can we help?"
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                      required
                      disabled={status === 'loading'}
                      rows={5}
                    ></textarea>
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={status === 'loading'}>
                    <Send size={18} /> {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
