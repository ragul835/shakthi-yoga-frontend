'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle } from 'lucide-react';
import styles from './about.module.css';
import { useCmsPage } from '@/lib/cms';

const fallbackInstructors = [
  { 
    name: 'Saranya (Raji)', 
    specialization: 'Founder, Vinyasa & Meditation', 
    image: '',
    bio: 'With over 15 years of practice, Saranya founded SHAKTHI YOGA to create a space where movement meets mindfulness. She specializes in flowing sequences that connect breath to body.'
  }
];

export default function AboutPage() {
  const cms = useCmsPage('about');
  const contactCms = useCmsPage('contact');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [instructors, setInstructors] = useState(fallbackInstructors);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/api').then(({ apiGet }) => apiGet<any[]>('/instructors/public')).then(data => {
      if (cancelled || !Array.isArray(data) || data.length === 0) return;
      setInstructors(data.map(instructor => ({
        name: instructor.user?.name || 'Yoga Instructor',
        specialization: instructor.specialization || 'Yoga Instructor',
        image: instructor.photoUrl || instructor.user?.profilePhotoUrl || '',
        bio: instructor.bio || 'Dedicated to guiding every student with care and intention.',
      })));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
          <p className={styles.subtext}>{cms.heroEyebrow}</p>
          <h1 className={styles.title}>{cms.heroTitle}</h1>
        </div>
      </section>

      {/* Story Split Section */}
      <section className={styles.storySection}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyContent}>
              <h2>{cms.storyTitle}</h2>
              <p>{cms.storyParagraphOne}</p>
              <p>{cms.storyParagraphTwo}</p>
              <p>{cms.storyParagraphThree}</p>
              
              <div className={styles.signature}>
                <p>Saranya (Raji)</p>
                <span>Founder & Lead Instructor</span>
              </div>
            </div>
            
            <div className={styles.storyVisual}>
              <div className={styles.visualImage} role="img" aria-label="Yoga practice" style={{ backgroundImage: `url("${cms.storyImageUrl.replaceAll('"', '%22')}")` }} />
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
            <p className={styles.subtext}>{cms.teamEyebrow}</p>
            <h2>{cms.teamTitle}</h2>
          </div>
          
          <div className={styles.teamGrid}>
            {instructors.map((inst, i) => (
              <div key={i} className={styles.teamCard}>
                <div className={styles.teamImageWrap} style={!inst.image ? { background: 'var(--bg-alt)' } : {}}>
                  {inst.image ? (
                    <div className={styles.teamImage} role="img" aria-label={inst.name} style={{ backgroundImage: `url("${inst.image.replaceAll('"', '%22')}")` }} />
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
      <section id="contact" className={styles.contactSection}>
        <div className="container">
          <div className={styles.contactHeader}>
            <p className={styles.subtext}>{cms.contactEyebrow}</p>
            <h2>{cms.contactTitle}</h2>
          </div>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactLeft}>
              <a 
                href={contactCms.mapUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.contactMap}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <MapPin size={32} className={styles.contactMapIcon} />
                <div className={styles.contactMapText}>
                  {contactCms.locationLabel}<br />
                  <span style={{ fontSize: '0.85em', color: 'var(--primary)' }}>View on Google Maps &rarr;</span>
                </div>
              </a>
              
              <div className={styles.contactInfoList}>
                <div className={styles.contactInfoItem}>
                  <MapPin size={20} />
                  <a href={contactCms.mapUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span>{contactCms.location}</span>
                  </a>
                </div>
                <div className={styles.contactInfoItem}>
                  <Phone size={20} />
                  <a href={`tel:${contactCms.phone.replace(/[^+\d]/g, '')}`}>{contactCms.phone}</a>
                </div>
                <div className={styles.contactInfoItem}>
                  <Mail size={20} />
                  <a href={`mailto:${contactCms.email}`}>{contactCms.email}</a>
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
