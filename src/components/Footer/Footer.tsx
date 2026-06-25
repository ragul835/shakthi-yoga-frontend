'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname();
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
            <h2>Your practice begins with one step.</h2>
            <p>Join SHAKTHI YOGA today and receive your first group class at no charge.</p>
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
              <div className={styles.logo}>
                <div className={styles.logoIcon} style={{ background: 'transparent', padding: 0 }}>
                  <img src="/logo.png" alt="Shakthi Yoga Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <span className={styles.logoText}>SHAKTHI YOGA</span>
              </div>
              <p className={styles.desc}>
                A sanctuary for mindful movement. We offer in-person and online yoga classes for every level.
              </p>
              <div className={styles.social}>
                <a href="#" aria-label="Instagram" className={styles.socialLink}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" aria-label="Facebook" className={styles.socialLink}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" aria-label="Twitter" className={styles.socialLink}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" aria-label="YouTube" className={styles.socialLink}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                </a>
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
                <span>Online Classes</span>
              </div>
              <div className={styles.contactItem}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>+1-804-972-6951</span>
              </div>
              <div className={styles.contactItem}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>raji.saran2010@gmail.com</span>
              </div>
            </div>

            <div className={styles.column}>
              <h4 className={styles.colTitle}>NEWSLETTER</h4>
              <p className={styles.newsletterDesc}>Monthly reflections, class updates, and seasonal workshop announcements.</p>
              <form className={styles.newsletterForm}>
                <input type="email" placeholder="your@email.com" className={styles.newsletterInput} />
                <button type="button" className={`btn btn-primary ${styles.newsletterBtn}`}>Subscribe</button>
              </form>
            </div>
          </div>

          <div className={styles.bottom}>
            <p>&copy; {new Date().getFullYear()} SHAKTHI YOGA. All rights reserved.</p>
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
