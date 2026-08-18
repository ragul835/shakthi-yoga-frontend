'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './pricing.module.css';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCmsPage } from '@/lib/cms';

interface PassOption {
  id: string;
  name: string;
  description: string;
  priceUsd: string;
  totalClasses: number | null;
  validityDays: number | null;
}

// SVG leaf icon for pass cards
function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 3C21 3 14 3 9 8C4.8 12.2 4 18 4 21C4 21 8.5 18.5 11 16C11.5 19 13.5 21 13.5 21C13.5 21 22 17 22 8C22 5.5 21 3 21 3Z" fill="var(--primary)" opacity="0.2" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 21L10 15" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// Mark the "middle" pass as featured / most popular
function isFeatured(index: number, total: number): boolean {
  if (total === 1) return true;
  return index === Math.floor(total / 2);
}

export default function PricingPage() {
  const cms = useCmsPage('pricing');
  const [options, setOptions] = useState<PassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function fetchOptions() {
      try {
        const data = await apiGet<PassOption[]>('/passes/options', token ?? undefined);
        if (!cancelled) setOptions(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load passes');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchOptions();
    return () => { cancelled = true; };
  }, [token]);

  const handlePurchase = (optionId: string) => {
    if (!user) {
      router.push('/signin?redirect=/pricing');
      return;
    }

    router.push(`/buy-pass/${optionId}`);
  };

  return (
    <>
      <main className={styles.pricingContainer}>
        {/* Hero */}
        <div className={styles.hero}>
          <span className={styles.eyebrow}>{cms.heroEyebrow}</span>
          <h1 className={styles.title}>{cms.heroTitle}</h1>
          <p className={styles.subtitle}>
            {cms.heroDescription}
          </p>
        </div>

        {/* Toast Messages */}
        {error && (
          <div className={styles.toastError} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className={styles.loadingWrap} aria-live="polite">
            <div className={styles.loadingDots}>
              <span />
              <span />
              <span />
            </div>
            <p className={styles.loadingText}>Loading available passes…</p>
          </div>
        ) : options.length === 0 ? (
          <div className={styles.loadingWrap}>
            <p className={styles.loadingText}>No passes available at the moment. Please check back soon.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {options.map((option, index) => {
              const featured = isFeatured(index, options.length);

              return (
                <div
                  key={option.id}
                  className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}
                >
                  {featured && (
                    <div className={styles.popularBadge}>Most Popular</div>
                  )}

                  {/* Icon */}
                  <div className={styles.cardIcon}>
                    <LeafIcon />
                  </div>

                  {/* Header */}
                  <div className={styles.cardHeader}>
                    <h2 className={styles.passName}>{option.name}</h2>

                    <div className={styles.priceRow}>
                      <span className={styles.priceCurrency}>$</span>
                      <span className={styles.passPrice}>
                        {Number(option.priceUsd).toFixed(0)}
                      </span>
                      {Number(option.priceUsd) % 1 !== 0 && (
                        <span className={styles.pricePer}>
                          .{String(Number(option.priceUsd).toFixed(2)).split('.')[1]}
                        </span>
                      )}
                    </div>

                    <p className={styles.passDescription}>{option.description}</p>
                  </div>

                  <div className={styles.divider} />

                  {/* Features */}
                  <ul className={styles.features}>
                    <li>
                      <span className={styles.checkIcon}>✓</span>
                      {option.totalClasses
                        ? `${option.totalClasses} class${option.totalClasses > 1 ? 'es' : ''} included`
                        : 'Unlimited classes'}
                    </li>
                    <li>
                      <span className={styles.checkIcon}>✓</span>
                      {option.validityDays
                        ? `Valid for ${option.validityDays} days`
                        : 'No expiry date'}
                    </li>
                    <li>
                      <span className={styles.checkIcon}>✓</span>
                      Access to all regular classes
                    </li>
                    <li>
                      <span className={styles.checkIcon}>✓</span>
                      Book & manage via dashboard
                    </li>
                  </ul>

                  {/* CTA */}
                  <button
                    id={`buy-pass-${option.id}`}
                    className={`${styles.buyButton} ${featured ? styles.buyButtonFeatured : ''}`}
                    onClick={() => handlePurchase(option.id)}
                    aria-label={`Purchase ${option.name} for $${Number(option.priceUsd).toFixed(2)}`}
                  >
                    <>
                      {user ? 'Get Started' : 'Sign In to Buy'}
                      <span aria-hidden="true">→</span>
                    </>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {!loading && options.length > 0 && (
          <p className={styles.footerNote}>
            <span>🔒</span>
            {cms.footerNote}
          </p>
        )}
      </main>
    </>
  );
}
