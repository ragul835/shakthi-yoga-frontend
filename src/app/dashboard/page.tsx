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
import { getClassDateDisplay } from '@/lib/schedule';
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
  const [payments, setPayments] = useState<any[]>([]);
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
      let message = '';
      if (successParam === 'booking') {
        message = 'Class booked successfully!';
        window.history.replaceState({}, '', '/dashboard');
      } else if (successParam === 'pass') {
        message = 'Pass purchased successfully!';
        window.history.replaceState({}, '', '/dashboard');
      }

      if (!message) return;
      const showTimer = window.setTimeout(() => setToastMessage(message), 0);
      const hideTimer = window.setTimeout(() => setToastMessage(''), 5000);
      return () => {
        window.clearTimeout(showTimer);
        window.clearTimeout(hideTimer);
      };
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchDashboardData = async () => {
        setDashboardError('');
        setLoadingEnrollments(true);
        try {
          const [enrollRes, statsRes, attendanceRes, passesRes, profileRes] = await Promise.all([
            apiGet<any>('/enrollments/my?limit=50', token),
            apiGet<any>('/attendance/my/stats', token).catch(() => ({ total: 0, attended: 0, missed: 0 })),
            apiGet<any>('/attendance/my', token).catch(() => []),
            apiGet<any>('/passes/me', token).catch(() => []),
            apiGet<any>('/users/me', token).catch(() => ({ payments: [] })),
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
          setPayments(Array.isArray(profileRes.payments) ? profileRes.payments : []);
          
          const mapped = data.map((e: any) => {
              const dateDisplay = getClassDateDisplay(e.class?.scheduleDay, e.class?.scheduleTime);
              const hasAttendance = Array.isArray(e.attendances) && e.attendances.length > 0;
              const isAttended = hasAttendance ? e.attendances[0].attended : false;
              let derivedStatus = e.status === 'APPROVED' || e.status === 'ACTIVE' ? 'Upcoming' : e.status === 'COMPLETED' ? 'Completed' : 'Cancelled';
              
              if (hasAttendance) {
                derivedStatus = isAttended ? 'Present' : 'Absent';
              }

              return {
                id: e.id,
                classId: e.classId,
                className: e.class?.name || 'Unknown Class',
                dateRaw: e.class?.scheduleDay,
                dateStr: dateDisplay.dateStr,
                month: dateDisplay.month,
                day: dateDisplay.day,
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

  const handleJoinClass = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    e.preventDefault();
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const upcoming = enrollments.filter(c => c.status === 'Upcoming' || c.status === 'Present');
  const classHistory = enrollments.filter(c => !['Upcoming', 'Present'].includes(c.status));
  const filteredHistory = classHistory.filter(c => activeFilter === 'All' || c.status === activeFilter);
  const successfulPayments = payments.filter(payment => payment.status === 'SUCCEEDED');
  const refundedPayments = payments.filter(payment => payment.status === 'REFUNDED');
  const sumPayments = (items: any[]) => items.reduce((total, payment) => total + (Number(payment.amountUsd) || 0), 0);

  const getStatusClass = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    if (['COMPLETED', 'ATTENDED', 'PRESENT', 'SUCCESS', 'SUCCEEDED'].includes(normalizedStatus)) return styles.statusSuccess;
    if (['UPCOMING', 'PENDING'].includes(normalizedStatus)) return styles.statusWarning;
    if (['ABSENT', 'FAILED', 'CANCELLED', 'NO-SHOW', 'REFUNDED'].includes(normalizedStatus)) return styles.statusError;
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
        <nav className={styles.sidebarNav} aria-label="Student dashboard">
          {tabs.map(tab => (
            <button type="button" key={tab.id} aria-current={activeTab === tab.id ? 'page' : undefined} className={`${styles.sidebarLink} ${activeTab === tab.id ? styles.sidebarActive : ''}`} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}>
              <span className={styles.sidebarIcon}>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <button type="button" className={`${styles.sidebarLink} ${styles.signOutLink}`} onClick={logout}>
            <span className={styles.sidebarIcon}><LogOut size={18} /></span><span>Sign Out</span>
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
              <span className={styles.eyebrow}>Student dashboard</span>
              <h1>Welcome back, {user?.name?.split(' ')[0] || 'Member'}</h1>
              <p>Here&apos;s what&apos;s on your mat this week.</p>
            </div>

            {dashboardError && (
              <div role="alert" style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(193, 119, 103, 0.35)', background: 'var(--error-soft)', color: 'var(--error)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span>We couldn&apos;t load your booked classes: {dashboardError}</span>
                <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}

            <div className={styles.statGrid}>
              <button type="button" className={styles.statCard} onClick={() => setActiveTab('classes')} aria-label={`View ${attendanceStats.totalRegistered} registered classes`}>
                <div className={styles.statIconWrapper}><CheckCircle size={24} /></div>
                <div><div className={styles.statValue}>{attendanceStats.totalRegistered}</div><div className={styles.statLabel}>Classes Registered</div></div>
                <span className={styles.statAction}>View classes →</span>
              </button>
              <button type="button" className={styles.statCard} onClick={() => setActiveTab('attendance')} aria-label={`View ${attendanceStats.attended} attended classes`}>
                <div className={styles.statIconWrapper}><CheckCircle size={24} /></div>
                <div><div className={styles.statValue}>{attendanceStats.attended}</div><div className={styles.statLabel}>Classes Attended</div></div>
                <span className={styles.statAction}>View attendance →</span>
              </button>
              <button type="button" className={styles.statCard} onClick={() => { setActiveFilter('Absent'); setActiveTab('history'); }} aria-label={`View ${attendanceStats.missed} absent classes`}>
                <div className={styles.statIconWrapper} style={{ color: 'var(--error)', background: '#faeeec' }}><XCircle size={24} /></div>
                <div><div className={styles.statValue}>{attendanceStats.missed}</div><div className={styles.statLabel}>Classes Absent</div></div>
                <span className={styles.statAction}>View history →</span>
              </button>
            </div>

            <div className={styles.section}>
              <h3 className={styles.contentSubtitle} style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontSize: '1.2rem', marginBottom: '16px' }}>My Upcoming Classes</h3>
              <div className={styles.upcomingGrid}>
                {loadingEnrollments ? (
                  <div className={styles.sectionState} role="status">Loading your upcoming classes…</div>
                ) : upcoming.length === 0 ? (
                  <div className={styles.sectionState}>
                    <CalendarRange size={28} aria-hidden="true" />
                    <strong>No upcoming classes</strong>
                    <span>Your next booked class will appear here.</span>
                    <Link href="/classes" className="btn btn-primary">Browse classes</Link>
                  </div>
                ) : upcoming.map(c => (
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
                      <div className={styles.upcomingSchedule}>{c.dateStr}{c.time ? ` · ${c.time}` : ''}</div>
                    </div>
                    {c.meetingLink && (
                      <a href={c.meetingLink} onClick={(e) => handleJoinClass(e, c.meetingLink)} className={styles.joinBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Video size={16} /> Join Class
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <span className={styles.eyebrow}>Your practice</span>
              <h1>My Classes</h1>
              <p>Everything you need for your current and upcoming classes.</p>
            </div>
            {dashboardError && (
              <div className={styles.dashboardAlert} role="alert">
                We couldn&apos;t load your classes. Please retry in a moment.
              </div>
            )}
            <div className={styles.sectionHeadingRow}>
              <div>
                <h2>Current registrations</h2>
                <p>{upcoming.length} {upcoming.length === 1 ? 'class' : 'classes'} on your schedule</p>
              </div>
              <Link href="/classes" className="btn btn-primary">Book another class</Link>
            </div>
            <div className={styles.upcomingGrid}>
              {loadingEnrollments ? (
                <div className={styles.sectionState} role="status">Loading your classes…</div>
              ) : upcoming.length === 0 ? (
                <div className={styles.sectionState}>
                  <CalendarRange size={28} aria-hidden="true" />
                  <strong>No current classes</strong>
                  <span>Book a class and it will appear here with its schedule and meeting details.</span>
                  <Link href="/classes" className="btn btn-primary">Browse classes</Link>
                </div>
              ) : upcoming.map(c => (
                <article key={c.id} className={styles.upcomingRow}>
                  <div className={styles.dateBox}>
                    <div className={styles.dateMonth}>{c.month}</div>
                    <div className={styles.dateDay}>{c.day}</div>
                  </div>
                  <div className={styles.upcomingInfo}>
                    <div className={styles.classTitleRow}>
                      <h3>{c.className}</h3>
                      <span className={`${styles.badgeSubtle} ${getStatusClass(c.status)}`}>{c.status}</span>
                    </div>
                    <div className={styles.upcomingMeta}><User size={14} /> {c.instructor} &middot; {c.type}</div>
                    <div className={styles.upcomingSchedule}>{c.dateStr}{c.time ? ` · ${c.time}` : ''}</div>
                  </div>
                  {c.meetingLink ? (
                    <a href={c.meetingLink} onClick={(e) => handleJoinClass(e, c.meetingLink)} className={styles.joinBtn}>
                      <Video size={16} /> Join Class
                    </a>
                  ) : (
                    <span className={styles.meetingPending}>Meeting link pending</span>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <span className={styles.eyebrow}>Activity</span>
              <h1>Class History</h1>
              <p>Review classes that are completed, missed, or cancelled.</p>
            </div>
            {dashboardError && <div className={styles.dashboardAlert} role="alert">We couldn&apos;t load your class history. Please retry in a moment.</div>}
            <div className={styles.historySummary}>
              <button type="button" onClick={() => setActiveFilter('Completed')} aria-pressed={activeFilter === 'Completed'}><span>Completed</span><strong>{classHistory.filter(c => c.status === 'Completed').length}</strong></button>
              <button type="button" onClick={() => setActiveFilter('Absent')} aria-pressed={activeFilter === 'Absent'}><span>Absent</span><strong>{classHistory.filter(c => c.status === 'Absent').length}</strong></button>
              <button type="button" onClick={() => setActiveFilter('Cancelled')} aria-pressed={activeFilter === 'Cancelled'}><span>Cancelled</span><strong>{classHistory.filter(c => c.status === 'Cancelled').length}</strong></button>
            </div>
            <div className={styles.filterGroup} aria-label="Filter class history">
              {['All', 'Completed', 'Absent', 'Cancelled'].map(f => (
                <button type="button" key={f} className={`${styles.filterPill} ${activeFilter === f ? styles.active : ''}`} aria-pressed={activeFilter === f} onClick={() => setActiveFilter(f)}>{f}</button>
              ))}
            </div>
            <div className={styles.tableWrapper}>
              {loadingEnrollments ? (
                <div className={styles.tableState} role="status">Loading your history…</div>
              ) : classHistory.length === 0 ? (
                <div className={styles.sectionState}><History size={28} aria-hidden="true" /><strong>No class history yet</strong><span>Completed or cancelled classes will appear here.</span></div>
              ) : filteredHistory.length === 0 ? (
                <div className={styles.tableState}>No {activeFilter.toLowerCase()} classes found.</div>
              ) : (
                <table className={styles.table}>
                  <thead><tr><th>Class</th><th>Schedule</th><th>Instructor</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>{filteredHistory.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.className}</strong></td><td>{c.dateStr}{c.time ? ` · ${c.time}` : ''}</td><td>{c.instructor}</td><td>{c.type}</td>
                      <td><span className={`${styles.badgeSubtle} ${getStatusClass(c.status)}`}>{c.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className={styles.content}>
            <div className={styles.welcome}>
              <h1>Attendance</h1>
              <p>Your class attendance and makeup credits.</p>
            </div>

            <div className={styles.statGrid}>
              <button type="button" className={styles.statCard} onClick={() => setActiveTab('classes')}>
                <div><div className={styles.statValue}>{attendanceStats.totalRegistered}</div><div className={styles.statLabel}>Total Classes</div></div>
                <span className={styles.statAction}>View classes →</span>
              </button>
              <button type="button" className={styles.statCard} onClick={() => document.getElementById('attendance-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <div><div className={styles.statValue} style={{ color: 'var(--success)' }}>{attendanceStats.attended}</div><div className={styles.statLabel}>Attended</div></div>
                <span className={styles.statAction}>View records ↓</span>
              </button>
              <button type="button" className={styles.statCard} onClick={() => document.getElementById('attendance-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <div><div className={styles.statValue} style={{ color: 'var(--error)' }}>{attendanceStats.missed}</div><div className={styles.statLabel}>Absent</div></div>
                <span className={styles.statAction}>View records ↓</span>
              </button>
            </div>

            <div id="attendance-details" className={styles.tableWrapper}>
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
              <span className={styles.eyebrow}>Billing</span>
              <h1>Payment History</h1>
              <p>Your transaction records and receipts.</p>
            </div>

            <div className={styles.statGrid}>
              <button type="button" className={styles.statCard} onClick={() => document.getElementById('payment-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <div><div className={styles.statValue}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sumPayments(successfulPayments))}</div><div className={styles.statLabel}>Total Paid</div></div>
                <span className={styles.statAction}>View payments ↓</span>
              </button>
              <button type="button" className={styles.statCard} onClick={() => document.getElementById('payment-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <div><div className={styles.statValue}>{successfulPayments.length}</div><div className={styles.statLabel}>Successful Payments</div></div>
                <span className={styles.statAction}>View payments ↓</span>
              </button>
              <button type="button" className={styles.statCard} onClick={() => document.getElementById('payment-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <div><div className={styles.statValue}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sumPayments(refundedPayments))}</div><div className={styles.statLabel}>Refunded</div></div>
                <span className={styles.statAction}>View payments ↓</span>
              </button>
            </div>

            <div id="payment-details" className={styles.tableWrapper}>
              {payments.length === 0 ? (
                <div className={styles.sectionState}>
                  <CreditCard size={28} aria-hidden="true" />
                  <strong>No payment history</strong>
                  <span>Your completed transactions will appear here.</span>
                </div>
              ) : <table className={styles.table}>
                <thead><tr><th>Date</th><th>Class</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.paidAt || p.createdAt).toLocaleDateString('en-US')}</td>
                      <td><strong>{p.enrollment?.class?.name || p.userPass?.passOption?.name || 'Payment'}</strong></td>
                      <td><strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency || 'USD' }).format(Number(p.amountUsd) || 0)}</strong></td>
                      <td><span className={`${styles.badgeSubtle} ${getStatusClass(p.status)}`}>{p.status}</span></td>
                      <td>{p.receiptUrl ? <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className={styles.receiptLink} aria-label="Open payment receipt in a new tab"><Download size={16} /></a> : <span className={styles.mutedValue}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>}
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
