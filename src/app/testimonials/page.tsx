'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import styles from '../page.module.css';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const testRes = await apiGet<any>('/testimonials/public');
        setTestimonials(Array.isArray(testRes) ? testRes : testRes.data ?? []);
      } catch (err) {
        console.error('Failed to load testimonials', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.page}>
      <section className={`section ${styles.testimonialsSection}`} style={{ paddingTop: '120px' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-label">Student Stories</span>
            <h1 className="section-title">All Reviews</h1>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              Loading reviews...
            </div>
          ) : testimonials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              No reviews available yet.
            </div>
          ) : (
            <div className="grid grid-3">
              {testimonials.map((t: any, i: number) => (
                <div key={t.id || i} className={`card card-alt ${styles.testimonialCard}`}>
                  <div className={styles.stars}>{'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}</div>
                  <p className={styles.quote}>&quot;{t.content || t.text}&quot;</p>
                  <div className={styles.author}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{t.studentName || t.author}</strong>
                      {t.source === 'GOOGLE' ? (
                        <span style={{ color: '#1a73e8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12,2C8.1,2,5,5.1,5,9c0,5.2,7,13,7,13s7-7.8,7-13C19,5.1,15.9,2,12,2z M12,11.5c-1.4,0-2.5-1.1-2.5-2.5s1.1-2.5,2.5-2.5s2.5,1.1,2.5,2.5S13.4,11.5,12,11.5z"/></svg> Google Maps</span>
                      ) : (
                        <span>{t.type || 'Student'}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
