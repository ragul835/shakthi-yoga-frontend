'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import styles from './classes.module.css';

interface ClassItem {
  id: string;
  name: string;
  type: string;
  instructor: { user: { name: string } };
  scheduleDay: string;
  scheduleTime: string;
  durationMinutes: number;
  priceUsd: string;
  maxCapacity: number;
  currentEnrollment: number;
  experienceLevel: string;
  ageGroup: string;
  status: string;
  shortDescription?: string;
  description?: string;
}

/* ─── Skeleton Loader ─── */
function SkeletonCards() {
  return (
    <div className={styles.loadingGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={styles.skeletonCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div className={styles.skeletonLine} style={{ width: '50%', height: '20px' }} />
            <div className={styles.skeletonLine} style={{ width: '20%', height: '20px' }} />
          </div>
          <div className={styles.skeletonLine} style={{ width: '75%', height: '28px', marginTop: '16px' }} />
          <div className={styles.skeletonLine} style={{ width: '100%', height: '14px', marginTop: '12px' }} />
          <div className={styles.skeletonLine} style={{ width: '85%', height: '14px', marginTop: '8px' }} />
          <div className={styles.skeletonLine} style={{ width: '60%', height: '14px', marginTop: '8px' }} />
          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <div className={styles.skeletonLine} style={{ width: '100%', height: '44px', borderRadius: '999px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Content ─── */
function ClassesContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const initialAgeGroup = searchParams.get('age') || '';
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [ageGroupFilter, setAgeGroupFilter] = useState(initialAgeGroup);
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiGet<any>('/classes/public?limit=100');
        const data = Array.isArray(res) ? res : (res.data ?? []);
        setClasses(data);
      } catch {
        setError('Could not load classes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const filtered = classes.filter((c) => {
    if (c.status === 'INACTIVE') return false;
    if (ageGroupFilter && c.ageGroup !== ageGroupFilter) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (isLoading) return <SkeletonCards />;

  if (error) {
    return (
      <div className={styles.contentWrapper}>
        <div className={styles.errorState}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '8px' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentWrapper}>
      {/* ─── Filter & Search Controls ─── */}
      <div className={styles.controlsBar}>
        {/* Row 1: Age group tabs + Search */}
        <div className={styles.controlsRow}>
          <div className={styles.tabs} role="tablist" aria-label="Filter by age group">
            {[
              { label: 'All Classes', value: '' },
              { label: 'Kids', value: 'KIDS' },
              { label: 'Adults', value: 'ADULTS' },
            ].map(({ label, value }) => (
              <button
                key={value}
                role="tab"
                aria-selected={ageGroupFilter === value}
                className={`${styles.tabBtn} ${ageGroupFilter === value ? styles.tabActive : ''}`}
                onClick={() => setAgeGroupFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search classes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search classes"
            />
          </div>
        </div>

        {/* Row 2: Type tabs + Results count */}
        <div className={styles.controlsRowSecond}>
          <div className={styles.tabs} role="tablist" aria-label="Filter by class type">
            {[
              { label: 'All Types', value: '' },
              { label: 'Group Classes', value: 'GROUP' },
              { label: '1-on-1 Sessions', value: 'ONE_ON_ONE' },
            ].map(({ label, value }) => (
              <button
                key={value}
                role="tab"
                aria-selected={typeFilter === value}
                className={`${styles.tabBtn} ${typeFilter === value ? styles.tabActive : ''}`}
                onClick={() => setTypeFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <p className={styles.resultsCount}>
            <strong>{filtered.length}</strong> class{filtered.length !== 1 ? 'es' : ''} available
          </p>
        </div>
      </div>

      {/* ─── Class Cards Grid ─── */}
      {filtered.length === 0 ? (
        <div className={styles.classGrid}>
          <div className={styles.emptyState}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p>
              {search
                ? `No classes found matching "${search}"`
                : 'No classes available with these filters. Try adjusting your selection.'}
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.classGrid}>
          {filtered.map((c, i) => {
            const seatsLeft = Math.max(0, c.maxCapacity - c.currentEnrollment);
            const fillPct = Math.min(100, Math.round((c.currentEnrollment / c.maxCapacity) * 100));
            const isFull = c.status === 'FULL' || seatsLeft === 0;
            const isOneOnOne = c.type === 'ONE_ON_ONE';
            const isKids = c.ageGroup === 'KIDS';

            return (
              <div
                key={c.id}
                className={styles.classCard}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* ── Card Header ── */}
                <div className={styles.cardHeader}>
                  <span
                    className={`${styles.badge} ${isOneOnOne ? styles.badgeOneOnOne : ''} ${isKids ? styles.badgeKids : ''}`}
                  >
                    {isKids ? '🧒 Kids' : 'Adults'}&nbsp;·&nbsp;
                    {isOneOnOne ? '1-on-1' : 'Group'}&nbsp;·&nbsp;
                    {c.experienceLevel}
                  </span>
                  <div className={styles.price}>${parseFloat(c.priceUsd).toFixed(0)}</div>
                </div>

                {/* ── Class Name & Description ── */}
                <h3 className={styles.className}>{c.name}</h3>
                <p className={styles.classDesc}>
                  {c.shortDescription || c.description || 'Join this class for a transformative yoga experience.'}
                </p>

                {/* ── Meta Info ── */}
                <div className={styles.metaList}>
                  <div className={styles.metaItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {c.instructor?.user?.name ?? 'TBA'}
                  </div>
                  <div className={styles.metaItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {c.scheduleDay} at {c.scheduleTime}
                  </div>
                  <div className={styles.metaItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {c.durationMinutes} minutes
                  </div>
                </div>

                {/* ── Capacity Bar (Group only) ── */}
                {!isOneOnOne && (
                  <div className={styles.capacity}>
                    <div className={styles.capacityHeader}>
                      <span>Availability</span>
                      <span>{isFull ? 'Class Full' : `${seatsLeft} spot${seatsLeft !== 1 ? 's' : ''} left`}</span>
                    </div>
                    <div className={styles.capacityBar}>
                      <div
                        className={`${styles.capacityFill} ${isFull ? styles.capacityFillFull : ''}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* ── CTA Button ── */}
                <div className={styles.cardActions}>
                  {isFull ? (
                    <button className={`btn btn-secondary ${styles.bookBtn}`} disabled>
                      Class Full
                    </button>
                  ) : (
                    <Link
                      href={`/book/${c.id}`}
                      className={`btn btn-primary ${styles.bookBtn}`}
                    >
                      Book Class →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Page Shell ─── */
export default function ClassesPage() {
  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <p className={styles.headerEyebrow}>Schedule</p>
              <h1 className={styles.title}>
                All <span className={styles.titleAccent}>Classes</span>
              </h1>
              <p className={styles.headerSubtitle}>
                Group sessions and private instruction for every body and every stage of practice.
              </p>
            </div>

            <div className={styles.headerActions}>
              <Link
                href="/pricing"
                className="btn btn-primary"
                style={{ gap: '8px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                View Class Passes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className={styles.mainSection}>
        <div className="container">
          <Suspense fallback={<SkeletonCards />}>
            <ClassesContent />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
