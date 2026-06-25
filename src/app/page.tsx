'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import styles from './page.module.css';

const upcomingClassesFallback = [
  { id: '1', name: 'Morning Vinyasa Flow', description: 'A dynamic sequence connecting breath to movement, building heat and inner clarity. Perfect for starting your day with intention.', scheduleTime: '7:00 AM', scheduleDay: 'Monday', durationMinutes: 60, instructor: { user: { name: 'Saranya (Raji)' } }, currentEnrollment: 11, maxCapacity: 16, type: 'GROUP' },
  { id: '2', name: 'Private Ashtanga Session', description: 'One-on-one attention to deepen your Ashtanga practice. Marcus tailors the session entirely to your stage of the Primary Series.', scheduleTime: 'By Appointment', scheduleDay: 'Flexible', durationMinutes: 75, instructor: { user: { name: 'Marcus Chen' } }, currentEnrollment: 0, maxCapacity: 1, type: 'ONE_ON_ONE' },
  { id: '3', name: 'Restorative Yin', description: 'Long-held floor postures targeting the connective tissue, supported by props. The antidote to a hectic week.', scheduleTime: '6:00 PM', scheduleDay: 'Thursday', durationMinutes: 75, instructor: { user: { name: 'Saranya (Raji)' } }, currentEnrollment: 3, maxCapacity: 14, type: 'GROUP' }
];

export default function Home() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testRes, classRes] = await Promise.all([
          apiGet<any>('/testimonials/public'),
          apiGet<any>('/classes/public?limit=3')
        ]);
        setTestimonials(Array.isArray(testRes) ? testRes : testRes.data ?? []);
        setClasses(Array.isArray(classRes) ? classRes : classRes.data ?? []);
      } catch (err) {
        console.error('Failed to load data', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.page}>
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroOverlay}></div>
        </div>
        
        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Brooklyn&apos;s Mindful Movement Studio</span>
            <h1 className={styles.heroTitle}>
              Find stillness<br />
              <span className={styles.italic}>within</span> the flow.
            </h1>
            <p className={styles.heroDesc}>
              SHAKTHI YOGA offers thoughtfully sequenced yoga classes — group and private — for every body and every stage of practice.
            </p>
            <div className={styles.heroActions}>
              <Link href="/register" className="btn btn-primary">
                Register Now <span className={styles.arrow}>→</span>
              </Link>
              <Link href="/classes" className={`btn btn-secondary ${styles.btnOutline}`}>
                View Classes
              </Link>
            </div>
            
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>500+</span>
                <span className={styles.statLabel}>Students</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNum}>12+</span>
                <span className={styles.statLabel}>Years</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNum}>4.9</span>
                <span className={styles.statLabel}>Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Shakthi Section */}
      <section className={`section ${styles.featuresSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-label">Why Shakthi</span>
            <h2 className="section-title">
              Yoga with intention,<br />
              <span className={styles.italic}>community</span> at the center.
            </h2>
          </div>
          
          <div className={`grid grid-3 ${styles.featuresGrid}`}>
            <div className={`card card-alt ${styles.featureCard}`}>
              <div className={styles.featureIcon}>♡</div>
              <h3>Mind & Body Balance</h3>
              <p>Our classes are designed to cultivate harmony between physical strength and mental stillness.</p>
            </div>
            <div className={`card card-alt ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🛡</div>
              <h3>Expert Instructors</h3>
              <p>Every teacher holds advanced certifications and brings years of dedicated practice to each session.</p>
            </div>
            <div className={`card card-alt ${styles.featureCard}`}>
              <div className={styles.featureIcon}>✨</div>
              <h3>Small Class Sizes</h3>
              <p>With intentionally limited enrollment, you receive personalized attention in every session.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Classes Preview */}
      <section className={`section ${styles.classesSection}`}>
        <div className="container">
          <div className={styles.classesHeader}>
            <div>
              <span className="section-label">Join us</span>
              <h2 className="section-title">Upcoming Classes</h2>
            </div>
            <Link href="/classes" className="btn btn-ghost">See Full Schedule →</Link>
          </div>
          
          <div className="grid grid-3">
            {(classes.length > 0 ? classes : upcomingClassesFallback).map((c) => {
              const seatsLeft = c.maxCapacity - c.currentEnrollment;
              const fillPct = Math.min(100, Math.round((c.currentEnrollment / c.maxCapacity) * 100));
              return (
              <div key={c.id} className={`card ${styles.classCard}`}>
                <div className={styles.classCardHeader}>
                  <h3 className={styles.classTitle}>{c.name}</h3>
                  <p className={styles.classDesc}>{c.description || c.desc}</p>
                </div>
                
                <div className={styles.classMeta}>
                  <div className={styles.metaItem}>
                    <span>⏱</span> {c.durationMinutes} min · {c.scheduleDay} · {c.scheduleTime}
                  </div>
                  <div className={styles.metaItem}>
                    <span>👥</span> {seatsLeft} of {c.maxCapacity} seats left
                  </div>
                  <div className={styles.capacityBar}>
                    <div className={styles.capacityFill} style={{ width: `${fillPct}%` }}></div>
                  </div>
                </div>
                
                <div className={styles.classFooter}>
                  <div className={styles.instructor}>
                    <div className={styles.instructorAvatar}></div>
                    <span className={styles.instructorName}>{c.instructor?.user?.name || c.instructor}</span>
                  </div>
                  <Link href="/classes" className={`btn btn-primary ${styles.bookBtn}`}>
                    Register / Book
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`section ${styles.testimonialsSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-label">Student Stories</span>
            <h2 className="section-title">Words from our community</h2>
          </div>
          
          <div className="grid grid-3">
            {testimonials.length > 0 ? testimonials.map((t, i) => (
              <div key={t.id || i} className={`card card-alt ${styles.testimonialCard}`}>
                <div className={styles.stars}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                <p className={styles.quote}>&quot;{t.content}&quot;</p>
                <div className={styles.author}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{t.studentName}</strong>
                    {t.source === 'GOOGLE' && <span style={{ color: '#1a73e8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12,2C8.1,2,5,5.1,5,9c0,5.2,7,13,7,13s7-7.8,7-13C19,5.1,15.9,2,12,2z M12,11.5c-1.4,0-2.5-1.1-2.5-2.5s1.1-2.5,2.5-2.5s2.5,1.1,2.5,2.5S13.4,11.5,12,11.5z"/></svg> Google Maps</span>}
                  </div>
                </div>
              </div>
            )) : [
              { text: "SHAKTHI YOGA completely transformed my approach to movement. The instructors are incredibly attentive and the community is so welcoming.", author: "Elena R.", type: "Vinyasa Student", source: 'GOOGLE' },
              { text: "The private Ashtanga sessions with Marcus helped me overcome a persistent shoulder issue. I'm stronger and more flexible than ever.", author: "David K.", type: "Private Client", source: 'GOOGLE' },
              { text: "Finding this studio was a blessing. The restorative Yin classes are the perfect reset button for my stressful corporate job.", author: "Sarah M.", type: "Restorative Student", source: 'GOOGLE' }
            ].map((t, i) => (
              <div key={i} className={`card card-alt ${styles.testimonialCard}`}>
                <div className={styles.stars}>★★★★★</div>
                <p className={styles.quote}>&quot;{t.text}&quot;</p>
                <div className={styles.author}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{t.author}</strong>
                    {t.source === 'GOOGLE' ? (
                      <span style={{ color: '#1a73e8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12,2C8.1,2,5,5.1,5,9c0,5.2,7,13,7,13s7-7.8,7-13C19,5.1,15.9,2,12,2z M12,11.5c-1.4,0-2.5-1.1-2.5-2.5s1.1-2.5,2.5-2.5s2.5,1.1,2.5,2.5S13.4,11.5,12,11.5z"/></svg> Google Maps</span>
                    ) : (
                      <span>{t.type}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
    </div>
  );
}
