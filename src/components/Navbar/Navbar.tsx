'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';
import { useCmsPage } from '@/lib/cms';
import PwaInstallButton from '@/components/PwaInstallButton';

export default function Navbar() {
  const cms = useCmsPage('contact');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Classes', path: '/classes' },
    { name: 'Class Passes', path: '/pricing' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`} aria-label="Primary navigation">
      <div className={`container ${styles.navContainer}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>
          <div className={styles.logoIcon} style={{ background: 'transparent', padding: 0 }}>
            <span className={styles.logoImage} role="img" aria-label="" style={{ backgroundImage: `url("${cms.logoImageUrl.replaceAll('"', '%22')}")` }} />
          </div>
          <span className={styles.logoText}>{cms.studioName}</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <div className={styles.navLinks}>
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                className={`${styles.navLink} ${pathname === link.path ? styles.active : ''}`}
                aria-current={pathname === link.path ? 'page' : undefined}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className={styles.navActions}>
            <PwaInstallButton />
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <Link href={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} className="btn btn-secondary">
                  Dashboard
                </Link>
                <button onClick={logout} className="btn btn-ghost">Logout</button>
              </div>
            ) : (
              <>
                <Link href="/signin" className="btn btn-secondary" style={{ padding: '8px 24px' }}>Sign In</Link>
                <Link href="/register" className="btn btn-primary" style={{ padding: '8px 24px' }}>Register</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={styles.mobileToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          type="button"
        >
          <div className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`} />
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div id="mobile-navigation" aria-hidden={!isMobileMenuOpen} className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.mobileLinks}>
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              href={link.path}
              className={`${styles.mobileLink} ${pathname === link.path ? styles.active : ''}`}
              aria-current={pathname === link.path ? 'page' : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          <div className={styles.mobileActions}>
            <PwaInstallButton onInstalled={() => setIsMobileMenuOpen(false)} />
            {isAuthenticated ? (
              <>
                <Link href={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} className="btn btn-secondary" onClick={() => setIsMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="btn btn-ghost">Logout</button>
              </>
            ) : (
              <>
                <Link href="/signin" className="btn btn-secondary" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                <Link href="/register" className="btn btn-primary" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
