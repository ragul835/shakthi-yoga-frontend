'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { useCmsPage } from '@/lib/cms';
import styles from './Footer.module.css';

const socialLinkDefinitions = [
  {
    name: 'Instagram', key: 'instagramUrl',
    icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>,
  },
  {
    name: 'Facebook',
    key: 'facebookUrl',
    icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>,
  },
  {
    name: 'YouTube',
    key: 'youtubeUrl',
    icon: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></>,
  },
];

export default function Footer() {
  const cms = useCmsPage('contact');
  const pathname = usePathname();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setNewsletterStatus('error');
      setNewsletterMessage('Enter a valid email address.');
      return;
    }

    setNewsletterStatus('loading');
    setNewsletterMessage('');
    try {
      const result = await apiPost<{ message: string }>('/newsletter/subscribe', { email });
      setNewsletterEmail('');
      setNewsletterStatus('success');
      setNewsletterMessage(result.message);
    } catch (error) {
      setNewsletterStatus('error');
      setNewsletterMessage(error instanceof Error ? error.message : 'Could not subscribe. Please try again.');
    }
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  // Hide CTA banner on auth, dashboard, and admin pages
  const hideCtaBanner = ['/signin', '/register', '/dashboard', '/admin'].some(path => pathname?.startsWith(path));

  return (
    <>
      {!hideCtaBanner && (
        <section className={styles.ctaBanner}>
          <div className="container">
            <h2>{cms.ctaTitle}</h2>
            <p>{cms.ctaDescription}</p>
            <Link href="/register" className={`btn btn-secondary ${styles.ctaButton}`}>
              Start for Free &rarr;
            </Link>
          </div>
        </section>
      )}
      
      <footer className={styles.footer}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.grid}>
            <div className={styles.brand}>
              <Link href="/" className={styles.logo} aria-label="Shakthi Yoga home">
                <div className={styles.logoIcon} style={{ background: 'transparent', padding: 0 }}>
                  <span className={styles.logoImage} role="img" aria-label="" style={{ backgroundImage: `url("${cms.logoImageUrl.replaceAll('"', '%22')}")` }} />
                </div>
                <span className={styles.logoText}>{cms.studioName}</span>
              </Link>
              <p className={styles.desc}>
                {cms.studioDescription}
              </p>
              <div className={styles.social} aria-label="Shakthi Yoga social media">
                {socialLinkDefinitions.map((social) => (
                  <a
                    key={social.name}
                    href={cms[social.key]}
                    aria-label={`Follow Shakthi Yoga on ${social.name}`}
                    className={styles.socialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {social.icon}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div className={styles.column}>
              <h4 className={styles.colTitle}>QUICK LINKS</h4>
              <Link href="/" className={styles.footerLink}>Home</Link>
              <Link href="/about" className={styles.footerLink}>About Us</Link>
              <Link href="/classes" className={styles.footerLink}>Classes</Link>
              <Link href="/register" className={styles.footerLink}>Get Started</Link>
            </div>

            <div className={styles.column}>
              <h4 className={styles.colTitle}>CONTACT</h4>
              <div className={styles.contactItem}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{cms.location}</span>
              </div>
              <div className={styles.contactItem}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <a href={`tel:${cms.phone.replace(/[^+\d]/g, '')}`} className={styles.contactLink}>{cms.phone}</a>
              </div>
              <div className={styles.contactItem}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <a href={`mailto:${cms.email}`} className={styles.contactLink}>{cms.email}</a>
              </div>
            </div>

            <div className={styles.column}>
              <h4 className={styles.colTitle}>NEWSLETTER</h4>
              <p className={styles.newsletterDesc}>{cms.newsletterDescription}</p>
              <p className={styles.newsletterConsent}>By subscribing, you agree to receive email updates. You can unsubscribe anytime.</p>
              <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit} noValidate>
                <label htmlFor="newsletter-email" className={styles.srOnly}>Email address</label>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="your@email.com"
                  className={styles.newsletterInput}
                  value={newsletterEmail}
                  onChange={(event) => {
                    setNewsletterEmail(event.target.value);
                    if (newsletterStatus !== 'loading') setNewsletterStatus('idle');
                  }}
                  aria-describedby="newsletter-status"
                  required
                  disabled={newsletterStatus === 'loading'}
                />
                <button type="submit" className={`btn btn-primary ${styles.newsletterBtn}`} disabled={newsletterStatus === 'loading'}>
                  {newsletterStatus === 'loading' ? 'Subscribing…' : 'Subscribe'}
                </button>
                <p
                  id="newsletter-status"
                  className={`${styles.newsletterStatus} ${newsletterStatus === 'error' ? styles.newsletterError : ''}`}
                  role={newsletterStatus === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                >
                  {newsletterMessage}
                </p>
              </form>
            </div>
          </div>

          <div className={styles.bottom}>
            <p>&copy; {new Date().getFullYear()} {cms.studioName}. All rights reserved.</p>
            <div className={styles.bottomLinks}>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
