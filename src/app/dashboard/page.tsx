'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, CalendarRange, History, CreditCard, User,
  CheckCircle, XCircle, LogOut, Video, Download, Camera, ClipboardCheck, Menu, Ticket
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatAttendanceDate, getMakeupCreditExpiry, getMakeupCreditStatus } from '@/lib/attendance';
import { formatUserPassStatus, getUserPassStatus } from '@/lib/pass';
import styles from './dashboard.module.css';

const tabs = [
  { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'classes', label: 'My Classes', icon: <CalendarRange size={18} /> },
  { id: 'history', label: 'History', icon: <History size={18} /> },
  { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { id: 'passes', label: 'My Passes', icon: <Ticket size={18} /> },
  { id: 'review', label: 'Write Review', icon: <CheckCircle size={18} /> },
  { id: 'profile', label: 'Profile', icon: <User size={18} /> },
];

const samplePayments = [
  { id: '1', date: 'Jun 4, 2026', className: 'Morning Vinyasa Flow', amount: 28, status: 'Success' },
  { id: '2', date: 'Jun 6, 2026', className: 'Power Yoga Sculpt', amount: 28, status: 'Success' },
  { id: '3', date: 'Jun 9, 2026', className: 'Morning Vinyasa Flow', amount: 28, status: 'Success' },
  { id: '4', date: 'Jun 12, 2026', className: 'Restorative Yin', amount: 24, status: 'Refunded' },
  { id: '5', date: 'Jun 14, 2026', className: 'Gentle Breathwork & Yoga', amount: 22, status: 'Failed' },
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ totalRegistered: 0, attended: 0, missed: 0 });
  const [reviewForm, setReviewForm] = useState({ content: '', rating: 5 });
  const [reviewStatus, setReviewStatus] = useState({ loading: false, success: false, error: '' });
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const successParam = searchParams.get('success');
      if (successParam === 'booking') {
        setToastMessage('🎉 Class booked successfully!');
        window.history.replaceState({}, '', '/dashboard');
      } else if (successParam === 'pass') {
        setToastMessage('🎉 Pass purchased successfully!');
        window.history.replaceState({}, '', '/dashboard');
      }
      
      if (successParam) {
        setTimeout(() => setToastMessage(''), 5000);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchDashboardData = async () => {
        setDashboardError('');
        setLoadingEnrollments(true);
        try {
          const [enrollRes, statsRes, attendanceRes, passesRes] = await Promise.all([
            apiGet<any>('/enrollments/my?limit=50', token),
            apiGet<any>('/attendance/my/stats', token).catch(() => ({ total: 0, attended: 0, missed: 0 })),
            apiGet<any>('/attendance/my', token).catch(() => []),
            apiGet<any>('/passes/me', token).catch(() => [])
          ]);
          
          const data = Array.isArray(enrollRes) ? enrollRes : enrollRes.data ?? [];
          if (!Array.isArray(data)) throw new Error('Invalid enrollment response');
          setAttendanceStats({
            totalRegistered: enrollRes.meta?.total ?? data.length ?? 0,
            attended: statsRes.attended || 0,
            missed: statsRes.missed || 0,
          });
          
          setAttendanceRecords(attendanceRes.data || attendanceRes || []);
          setPasses(passesRes.data || passesRes || []);
          
          const mapped = data.map((e: any) => {
            const dateObj = new Date(e.class?.scheduleDay || e.enrolledAt);
              const hasAttendance = Array.isArray(e.attendances) && e.attendances.length > 0;
              const isAttended = hasAttendance ? e.attendances[0].attended : false;
              let derivedStatus = e.status === 'APPROVED' || e.status === 'ACTIVE' ? 'Upcoming' : e.status === 'COMPLETED' ? 'Completed' : 'Cancelled';
              
              let classHasEnded = false;
              if (e.class?.scheduleDay && e.class?.scheduleTime) {
                try {
                  const [time, modifier] = e.class.scheduleTime.split(' ');
                  const [hoursValue, minutes] = time.split(':').map(Number);
                  let hours = hoursValue;
                  if (modifier === 'PM' && hours < 12) hours += 12;
                  if (modifier === 'AM' && hours === 12) hours = 0;

                  const endDateTime = new Date(e.class.scheduleDay);
                  const duration = e.class.durationMinutes || 60;
                  endDateTime.setHours(hours, minutes + duration, 0, 0);

                  if (new Date() > endDateTime) {
                    classHasEnded = true;
                  }
                } catch {
                  // ignore
                }
              }

              if (hasAttendance) {
                derivedStatus = isAttended ? 'Present' : 'Absent';
              } else if (classHasEnded && (e.status === 'APPROVED' || e.status === 'ACTIVE')) {
                derivedStatus = 'Absent';
              }

              return {
                id: e.id,
                classId: e.classId,
                className: e.class?.name || 'Unknown Class',
                dateRaw: e.class?.scheduleDay,
                dateStr: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
                day: dateObj.toLocaleDateString('en-US', { day: '2-digit' }),
                time: e.class?.scheduleTime,
                instructor: e.class?.instructor?.user?.name || 'Unknown Instructor',
                type: e.class?.type === 'GROUP' ? 'Group' : '1-on-1',
                status: derivedStatus,
                meetingLink: e.meetingLink || e.class?.meetingLink || null,
              };
          });
          setEnrollments(mapped);
        } catch (err) {
          console.warn('Transient error loading dashboard data, backend might be restarting.', err);
          setDashboardError(err instanceof Error ? err.message : 'Unable to load your booked classes.');
        } finally {
          setLoadingEnrollments(false);
        }
      };
      fetchDashboardData();
    }
  }, [isAuthenticated, token]);

  if (isLoading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!isAuthenticated) return null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setReviewStatus({ loading: true, success: false, error: '' });
    try {
      const { apiPost } = await import('@/lib/api');
      await apiPost('/testimonials', reviewForm, token);
      setReviewStatus({ loading: false, success: true, error: '' });
      setReviewForm({ content: '', rating: 5 });
    } catch (err: any) {
      setReviewStatus({ loading: false, success: false, error: err.message || 'Failed to submit review' });
    }
  };

  const handleJoinClass = async (e: React.MouseEvent<HTMLAnchorElement>, enrollmentId: string, classId: string, link: string) => {
    e.preventDefault();
    // Open synchronously so browsers do not treat it as an unsolicited popup
    // after the attendance request finishes.
    window.open(link, '_blank', 'noopener,noreferrer');
    if (token) {
      try {
        const { apiPost } = await import('@/lib/api');
        await apiPost('/attendance/self', { enrollmentId, classId }, token);
        setEnrollments(prev => prev.map(en => en.id === enrollmentId ? { ...en, status: 'Present' } : en));
        const [statsRes, attendanceRes, passesRes] = await Promise.all([
          apiGet<any>('/attendance/my/stats', token),
          apiGet<any>('/attendance/my', token),
          apiGet<any>('/passes/me', token),
        ]);
        setAttendanceStats(prev => ({
          totalRegistered: prev.totalRegistered,
          attended: statsRes.attended ?? prev.attended,
          missed: statsRes.missed ?? prev.missed,
        }));
        setAttendanceRecords(attendanceRes.data ?? attendanceRes ?? []);
        setPasses(passesRes.data ?? passesRes ?? []);
      } catch (err) {
        console.error('Failed to auto-mark attendance', err);
      }
    }
  };

  const upcoming = enrollments.filter(c => c.status === 'Upcoming' || c.status === 'Present');

  const getStatusClass = (status: string) => {
    if (status === 'Completed' || status === 'Attended' || status === 'Present' || status === 'Success') return styles.statusSuccess;
    if (status === 'Upcoming' || status === 'Pending') return styles.statusWarning;
    if (status === 'Absent' || status === 'Failed' || status === 'Cancelled' || status === 'No-show') return styles.statusError;
    return '';
  };

  return (
    <div className={styles.dashboard}>
      {toastMessage && (
        <div className={styles.toastSuccess} role="status">
          <span>{toastMessage}</span>
        </div>
      )}
      <div 
        className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.mobileOverlayOpen : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarUser}>
          <div className={styles.avatar} aria-hidden="true">
            {(user?.name || 'Member').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}
          </div>
          <div className={styles.sidebarUserCopy}>
            <div className={styles.sidebarName}>{user?.name || 'Member'}</div>
            <div className={styles.sidebarRole}>Student account</div>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          {tabs.map(tab => (
            <button key={tab.id} className={`${styles.sidebarLink} ${activeTab === tab.id ? styles.sidebarActive : ''}`} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}>
              <span style={{ display: 'flex' }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <button className={styles.sidebarLink} onClick={logout}>
            <span style={{ display: 'flex' }}><LogOut size={18} /></span> Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mobileHeader}>
           <button className={styles.mobileToggle} onClick={() => setIsMobileMenuOpen(true)} aria-label="Open dashboard navigation" type="button">
             <Menu size={24} />
           </button>
           <span className={styles.mobileTitle}>
             {tabs.find(t => t.id === activeTab)?.label}
           </span>
        </div>

        {activeTab === 'overview' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <h1>Good morning, {user?.name?.split(' ')[0] || 'Jordan'}</h1>
              <p>Here&apos;s what&apos;s on your mat this week.</p>
            </div>

            {dashboardError && (
              <div role="alert" style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(193, 119, 103, 0.35)', background: 'var(--error-soft)', color: 'var(--error)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span>We couldn&apos;t load your booked classes: {dashboardError}</span>
                <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}

            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}><CheckCircle size={24} /></div>
                <div><div className={styles.statValue}>{attendanceStats.totalRegistered}</div><div className={styles.statLabel}>Classes Registered</div></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}><CheckCircle size={24} /></div>
                <div><div className={styles.statValue}>{attendanceStats.attended}</div><div className={styles.statLabel}>Classes Attended</div></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper} style={{ color: 'var(--error)', background: '#faeeec' }}><XCircle size={24} /></div>
                <div><div className={styles.statValue}>{attendanceStats.missed}</div><div className={styles.statLabel}>Classes Absent</div></div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.contentSubtitle} style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontSize: '1.2rem', marginBottom: '16px' }}>My Upcoming Classes</h3>
              <div className={styles.upcomingGrid}>
                {upcoming.map(c => (
                  <div key={c.id} className={styles.upcomingRow}>
                    <div className={styles.dateBox}>
                      <div className={styles.dateMonth}>{c.month}</div>
                      <div className={styles.dateDay}>{c.day}</div>
                    </div>
                    <div className={styles.upcomingInfo}>
                      <h4>{c.className}</h4>
                      <div className={styles.upcomingMeta}>
                        <User size={14} /> {c.instructor} &middot; {c.type}
                      </div>
                    </div>
                    {c.meetingLink && (
                      <a href={c.meetingLink} onClick={(e) => handleJoinClass(e, c.id, c.classId, c.meetingLink)} className={styles.joinBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Video size={16} /> Join Class
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'classes' || activeTab === 'history') && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <h1>Registration History</h1>
              <p>All your past and upcoming class registrations.</p>
            </div>
            {dashboardError && (
              <div role="alert" style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(193, 119, 103, 0.35)', background: 'var(--error-soft)', color: 'var(--error)' }}>
                We couldn&apos;t load your booked classes. Please retry in a moment.
              </div>
            )}
            <>
              <div className={styles.filterGroup}>
                {['All', 'Upcoming', 'Completed', 'No-show', 'Cancelled'].map(f => (
                  <button key={f} className={`${styles.filterPill} ${activeFilter === f ? styles.active : ''}`} onClick={() => setActiveFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>
              <div className={styles.tableWrapper}>
                {loadingEnrollments ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your classes...</div>
                ) : enrollments.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No classes found. <a href="/classes" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Book one now!</a></div>
                ) : (
                  <table className={styles.table}>
                    <thead><tr><th>Class</th><th>Date</th><th>Instructor</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                      {enrollments.filter(c => activeFilter === 'All' || c.status === activeFilter).map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.className}</strong></td>
                          <td>{c.dateStr}</td>
                          <td>{c.instructor}</td>
                          <td>{c.type}</td>
                          <td><span className={`${styles.badgeSubtle} ${getStatusClass(c.status)}`}>{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <h1>Attendance</h1>
              <p>Your class attendance and makeup credits.</p>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div><div className={styles.statValue}>{attendanceStats.totalRegistered}</div><div className={styles.statLabel}>Total Classes</div></div>
              </div>
              <div className={styles.statCard}>
                <div><div className={styles.statValue} style={{ color: 'var(--success)' }}>{attendanceStats.attended}</div><div className={styles.statLabel}>Attended</div></div>
              </div>
              <div className={styles.statCard}>
                <div><div className={styles.statValue} style={{ color: 'var(--error)' }}>{attendanceStats.missed}</div><div className={styles.statLabel}>Absent</div></div>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              {attendanceRecords.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No attendance records found.</div>
              ) : (
                <table className={styles.table}>
                  <thead><tr><th>Class</th><th>Date</th><th>Status</th><th>Makeup Credit</th></tr></thead>
                  <tbody>
                    {attendanceRecords.map(record => {
                      const creditStatus = getMakeupCreditStatus(record);
                      const expiresAt = getMakeupCreditExpiry(record.sessionDate);
                      return (
                      <tr key={record.id}>
                        <td><strong>{record.class?.name || 'Unknown Class'}</strong></td>
                        <td>{formatAttendanceDate(record.sessionDate)}</td>
                        <td>
                          {record.attended ? (
                            <span className={`${styles.badgeSubtle} ${styles.statusSuccess}`}>Present</span>
                          ) : (
                            <span className={`${styles.badgeSubtle} ${styles.statusError}`}>Absent</span>
                          )}
                        </td>
                        <td>
                          {creditStatus === 'available' && expiresAt ? (
                            <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500 }}>
                              Available until {formatAttendanceDate(expiresAt)}
                            </span>
                          ) : creditStatus === 'used' ? (
                            <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 500 }}>Used</span>
                          ) : creditStatus === 'expired' && expiresAt ? (
                            <span style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 500 }}>
                              Expired {formatAttendanceDate(expiresAt)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <h1>Payment History</h1>
              <p>Your transaction records and receipts.</p>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div><div className={styles.statValue}>$84</div><div className={styles.statLabel}>Total Spent</div></div>
              </div>
              <div className={styles.statCard}>
                <div><div className={styles.statValue}>3</div><div className={styles.statLabel}>Successful Payments</div></div>
              </div>
              <div className={styles.statCard}>
                <div><div className={styles.statValue}>$24</div><div className={styles.statLabel}>Refunded</div></div>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead><tr><th>Date</th><th>Class</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
                <tbody>
                  {samplePayments.map(p => (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td><strong>{p.className}</strong></td>
                      <td><strong>${p.amount}</strong></td>
                      <td><span className={`${styles.badgeSubtle} ${getStatusClass(p.status)}`}>{p.status}</span></td>
                      <td><button className={styles.joinBtn} style={{ padding: '8px', background: 'var(--surface-alt)', cursor: 'pointer' }}><Download size={16} color="var(--primary)"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'passes' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <h1>My Passes</h1>
              <p>View your class-pass balance and purchase history.</p>
            </div>

            {passes.length > 0 && !passes.some(pass => getUserPassStatus(pass) === 'active') && (
              <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-alt)' }}>
                <strong style={{ display: 'block', marginBottom: '6px' }}>Your class pass is completed</strong>
                <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)' }}>Buy a new pass or book your next class individually.</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link href="/pricing" className="btn btn-primary">Buy a New Pass</Link>
                  <Link href="/classes" className="btn btn-secondary">Book a Class</Link>
                </div>
              </div>
            )}

            <div className={styles.tableWrapper}>
              {passes.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  You don&apos;t have any active passes. <Link href="/pricing" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Buy one now!</Link>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Pass Type</th>
                      <th>Purchase Date</th>
                      <th>Expires</th>
                      <th>Classes Remaining</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passes.map(p => {
                      const passStatus = getUserPassStatus(p);
                      return (
                      <tr key={p.id}>
                        <td><strong>{p.passOption?.name}</strong></td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Never'}</td>
                        <td>{p.remainingClasses !== null ? p.remainingClasses : 'Unlimited'}</td>
                        <td>
                          <span className={`${styles.badgeSubtle} ${passStatus === 'active' ? styles.statusSuccess : styles.statusError}`}>
                            {formatUserPassStatus(passStatus)}
                          </span>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <h1>Write a Review</h1>
              <p>Share your experience with our classes and instructors!</p>
            </div>
            
            <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--surface-alt)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', border: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)', fontWeight: 600 }}>Review us on Google!</h3>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your feedback helps us grow and improve. We'd love to hear your thoughts.</p>
              </div>
              <a href="https://share.google/3dY6zIadXlKrMekTu" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#4285F4', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 500 }}>
                Leave a Google Review
              </a>
            </div>

            <div className={styles.profileCard} style={{ maxWidth: '600px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text)' }}>Or leave a testimonial on our website</h3>
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 600 }}>Rating</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        type="button" 
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        style={{ 
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '24px', color: star <= reviewForm.rating ? '#f59e0b' : 'var(--border)'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 600 }}>Your Experience</label>
                  <textarea 
                    value={reviewForm.content}
                    onChange={e => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={5}
                    placeholder="Tell us what you loved about the classes..."
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', resize: 'vertical' }}
                  />
                </div>
                
                {reviewStatus.error && <div style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{reviewStatus.error}</div>}
                {reviewStatus.success && <div style={{ color: 'var(--success)', fontSize: '0.9rem', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>Thank you! Your review has been submitted and is pending approval.</div>}
                
                <button type="submit" className="btn btn-primary" disabled={reviewStatus.loading || reviewStatus.success} style={{ alignSelf: 'flex-start' }}>
                  {reviewStatus.loading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <h1>My Profile</h1>
              <p>Manage your account details and password.</p>
            </div>

            <div className={styles.profileCard}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '24px' }}>Personal Information</h3>
              
              <div className={styles.profilePhotoArea}>
                <div className={styles.photoPlaceholder}>
                  <span className={styles.profileInitials} aria-hidden="true">
                    {(user?.name || 'Member').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}
                  </span>
                  <div className={styles.photoBtn}><Camera size={12} /></div>
                </div>
                <div>
                  <div className={styles.photoText}>Profile photo</div>
                  <div className={styles.photoSubtext}>JPG or PNG, max 2MB</div>
                </div>
              </div>

              <form className={styles.profileForm} onSubmit={e => { e.preventDefault(); alert('Saved!'); }}>
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" defaultValue={user?.name || 'Jordan Lee'} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" defaultValue={user?.email || 'jordan@example.com'} disabled /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" defaultValue={user?.phone || ''} /></div>
                <div className={styles.formActions}>
                  <button type="button" className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
