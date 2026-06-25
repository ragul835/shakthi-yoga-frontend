'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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

function ClassesContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const initialAgeGroup = searchParams.get('age') || '';
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [ageGroupFilter, setAgeGroupFilter] = useState(initialAgeGroup);
  const [search, setSearch] = useState('');
  const { isAuthenticated } = useAuth();

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
      } catch (e: any) {
        setError('Could not load classes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const filtered = classes.filter(c => {
    if (c.status === 'INACTIVE') return false;
    if (ageGroupFilter && c.ageGroup !== ageGroupFilter) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className={styles.contentWrapper}>
        <div className={styles.loadingGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} style={{ width: '60%', height: '12px' }} />
              <div className={styles.skeletonLine} style={{ width: '80%', height: '22px', marginTop: '12px' }} />
              <div className={styles.skeletonLine} style={{ width: '100%', height: '14px', marginTop: '8px' }} />
              <div className={styles.skeletonLine} style={{ width: '40%', height: '14px', marginTop: '6px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.contentWrapper}>
        <div className={styles.errorState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.controlsBar} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.tabs}>
            <button className={`${styles.tabBtn} ${ageGroupFilter === '' ? styles.tabActive : ''}`} onClick={() => setAgeGroupFilter('')}>All Classes</button>
            <button className={`${styles.tabBtn} ${ageGroupFilter === 'KIDS' ? styles.tabActive : ''}`} onClick={() => setAgeGroupFilter('KIDS')}>Kids Classes</button>
            <button className={`${styles.tabBtn} ${ageGroupFilter === 'ADULTS' ? styles.tabActive : ''}`} onClick={() => setAgeGroupFilter('ADULTS')}>Adult Classes</button>
          </div>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className={styles.searchInput} placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className={styles.tabs} style={{ alignSelf: 'flex-start' }}>
          <button className={`${styles.tabBtn} ${typeFilter === '' ? styles.tabActive : ''}`} onClick={() => setTypeFilter('')}>All Types</button>
          <button className={`${styles.tabBtn} ${typeFilter === 'GROUP' ? styles.tabActive : ''}`} onClick={() => setTypeFilter('GROUP')}>Group Classes</button>
          <button className={`${styles.tabBtn} ${typeFilter === 'ONE_ON_ONE' ? styles.tabActive : ''}`} onClick={() => setTypeFilter('ONE_ON_ONE')}>1-on-1 Sessions</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>{search ? `No classes found matching "${search}"` : 'No classes available right now. Check back soon!'}</p>
        </div>
      ) : (
        <div className={styles.classGrid}>
          {filtered.map((c, i) => (
            <div key={c.id} className={styles.classCard} style={{ animationDelay: `${i * 50}ms` }}>
              <div className={styles.cardHeader}>
                <span className={styles.badge}>
                  {c.ageGroup === 'KIDS' ? 'Kids' : 'Adults'} • {c.type === 'ONE_ON_ONE' ? '1-on-1' : 'Group'} • {c.experienceLevel}
                </span>
                <div className={styles.price}>${parseFloat(c.priceUsd).toFixed(2)}</div>
              </div>

              <h3 className={styles.className}>{c.name}</h3>
              <p className={styles.classDesc}>{c.shortDescription || c.description || 'Join this class for a transformative yoga experience.'}</p>

              <div className={styles.metaList}>
                <div className={styles.metaItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {c.instructor?.user?.name ?? 'TBA'}
                </div>
                <div className={styles.metaItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {c.scheduleDay} at {c.scheduleTime}
                </div>
                <div className={styles.metaItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {c.durationMinutes} minutes
                </div>
              </div>

              {c.type === 'GROUP' && (
                <div className={styles.capacity}>
                  <div className={styles.capacityHeader}>
                    <span>Availability</span>
                    <span>{Math.max(0, c.maxCapacity - c.currentEnrollment)} spots left</span>
                  </div>
                  <div className={styles.capacityBar}>
                    <div className={styles.capacityFill} style={{ width: `${Math.min(100, (c.currentEnrollment / c.maxCapacity) * 100)}%` }} />
                  </div>
                </div>
              )}

              <div className={styles.cardActions}>
                {c.status === 'FULL' || c.currentEnrollment >= c.maxCapacity ? (
                  <button className={`btn btn-secondary ${styles.bookBtn}`} disabled>Class Full</button>
                ) : (
                  <Link href={`/book/${c.id}`} className={`btn btn-primary ${styles.bookBtn}`}>
                    Book Class
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClassesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className="container">
          <p className={styles.subtext}>Schedule</p>
          <h1 className={styles.title}>All Classes</h1>
        </div>
      </div>

      <section className={styles.mainSection}>
        <div className="container">
          <Suspense fallback={<div className={styles.loading}>Loading schedule...</div>}>
            <ClassesContent />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
