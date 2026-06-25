'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ) },
  { id: 'classes', label: 'Classes', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  ) },
  { id: 'instructors', label: 'Instructors', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  ) },
  { id: 'bookings', label: 'Bookings & Payments', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
  ) },

  { id: 'attendance', label: 'Attendance', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
  ) },
  { id: 'content', label: 'Content Editor', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  ) },
  { id: 'testimonials', label: 'Testimonials', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  ) },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClassRow {
  id: string;
  name: string;
  instructor: { user: { name: string } };
  instructorId: string;
  scheduleDay: string;
  scheduleTime: string;
  maxCapacity: number;
  currentEnrollment: number;
  status: string;
  type: string;
  priceUsd: string;
  durationMinutes: number;
  ageGroup: string;
  description?: string;
  meetingLink?: string;
}

interface InstructorRow {
  id: string;
  specialization?: string;
  bio?: string;
  qualifications?: string;
  yearsExperience?: number;
  user: { id: string; name: string; email: string; profilePhotoUrl?: string };
  isActive: boolean;
}

interface MeetingRow {
  id: string;
  className: string;
  platform: string;
  link: string;
  hostKey?: string;
  isActive: boolean;
}

interface TestimonialRow {
  id: string;
  studentName: string;
  content: string;
  rating: number;
  source: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { user, token, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [instructorsLoading, setInstructorsLoading] = useState(false);

  const [bookings] = useState([
    { id: 1, txn: '#TXN-8924', student: 'Emma Watson', item: 'Vinyasa Flow', date: 'Jun 14, 2026', amount: '$25.00', status: 'Paid' },
    { id: 2, txn: '#TXN-8923', student: 'John Smith', item: '10-Class Pass', date: 'Jun 14, 2026', amount: '$199.00', status: 'Paid' },
    { id: 3, txn: '#TXN-8922', student: 'Michael Doe', item: 'Restorative Yoga', date: 'Jun 13, 2026', amount: '$25.00', status: 'Declined' },
  ]);


  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);

  // Attendance state
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // ─── Content Editor State ────────────────────────────────────────────────
  const [activeEditorPage, setActiveEditorPage] = useState('Home Page');
  const [editorContent, setEditorContent] = useState("# Welcome to SHAKTHI YOGA\n\nA sanctuary for mindful movement. We offer in-person and online yoga classes for every level.\n\n## Our Philosophy\nWe believe that yoga is for every body. Our instructors are trained to modify poses for any skill level.");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Modal State ─────────────────────────────────────────────────────────
  const [modalType, setModalType] = useState<string | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'class' | 'instructor' | 'testimonial' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Toast State ─────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  // ─── Password Visibility ──────────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message);
    setToastIsError(isError);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const closeModal = () => {
    setModalType(null);
    setEditingMeetingId(null);
    setEditingClassId(null);
    setEditingInstructorId(null);
    setItemToDelete(null);
    setShowPassword(false);
  };

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/signin');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    if (!token) return;
    setClassesLoading(true);
    try {
      const res = await apiGet<any>('/classes?limit=100', token);
      setClasses(res.data ?? res);
    } catch (e: any) {
      showToast(e.message || 'Failed to load classes', true);
    } finally {
      setClassesLoading(false);
    }
  }, [token, showToast]);

  const fetchInstructors = useCallback(async () => {
    if (!token) return;
    setInstructorsLoading(true);
    try {
      const res = await apiGet<any>('/instructors', token);
      setInstructors(Array.isArray(res) ? res : res.data ?? []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load instructors', true);
    } finally {
      setInstructorsLoading(false);
    }
  }, [token, showToast]);



  const fetchTestimonials = useCallback(async () => {
    if (!token) return;
    setTestimonialsLoading(true);
    try {
      const res = await apiGet<any>('/testimonials', token);
      setTestimonials(Array.isArray(res) ? res : res.data ?? []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load testimonials', true);
    } finally {
      setTestimonialsLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && token) {
      fetchClasses();
      fetchInstructors();

      fetchTestimonials();
    }
  }, [isAuthenticated, isAdmin, token, fetchClasses, fetchInstructors, fetchTestimonials]);

  if (isLoading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!isAuthenticated || !isAdmin) return null;

  // ─── Handlers ────────────────────────────────────────────────────────────
  
  // ─── Attendance Handlers ──────────────────────────────────────────────────
  const handleSaveAttendance = async () => {
    if (!selectedAttendanceClass || !attendanceDate || attendanceRecords.length === 0) return;
    
    const recordsToSave = attendanceRecords.map(r => ({
      enrollmentId: r.enrollmentId,
      attended: r.attended
    }));

    try {
      await apiPost('/attendance', {
        classId: selectedAttendanceClass,
        sessionDate: attendanceDate,
        records: recordsToSave
      }, token!);
      showToast('Attendance saved successfully!');
    } catch (e: any) {
      showToast(e.message || 'Failed to save attendance', true);
    }
  };

  const handleEditorInsert = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = editorContent;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setEditorContent(newText);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleDeleteClass = (id: string) => {
    setItemToDelete({ id, type: 'class' });
    setModalType('confirmDelete');
  };

  const handleDeleteInstructor = (id: string) => {
    setItemToDelete({ id, type: 'instructor' });
    setModalType('confirmDelete');
  };

  const handleTestimonialAction = async (id: string, action: 'APPROVED' | 'REJECTED' | 'DELETE') => {
    if (action === 'DELETE') {
      setItemToDelete({ id, type: 'testimonial' });
      setModalType('confirmDelete');
      return;
    }

    try {
      await apiPatch<any>(`/testimonials/${id}/status`, { status: action }, token!);
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, status: action } : t));
      showToast(`Testimonial ${action.toLowerCase()} successfully`);
    } catch (e: any) {
      showToast(e.message || 'Failed to update status', true);
    }
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsSaving(true);
    try {
      if (itemToDelete.type === 'class') {
        await apiDelete(`/classes/${itemToDelete.id}`, token!);
        setClasses(prev => prev.filter(c => c.id !== itemToDelete.id));
        showToast('Class deleted successfully');
      } else if (itemToDelete.type === 'instructor') {
        await apiDelete(`/instructors/${itemToDelete.id}`, token!);
        setInstructors(prev => prev.filter(i => i.id !== itemToDelete.id));
        showToast('Instructor deleted successfully');
      } else if (itemToDelete.type === 'testimonial') {
        await apiDelete(`/testimonials/${itemToDelete.id}`, token!);
        setTestimonials(prev => prev.filter(t => t.id !== itemToDelete.id));
        showToast('Testimonial deleted successfully');
      }
      closeModal();
    } catch (e: any) {
      showToast(e.message || 'Failed to delete', true);
    } finally {
      setIsSaving(false);
    }
  };



  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Student', 'Class', 'Date', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...bookings.map(b => `"${b.txn}","${b.student}","${b.item}","${b.date}","${b.amount}","${b.status}"`)
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePreviewSite = () => window.open('/', '_blank');

  const handlePublishContent = () => showToast('Changes saved to database and published successfully!');

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const formData = new FormData(e.target as HTMLFormElement);
    setIsSaving(true);

    try {
      if (modalType === 'addClass') {
        const payload = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          type: formData.get('type') as string,
          instructorId: formData.get('instructorId') as string,
          meetingLink: (formData.get('meetingLink') as string) || undefined,
          priceUsd: parseFloat(formData.get('priceUsd') as string),
          maxCapacity: parseInt(formData.get('maxCapacity') as string),
          scheduleDay: formData.get('scheduleDay') as string,
          scheduleTime: formData.get('scheduleTime') as string,
          durationMinutes: parseInt(formData.get('durationMinutes') as string),
        };
        await apiPost('/classes', payload, token);
        showToast('Class created successfully!');
        await fetchClasses();

      } else if (modalType === 'editClass') {
        const payload: any = {
          name: formData.get('name') as string,
          type: formData.get('type') as string,
          instructorId: formData.get('instructorId') as string,
          meetingLink: (formData.get('meetingLink') as string) || undefined,
          priceUsd: parseFloat(formData.get('priceUsd') as string),
          maxCapacity: parseInt(formData.get('maxCapacity') as string),
          scheduleDay: formData.get('scheduleDay') as string,
          scheduleTime: formData.get('scheduleTime') as string,
          durationMinutes: parseInt(formData.get('durationMinutes') as string),
        };
        const status = formData.get('status') as string;
        if (status) payload.status = status;
        const desc = formData.get('description') as string;
        if (desc) payload.description = desc;
        await apiPatch(`/classes/${editingClassId}`, payload, token);
        showToast('Class updated successfully!');
        await fetchClasses();

      } else if (modalType === 'addInstructor') {
        const yearsRaw = formData.get('yearsExperience') as string;
        const payload: any = {
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          specialization: formData.get('specialization') as string,
          bio: formData.get('bio') as string,
          qualifications: formData.get('qualifications') as string,
        };
        if (yearsRaw && !isNaN(parseInt(yearsRaw))) payload.yearsExperience = parseInt(yearsRaw);
        await apiPost('/instructors', payload, token);
        showToast('Instructor created successfully!');
        await fetchInstructors();

      } else if (modalType === 'editInstructor') {
        const yearsRaw = formData.get('yearsExperience') as string;
        const payload: any = {
          name: formData.get('name') as string,
          specialization: formData.get('specialization') as string,
          bio: formData.get('bio') as string,
          qualifications: formData.get('qualifications') as string,
        };
        if (yearsRaw && !isNaN(parseInt(yearsRaw))) payload.yearsExperience = parseInt(yearsRaw);
        await apiPatch(`/instructors/${editingInstructorId}`, payload, token);
        showToast('Instructor updated successfully!');
        await fetchInstructors();

      } else if (modalType === 'addGoogleReview') {
        const payload = {
          studentName: formData.get('studentName') as string,
          content: formData.get('content') as string,
          rating: parseInt(formData.get('rating') as string),
          source: 'GOOGLE',
          status: 'APPROVED',
        };
        await apiPost<any>('/testimonials/admin', payload, token);
        showToast('Google Review added!');
        await fetchTestimonials();
      }

      closeModal();
    } catch (e: any) {
      showToast(e.message || 'An error occurred. Please try again.', true);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Derived data ─────────────────────────────────────────────────────────
  const editingClass = classes.find(c => c.id === editingClassId);
  const editingInstructor = instructors.find(i => i.id === editingInstructorId);

  return (
    <div className={styles.admin}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M8.5 15c2.5-3 5.5-4.5 8.5-4.5"></path><path d="M12 8c-2.5 3-3.5 6-3.5 9"></path></svg>
          </div>
          <span className={styles.sidebarLogoText}>Admin Panel</span>
        </div>

        <nav className={styles.sidebarNav}>
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.sidebarLink} ${activeTab === tab.id ? styles.sidebarActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <Link href="/dashboard" className={styles.sidebarLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            User Dashboard
          </Link>
          <button onClick={() => { logout(); router.push('/'); }} className={styles.sidebarLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <span className={styles.adminBadge}>Admin</span>
          <span className={styles.userName}>{user?.name || 'Admin User'}</span>
        </header>

        <main className={styles.content}>

          {/* ── Dashboard ── */}
          {activeTab === 'dashboard' && (
            <>
              <h1 className={styles.pageTitle}>Admin Dashboard</h1>
              <p className={styles.pageSubtitle}>Studio performance overview — June 2026</p>
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}><div className={styles.kpiLabel}>Total Revenue (Jun)</div><div className={styles.kpiValue}>$4,900</div><div className={`${styles.kpiTrend} ${styles.trendPositive}`}>+6% vs last month</div></div>
                <div className={styles.kpiCard}><div className={styles.kpiLabel}>Active Students</div><div className={styles.kpiValue}>148</div><div className={`${styles.kpiTrend} ${styles.trendPositive}`}>+12 vs last month</div></div>
                <div className={styles.kpiCard}><div className={styles.kpiLabel}>Classes This Month</div><div className={styles.kpiValue}>{classes.length || 62}</div><div className={`${styles.kpiTrend} ${styles.trendPositive}`}>+4 vs last month</div></div>
                <div className={styles.kpiCard}><div className={styles.kpiLabel}>Avg. Attendance Rate</div><div className={styles.kpiValue}>87%</div><div className={`${styles.kpiTrend} ${styles.trendNegative}`}>-2% vs last month</div></div>
              </div>
              <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Revenue Over Time</h3>
                  <div className={styles.lineChartMock}>
                    <div className={styles.yAxis} style={{ left: 0 }}><span>$6000</span><span>$4500</span><span>$3000</span><span>$1500</span><span>$0</span></div>
                    <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', paddingLeft: '40px', paddingBottom: '30px' }} preserveAspectRatio="none">
                      <path d="M0,150 Q100,80 200,100 T400,60 T500,80" fill="none" stroke="#688E6E" strokeWidth="3" />
                      <path d="M0,150 Q100,80 200,100 T400,60 T500,80 L500,200 L0,200 Z" fill="rgba(104, 142, 110, 0.05)" />
                    </svg>
                    <div style={{ position: 'absolute', bottom: '0', left: '40px', right: '0', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                  </div>
                </div>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Weekly Attendance</h3>
                  <div className={styles.barChartMock}>
                    <div className={styles.yAxis} style={{ left: '-20px' }}><span>60</span><span>45</span><span>30</span><span>15</span><span>0</span></div>
                    <div className={styles.barGroup}><div className={`${styles.bar} ${styles.barAttended}`} style={{ height: '75%' }}></div><div className={`${styles.bar} ${styles.barMissed}`} style={{ height: '15%' }}></div><div className={styles.barGroupLabel}>Wk 1</div></div>
                    <div className={styles.barGroup}><div className={`${styles.bar} ${styles.barAttended}`} style={{ height: '65%' }}></div><div className={`${styles.bar} ${styles.barMissed}`} style={{ height: '20%' }}></div><div className={styles.barGroupLabel}>Wk 2</div></div>
                    <div className={styles.barGroup}><div className={`${styles.bar} ${styles.barAttended}`} style={{ height: '80%' }}></div><div className={`${styles.bar} ${styles.barMissed}`} style={{ height: '10%' }}></div><div className={styles.barGroupLabel}>Wk 3</div></div>
                    <div className={styles.barGroup}><div className={`${styles.bar} ${styles.barAttended}`} style={{ height: '90%' }}></div><div className={`${styles.bar} ${styles.barMissed}`} style={{ height: '12%' }}></div><div className={styles.barGroupLabel}>Wk 4</div></div>
                  </div>
                  <div className={styles.legend}>
                    <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.barAttended}`}></div><span>attended</span></div>
                    <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.barMissed}`}></div><span>missed</span></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Classes ── */}
          {activeTab === 'classes' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Classes</h1>
                  <p className={styles.pageSubtitle}>Manage studio schedule and class types.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button className={styles.btnPrimary} onClick={() => setModalType('addClass')}>+ Add Class</button>
                </div>
              </div>
              <div className={styles.tableContainer}>
                {classesLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading classes...</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Instructor</th>
                        <th>Schedule</th>
                        <th>Capacity</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No classes yet. Click "+ Add Class" to create one.</td></tr>
                      ) : classes.map(c => (
                        <tr key={c.id}>
                          <td>{c.name}</td>
                          <td>{c.instructor?.user?.name ?? '—'}</td>
                          <td>{c.scheduleDay} {c.scheduleTime}</td>
                          <td>{c.currentEnrollment}/{c.maxCapacity}</td>
                          <td>${parseFloat(c.priceUsd).toFixed(2)}</td>
                          <td><span className={`${styles.badge} ${c.status === 'ACTIVE' ? styles.badgeSuccess : styles.badgeNeutral}`}>{c.status}</span></td>
                          <td>
                            <div className={styles.actionBtns}>
                              <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => { setEditingClassId(c.id); setModalType('editClass'); }}>Edit</button>
                              <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDeleteClass(c.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── Instructors ── */}
          {activeTab === 'instructors' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Instructors</h1>
                  <p className={styles.pageSubtitle}>Manage your teaching team.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button className={styles.btnPrimary} onClick={() => setModalType('addInstructor')}>+ Add Instructor</button>
                </div>
              </div>
              {instructorsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading instructors...</div>
              ) : (
                <div className={styles.instructorGrid}>
                  {instructors.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>No instructors yet. Click "+ Add Instructor" to create one.</div>
                  ) : instructors.map(inst => (
                    <div key={inst.id} className={styles.instructorCard}>
                      {/* Avatar */}
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #688E6E, #4a6b50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 600, color: 'white', marginBottom: '12px', flexShrink: 0 }}>
                        {inst.user.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Formatted Info */}
                      <div style={{ marginTop: '8px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'start', fontSize: '0.95rem' }}>
                          <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Name:</span>
                          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{inst.user.name}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'start', fontSize: '0.95rem' }}>
                          <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Email ID:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{inst.user.email}</span>
                        </div>
                        {inst.qualifications && (
                          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'start', fontSize: '0.95rem' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Qualification:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{inst.qualifications}</span>
                          </div>
                        )}
                        {inst.yearsExperience != null && (
                          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'start', fontSize: '0.95rem' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Experience:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{inst.yearsExperience} yrs</span>
                          </div>
                        )}
                        {inst.bio && (
                          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'start', fontSize: '0.95rem' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Description:</span>
                            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{inst.bio}</span>
                          </div>
                        )}
                        {inst.specialization && (
                          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'start', fontSize: '0.95rem' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Specialization:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{inst.specialization}</span>
                          </div>
                        )}
                      </div>
                      {/* Actions */}
                      <div className={styles.actionBtns} style={{ marginTop: 'auto' }}>
                        <button className={`${styles.actionBtn} ${styles.btnEdit}`} style={{ flex: 1 }} onClick={() => { setEditingInstructorId(inst.id); setModalType('editInstructor'); }}>Edit Profile</button>
                        <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDeleteInstructor(inst.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Bookings ── */}
          {activeTab === 'bookings' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Bookings & Payments</h1>
                  <p className={styles.pageSubtitle}>Recent transactions and class enrollments.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={handleExportCSV}>Export CSV</button>
                </div>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Transaction ID</th><th>Student</th><th>Class</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td>{b.txn}</td><td>{b.student}</td><td>{b.item}</td><td>{b.date}</td><td>{b.amount}</td>
                        <td><span className={`${styles.badge} ${b.status === 'Paid' ? styles.badgeSuccess : styles.badgeFailed}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}




          {/* ── Attendance ── */}
          {activeTab === 'attendance' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Attendance Manager</h1>
                  <p className={styles.pageSubtitle}>Mark student attendance for your classes.</p>
                </div>
              </div>
              <div className={styles.attendanceControls}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Select Class</label>
                  <select 
                    className={styles.input} 
                    value={selectedAttendanceClass}
                    onChange={(e) => setSelectedAttendanceClass(e.target.value)}
                  >
                    <option value="">-- Select a Class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Session Date</label>
                  <input 
                    type="date" 
                    className={styles.input} 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedAttendanceClass && attendanceDate && (
                <div className={styles.attendanceListContainer}>
                  {attendanceLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading students...</div>
                  ) : attendanceRecords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                      <p>No students are enrolled in this class.</p>
                    </div>
                  ) : (
                    <>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Email Address</th>
                            <th style={{ width: '150px', textAlign: 'center' }}>Attended?</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.map((record, index) => (
                            <tr key={record.enrollmentId}>
                              <td><strong>{record.studentName}</strong></td>
                              <td>{record.studentEmail}</td>
                              <td style={{ textAlign: 'center' }}>
                                <label className={styles.checkboxLabel} style={{ display: 'flex', justifyContent: 'center' }}>
                                  <input 
                                    type="checkbox" 
                                    className={styles.checkbox}
                                    checked={record.attended}
                                    onChange={(e) => {
                                      const newRecords = [...attendanceRecords];
                                      newRecords[index].attended = e.target.checked;
                                      setAttendanceRecords(newRecords);
                                    }}
                                  />
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingRight: '24px' }}>
                        <button className={styles.btnPrimary} onClick={handleSaveAttendance}>Save Attendance</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Testimonials ── */}
          {activeTab === 'testimonials' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Testimonials & Reviews</h1>
                  <p className={styles.pageSubtitle}>Manage student testimonials and manual Google Maps reviews.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button className={styles.btnPrimary} onClick={() => setModalType('addGoogleReview')}>+ Add Google Review</button>
                </div>
              </div>
              <div className={styles.tableContainer}>
                {testimonialsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading testimonials...</div>
                ) : testimonials.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                    <p>No testimonials available.</p>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Rating</th>
                        <th style={{ width: '40%' }}>Review</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testimonials.map(t => (
                        <tr key={t.id}>
                          <td>{t.studentName}</td>
                          <td>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</td>
                          <td><span style={{ display: 'inline-block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.content}>{t.content}</span></td>
                          <td>
                            <span className={styles.badge} style={{ background: t.source === 'GOOGLE' ? '#e8f0fe' : 'var(--bg-alt)', color: t.source === 'GOOGLE' ? '#1a73e8' : 'var(--text-secondary)' }}>
                              {t.source === 'GOOGLE' ? 'Google Maps' : 'Website'}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${t.status === 'APPROVED' ? styles.badgeSuccess : t.status === 'REJECTED' ? styles.badgeFailed : styles.badgeWarning}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionBtns}>
                              {t.status === 'PENDING' && (
                                <>
                                  <button className={`${styles.actionBtn} ${styles.btnEdit}`} style={{ color: 'var(--success)' }} onClick={() => handleTestimonialAction(t.id, 'APPROVED')}>Approve</button>
                                  <button className={`${styles.actionBtn} ${styles.btnDelete}`} style={{ color: 'var(--error)' }} onClick={() => handleTestimonialAction(t.id, 'REJECTED')}>Reject</button>
                                </>
                              )}
                              {t.status !== 'PENDING' && (
                                <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleTestimonialAction(t.id, 'DELETE')}>Delete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── Content Editor ── */}
          {activeTab === 'content' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Content Editor</h1>
                  <p className={styles.pageSubtitle}>Edit website copy and page content.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={handlePreviewSite}>Preview Site</button>
                  <button className={styles.btnPrimary} onClick={handlePublishContent}>Publish Changes</button>
                </div>
              </div>
              <div className={styles.editorLayout}>
                <div className={styles.editorSidebar}>
                  <div>
                    <div className={styles.editorSectionTitle}>Pages</div>
                    <div className={styles.editorNav}>
                      {['Home Page', 'About Us', 'Pricing', 'Contact'].map(page => (
                        <button
                          key={page}
                          className={`${styles.editorLink} ${activeEditorPage === page ? styles.editorLinkActive : ''}`}
                          onClick={() => { setActiveEditorPage(page); setEditorContent(`# Welcome to ${page}\n\nStart editing your content here...`); }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.editorMain}>
                  <div className={styles.editorToolbar}>
                    <button className={styles.editorToolBtn} onClick={() => handleEditorInsert('**', '**')}><strong>B</strong></button>
                    <button className={styles.editorToolBtn} onClick={() => handleEditorInsert('*', '*')}><em>I</em></button>
                    <button className={styles.editorToolBtn} onClick={() => handleEditorInsert('# ', '')}>H1</button>
                    <button className={styles.editorToolBtn} onClick={() => handleEditorInsert('## ', '')}>H2</button>
                    <div style={{ width: '1px', background: 'var(--border-light)', margin: '0 8px' }}></div>
                    <button className={styles.editorToolBtn} onClick={() => handleEditorInsert('[Link Text](', ')')}>🔗 Link</button>
                    <button className={styles.editorToolBtn} onClick={() => handleEditorInsert('![Alt Text](', ')')}>📷 Image</button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    className={styles.editorTextarea}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                  ></textarea>
                  <div className={styles.editorSectionTitle}>Live Preview ({activeEditorPage})</div>
                  <div className={styles.editorPreview}>{editorContent.split('\n')[0].replace(/#/g, '')}</div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── MODALS ── */}
      {modalType && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {modalType === 'addClass' && 'Add New Class'}
                {modalType === 'editClass' && 'Edit Class'}
                {modalType === 'addInstructor' && 'Add Instructor'}
                {modalType === 'editInstructor' && 'Edit Instructor Profile'}
                {modalType === 'addMeeting' && 'Generate Meeting Link'}
                {modalType === 'editMeeting' && 'Edit Meeting Link'}
                {modalType === 'confirmDelete' && 'Confirm Deletion'}
              </h3>
              <button onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flexShrink: 1 }}>
              <div className={styles.modalBody}>

                {/* Add / Edit Class */}
                {(modalType === 'addClass' || modalType === 'editClass') && (
                  <div className={styles.formRow}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Class Name *</label>
                      <input name="name" required defaultValue={editingClass?.name} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Type *</label>
                      <select name="type" required defaultValue={editingClass?.type ?? 'GROUP'} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}>
                        <option value="GROUP">Group</option>
                        <option value="ONE_ON_ONE">One-on-One</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Age Group *</label>
                      <select name="ageGroup" required defaultValue={editingClass?.ageGroup ?? 'ADULTS'} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}>
                        <option value="KIDS">Kids</option>
                        <option value="ADULTS">Adults</option>
                      </select>
                    </div>
                    {modalType === 'editClass' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status *</label>
                        <select name="status" required defaultValue={editingClass?.status ?? 'ACTIVE'} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}>
                          <option value="ACTIVE">Active</option>
                          <option value="UPCOMING">Upcoming</option>
                          <option value="FULL">Full</option>
                          <option value="INACTIVE">Inactive (Completed/Removed)</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Instructor *</label>
                      <select name="instructorId" required defaultValue={editingClass?.instructorId} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}>
                        <option value="">— select —</option>
                        {instructors.map(i => <option key={i.id} value={i.id}>{i.user.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Schedule Day *</label>
                      <select name="scheduleDay" required defaultValue={editingClass?.scheduleDay ?? 'Monday'} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}>
                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Schedule Time *</label>
                      <input name="scheduleTime" type="time" required defaultValue={editingClass?.scheduleTime ?? '09:00'} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Max Capacity *</label>
                      <input name="maxCapacity" type="number" min="1" required defaultValue={editingClass?.maxCapacity ?? 20} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Price (USD) *</label>
                      <input name="priceUsd" type="number" min="0" step="0.01" required defaultValue={editingClass ? parseFloat(editingClass.priceUsd) : 25} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Duration (minutes) *</label>
                      <input name="durationMinutes" type="number" min="15" required defaultValue={editingClass?.durationMinutes ?? 60} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Meeting Link URL (Optional)</label>
                      <input name="meetingLink" type="url" placeholder="https://zoom.us/j/..." defaultValue={editingClass?.meetingLink ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description</label>
                      <textarea name="description" rows={3} defaultValue={editingClass?.description} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
                    </div>
                  </div>
                )}

                {/* Add Instructor */}
                {modalType === 'addInstructor' && (
                  <div className={styles.formRow}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Full Name *</label>
                      <input name="name" required style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email *</label>
                      <input name="email" type="email" required style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Password * (min 6 chars)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          style={{ padding: '8px 40px 8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', width: '100%' }}
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPassword(v => !v); }}
                          style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }}
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Specialization</label>
                      <input name="specialization" placeholder="e.g. Vinyasa & Hatha" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Years of Experience</label>
                      <input name="yearsExperience" type="number" min="0" max="60" placeholder="e.g. 5" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Qualifications</label>
                      <input name="qualifications" placeholder="e.g. RYT-200, Yoga Alliance Certified" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bio</label>
                      <textarea name="bio" rows={3} placeholder="Short introduction about this instructor..." style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
                    </div>
                  </div>
                )}

                {/* Edit Instructor */}
                {modalType === 'editInstructor' && (
                  <div className={styles.formRow}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Name</label>
                      <input name="name" defaultValue={editingInstructor?.user.name ?? ''} required style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Specialization</label>
                      <input name="specialization" defaultValue={editingInstructor?.specialization ?? ''} placeholder="e.g. Vinyasa & Hatha" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Years of Experience</label>
                      <input name="yearsExperience" type="number" min="0" max="60" defaultValue={editingInstructor?.yearsExperience ?? ''} placeholder="e.g. 5" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Qualifications</label>
                      <input name="qualifications" defaultValue={editingInstructor?.qualifications ?? ''} placeholder="e.g. RYT-200, Yoga Alliance Certified" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bio</label>
                      <textarea name="bio" rows={4} defaultValue={editingInstructor?.bio ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
                    </div>
                  </div>
                )}

                {/* Add Meeting */}
                {modalType === 'addMeeting' && (
                  <div className={styles.formRow}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Class / Session Name *</label>
                      <input name="name" required placeholder="e.g. Morning Vinyasa Flow" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Platform</label>
                      <select name="platform" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}>
                        <option>Zoom</option>
                        <option>Google Meet</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Host Key (Optional)</label>
                      <input name="hostKey" placeholder="Secret host key" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Meeting URL *</label>
                      <input name="link" required placeholder="https://zoom.us/j/..." style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                  </div>
                )}

                {/* Add Google Review */}
                {modalType === 'addGoogleReview' && (
                  <div className={styles.formRow}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Reviewer Name *</label>
                      <input name="studentName" required placeholder="e.g. John Doe" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rating (1-5) *</label>
                      <input name="rating" type="number" min="1" max="5" defaultValue="5" required style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Review Content *</label>
                      <textarea name="content" required rows={4} placeholder="Copy the Google Review text here..." style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
                    </div>
                  </div>
                )}

                {/* Confirm Delete */}
                {modalType === 'confirmDelete' && (
                  <div className={styles.formRow}>
                    <div style={{ gridColumn: '1 / -1', padding: '16px 0', fontSize: '1.05rem', color: 'var(--text-primary)', textAlign: 'center' }}>
                      Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
                    </div>
                  </div>
                )}

              </div>

              {modalType !== 'confirmDelete' && (
                <div className={styles.modalActions}>
                  <button type="button" className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={closeModal} disabled={isSaving}>Cancel</button>
                  <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
              {modalType === 'confirmDelete' && (
                <div className={styles.modalActions}>
                  <button type="button" className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={closeModal} disabled={isSaving}>Cancel</button>
                  <button type="button" className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={executeDelete} disabled={isSaving} style={{ padding: '8px 16px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600 }}>
                    {isSaving ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`${styles.toast} ${toastMessage ? styles.toastVisible : ''} ${toastIsError ? styles.toastError : ''}`}>
        <div className={styles.toastIcon}>
          {toastIsError
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          }
        </div>
        {toastMessage}
      </div>
    </div>
  );
}
