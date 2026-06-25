'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
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

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Classes', path: '/classes' },
  ];

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.navContainer}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon} style={{ background: 'transparent', padding: 0 }}>
            <img src="/logo.png" alt="Shakthi Yoga Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span className={styles.logoText}>SHAKTHI YOGA</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <div className={styles.navLinks}>
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                className={`${styles.navLink} ${pathname === link.path ? styles.active : ''}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className={styles.navActions}>
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
          aria-label="Toggle menu"
        >
          <div className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`} />
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.mobileLinks}>
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              href={link.path}
              className={`${styles.mobileLink} ${pathname === link.path ? styles.active : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          <div className={styles.mobileActions}>
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
