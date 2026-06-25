'use client';

import { MapPin, Phone, Mail, Send } from 'lucide-react';
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
              <form className={styles.contactForm} onSubmit={e => e.preventDefault()}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Name</label>
                  <input type="text" className={styles.formInput} placeholder="Your name" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input type="email" className={styles.formInput} placeholder="your@email.com" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Message</label>
                  <textarea className={styles.formTextarea} placeholder="How can we help?"></textarea>
                </div>
                <button type="submit" className={styles.submitBtn}>
                  <Send size={18} /> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
