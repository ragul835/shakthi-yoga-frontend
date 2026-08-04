'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api';
import { getLocalDateInputValue, mergeAttendanceRecords, type AttendanceRecord } from '@/lib/attendance';
import { CMS_PREVIEW_STORAGE_PREFIX, CmsFields, cmsPages, getCmsPage, parseCmsContent } from '@/lib/cms';

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ) },
  { id: 'users', label: 'Users', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  ) },
  { id: 'passes', label: 'Passes', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
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
  { id: 'messages', label: 'Messages', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  ) },
  { id: 'newsletter', label: 'Newsletter', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="m4 6 8 7 8-7"/></svg>
  ) },
  { id: 'content', label: 'Content Editor', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  ) },
  { id: 'testimonials', label: 'Testimonials', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  ) },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalStudents: number;
  totalAdmins: number;
  totalInstructorUsers: number;
  totalClasses: number;
  activeClasses: number;
  totalInstructorProfiles: number;
  totalEnrollments: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  cancelledEnrollments: number;
  completedEnrollments: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalContactMessages: number;
  unreadContactMessages: number;
  totalTestimonials: number;
  pendingTestimonials: number;
  totalRevenueUsd: number;
  monthlyRevenueUsd: number;
  successfulPayments: number;
  revenueUpdatedAt: string;
  popularClasses: any[];
  recentEnrollments: any[];
  recentMessages: any[];
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  experienceLevel: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  _count: { enrollments: number };
}

interface EnrollmentRow {
  id: string;
  status: string;
  enrolledAt: string;
  user: { id: string; name: string; email: string };
  class: { id: string; name: string; type: string; scheduleDay: string; scheduleTime: string };
}

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface PassOptionRow {
  id: string;
  name: string;
  description?: string;
  priceUsd: string;
  totalClasses?: number;
  validityDays?: number;
  isActive: boolean;
  createdAt: string;
}

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
  imageUrl?: string;
}

interface InstructorRow {
  id: string;
  specialization?: string;
  bio?: string;
  qualifications?: string;
  yearsExperience?: number;
  photoUrl?: string;
  user: { id: string; name: string; email: string; profilePhotoUrl?: string };
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
interface NewsletterSubscriberRow { id: string; email: string; status: string; consentedAt: string; confirmedAt?: string; }

export default function AdminPage() {
  const { user, token, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [passOptions, setPassOptions] = useState<PassOptionRow[]>([]);
  const [passOptionsLoading, setPassOptionsLoading] = useState(false);
  const [editingPassOptionId, setEditingPassOptionId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classCardFilter, setClassCardFilter] = useState<'all' | 'active'>('all');
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [contactMessages, setContactMessages] = useState<ContactMessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any | null>(null);
  const [isUserDetailsPanelOpen, setIsUserDetailsPanelOpen] = useState(false);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriberRow[]>([]);
  const [newsletterCampaign, setNewsletterCampaign] = useState({ subject: '', message: '' });
  const [newsletterSending, setNewsletterSending] = useState(false);

  // Attendance state
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState<string>('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const attendanceLoadIdRef = useRef(0);

  // ─── Content Editor State ────────────────────────────────────────────────
  const [activeEditorPage, setActiveEditorPage] = useState('Home Page');
  const [pendingEditorPage, setPendingEditorPage] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<CmsFields>({ ...getCmsPage('home').fields });
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorLastSavedAt, setEditorLastSavedAt] = useState<string | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [editorPreviewOpen, setEditorPreviewOpen] = useState(false);

  // ─── Modal State ─────────────────────────────────────────────────────────
  const [modalType, setModalType] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'class' | 'instructor' | 'testimonial' | 'pass' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Attendance State ──────────────────────────────────────────────────────
  const [attendanceDate, setAttendanceDate] = useState<string>(() => getLocalDateInputValue());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);


  // ─── Toast State ─────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Password Visibility ──────────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);

  const showToast = useCallback((message: string, isError = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastIsError(isError);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    const warnAboutUnsavedContent = (event: BeforeUnloadEvent) => {
      if (!editorDirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnAboutUnsavedContent);
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedContent);
  }, [editorDirty]);

  useEffect(() => {
    if (!editorPreviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditorPreviewOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [editorPreviewOpen]);

  const closeModal = () => {
    setModalType(null);
    setEditingClassId(null);
    setEditingInstructorId(null);
    setEditingPassOptionId(null);
    setItemToDelete(null);
    setPendingEditorPage(null);
    setShowPassword(false);
  };

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/signin');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const fetchDashboardStats = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setDashboardLoading(true);
    try {
      const res = await apiGet<DashboardStats>('/admin/dashboard', token);
      setDashboardStats(res);
    } catch (e: any) {
      showToast(e.message || 'Failed to load dashboard stats', true);
    } finally {
      if (!silent) setDashboardLoading(false);
    }
  }, [token, showToast]);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  
  const fetchPassOptions = useCallback(async () => {
    if (!token) return;
    setPassOptionsLoading(true);
    try {
      const res = await apiGet<any>('/passes/admin/options', token);
      setPassOptions(Array.isArray(res) ? res : res.data ?? []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load passes', true);
    } finally {
      setPassOptionsLoading(false);
    }
  }, [token, showToast]);

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

  const fetchUsers = useCallback(async (search?: string) => {
    if (!token) return;
    setUsersLoading(true);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await apiGet<any>(`/users?limit=100${q}`, token);
      setUsers(res.data ?? res);
    } catch (e: any) {
      showToast(e.message || 'Failed to load users', true);
    } finally {
      setUsersLoading(false);
    }
  }, [token, showToast]);

  const fetchUserDetails = useCallback(async (userId: string) => {
    if (!token) return;
    setUserDetailsLoading(true);
    setIsUserDetailsPanelOpen(true);
    try {
      const res = await apiGet<any>(`/users/${userId}`, token);
      setSelectedUserForDetails(res);
    } catch (e: any) {
      showToast(e.message || 'Failed to load user details', true);
      setIsUserDetailsPanelOpen(false);
    } finally {
      setUserDetailsLoading(false);
    }
  }, [token, showToast]);

  const handleUserRowClick = (userId: string) => {
    fetchUserDetails(userId);
  };

  const fetchEnrollments = useCallback(async () => {
    if (!token) return;
    setEnrollmentsLoading(true);
    try {
      const res = await apiGet<any>('/enrollments?limit=100', token);
      setEnrollments(res.data ?? res);
    } catch (e: any) {
      showToast(e.message || 'Failed to load enrollments', true);
    } finally {
      setEnrollmentsLoading(false);
    }
  }, [token, showToast]);

  const fetchContactMessages = useCallback(async () => {
    if (!token) return;
    setMessagesLoading(true);
    try {
      const res = await apiGet<any>('/contact?limit=100', token);
      setContactMessages(res.data ?? res);
    } catch (e: any) {
      showToast(e.message || 'Failed to load messages', true);
    } finally {
      setMessagesLoading(false);
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
      // These callbacks synchronize the dashboard with the authenticated API.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboardStats();
      fetchClasses();
      fetchInstructors();
      fetchUsers();
      fetchEnrollments();
      fetchContactMessages();
      fetchTestimonials();
      fetchPassOptions();
    }
  }, [isAuthenticated, isAdmin, token, fetchDashboardStats, fetchClasses, fetchInstructors, fetchUsers, fetchEnrollments, fetchContactMessages, fetchTestimonials, fetchPassOptions]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin || !token || activeTab !== 'dashboard') return;

    const refresh = () => void fetchDashboardStats(true);
    const intervalId = window.setInterval(refresh, 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [activeTab, fetchDashboardStats, isAdmin, isAuthenticated, token]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  
  // ─── Attendance Handlers ──────────────────────────────────────────────────
  const handleSaveAttendance = async () => {
    if (!selectedAttendanceClass || !attendanceDate || attendanceRecords.length === 0 || attendanceSaving) return;

    const markedRecords = attendanceRecords.filter((record): record is AttendanceRecord & { attended: boolean } => record.attended !== null);
    if (markedRecords.length === 0) {
      showToast('Mark at least one student as Present or Absent before saving.', true);
      return;
    }
    const recordsToSave = markedRecords.map(r => ({
      enrollmentId: r.enrollmentId,
      attended: r.attended
    }));

    try {
      setAttendanceSaving(true);
      await apiPost('/attendance', {
        classId: selectedAttendanceClass,
        sessionDate: attendanceDate,
        records: recordsToSave
      }, token!);
      showToast(`Attendance saved for ${recordsToSave.length} ${recordsToSave.length === 1 ? 'student' : 'students'}.`);
      await handleLoadAttendance(selectedAttendanceClass, attendanceDate);
    } catch (e: any) {
      showToast(e.message || 'Failed to save attendance', true);
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleLoadAttendance = useCallback(async (classId: string, date: string) => {
    if (!classId || !date || !token) return;
    const loadId = ++attendanceLoadIdRef.current;
    setAttendanceLoading(true);
    try {
      const [res, enrollRes] = await Promise.all([
        apiGet<any>(`/attendance/class/${encodeURIComponent(classId)}?sessionDate=${encodeURIComponent(date)}`, token),
        apiGet<any>(`/enrollments?classId=${encodeURIComponent(classId)}&limit=100`, token),
      ]);
      if (loadId !== attendanceLoadIdRef.current) return;
      const records = Array.isArray(res) ? res : res.data ?? [];
      const enrolled = Array.isArray(enrollRes) ? enrollRes : enrollRes.data ?? [];
      setAttendanceRecords(mergeAttendanceRecords(records, enrolled));
    } catch (e: any) {
      if (loadId !== attendanceLoadIdRef.current) return;
      setAttendanceRecords([]);
      showToast(e.message || 'Failed to load attendance', true);
    } finally {
      if (loadId === attendanceLoadIdRef.current) setAttendanceLoading(false);
    }
  }, [token, showToast]);


  useEffect(() => {
    // Lazily load tab data that was not available during the initial request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === 'classes' && classes.length === 0) fetchClasses();
    if (activeTab === 'instructors' && instructors.length === 0) fetchInstructors();
    if (activeTab === 'users' && users.length === 0) fetchUsers();
    if (activeTab === 'enrollments' && enrollments.length === 0) fetchEnrollments();
    if (activeTab === 'messages' && contactMessages.length === 0) fetchContactMessages();
    if (activeTab === 'testimonials' && testimonials.length === 0) fetchTestimonials();
    if (activeTab === 'passes' && passOptions.length === 0) fetchPassOptions();
  }, [activeTab, fetchClasses, fetchInstructors, fetchUsers, fetchEnrollments, fetchContactMessages, fetchTestimonials, fetchPassOptions, classes.length, instructors.length, users.length, enrollments.length, contactMessages.length, testimonials.length, passOptions.length]);

  if (isLoading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!isAuthenticated || !isAdmin) return null;

  const handleUserDeactivate = async (id: string) => {
    try {
      await apiDelete(`/users/${id}`, token!);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u));
      showToast('User deactivated successfully');
    } catch (e: any) {
      showToast(e.message || 'Failed to deactivate user', true);
    }
  };

  const handleUserRoleChange = async (id: string, role: string) => {
    try {
      await apiPatch(`/users/${id}`, { role }, token!);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      showToast('Role updated successfully');
    } catch (e: any) {
      showToast(e.message || 'Failed to update role', true);
    }
  };

  const handleEnrollmentStatusChange = async (id: string, status: string) => {
    try {
      await apiPatch(`/enrollments/${id}`, { status }, token!);
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      showToast(`Enrollment ${status.toLowerCase()} successfully`);
    } catch (e: any) {
      showToast(e.message || 'Failed to update enrollment', true);
    }
  };

  const handleMarkMessageRead = async (id: string) => {
    try {
      await apiPatch(`/contact/${id}/read`, {}, token!);
      setContactMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (e: any) {
      showToast(e.message || 'Failed to mark as read', true);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await apiDelete(`/contact/${id}`, token!);
      setContactMessages(prev => prev.filter(m => m.id !== id));
      setExpandedMessageId(null);
      showToast('Message deleted');
    } catch (e: any) {
      showToast(e.message || 'Failed to delete message', true);
    }
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
      } else if (itemToDelete.type === 'pass') {
        await apiDelete(`/passes/admin/options/${itemToDelete.id}`, token!);
        setPassOptions(prev => prev.filter(pass => pass.id !== itemToDelete.id));
        showToast('Pass option deleted successfully');
      }
      closeModal();
    } catch (e: any) {
      showToast(e.message || 'Failed to delete', true);
    } finally {
      setIsSaving(false);
    }
  };




  const executeLoadEditorPage = async (label: string) => {
    const page = cmsPages.find(item => item.label === label);
    if (!page || !token) return;
    setActiveEditorPage(label);
    setEditorLoading(true);
    setEditorLastSavedAt(null);
    try {
      const result = await apiGet<{ content: string; updatedAt: string }>(`/admin/content/${page.key}`, token);
      setEditorContent(parseCmsContent(result.content, page.fields));
      setEditorLastSavedAt(result.updatedAt);
      setEditorDirty(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No published content')) {
        setEditorContent({ ...page.fields });
        setEditorDirty(false);
      } else {
        showToast(error instanceof Error ? error.message : 'Failed to load page content', true);
      }
    } finally {
      setEditorLoading(false);
    }
  };

  const loadEditorPage = async (label: string) => {
    if (label === activeEditorPage) return;
    if (editorDirty) {
      setPendingEditorPage(label);
      setModalType('confirmDiscard');
      return;
    }
    await executeLoadEditorPage(label);
  };

  const loadNewsletterSubscribers = async () => {
    if (!token) return;
    try { setNewsletterSubscribers(await apiGet<NewsletterSubscriberRow[]>('/newsletter/admin/subscribers', token)); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Failed to load subscribers', true); }
  };

  const sendNewsletterCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !window.confirm(`Send this campaign to ${newsletterSubscribers.filter(item => item.status === 'ACTIVE').length} active subscribers?`)) return;
    setNewsletterSending(true);
    try {
      const result = await apiPost<{ sent: number }>('/newsletter/admin/campaigns', newsletterCampaign, token);
      showToast(`Newsletter sent to ${result.sent} subscribers.`);
      setNewsletterCampaign({ subject: '', message: '' });
    } catch (error) { showToast(error instanceof Error ? error.message : 'Failed to send newsletter', true); }
    finally { setNewsletterSending(false); }
  };

  const handlePreviewSite = () => {
    const page = cmsPages.find(item => item.label === activeEditorPage);
    if (!page) return;
    const previewRoutes: Record<string, string> = {
      home: '/',
      about: '/about',
      pricing: '/pricing',
      contact: '/about#contact',
    };
    try {
      window.localStorage.setItem(`${CMS_PREVIEW_STORAGE_PREFIX}${page.key}`, JSON.stringify(editorContent));
      const [path, hash = ''] = previewRoutes[page.key].split('#');
      const previewWindow = window.open(`${path}?cmsPreview=${page.key}${hash ? `#${hash}` : ''}`, '_blank');
      if (!previewWindow) {
        setEditorPreviewOpen(true);
        showToast('The browser blocked the new tab, so an in-dashboard preview was opened instead.');
      }
    } catch {
      showToast('The browser blocked site preview storage. Enable site storage and try again.', true);
    }
  };

  const handlePublishContent = async () => {
    const page = cmsPages.find(item => item.label === activeEditorPage);
    if (!page || !token || Object.values(editorContent).some(value => !value.trim())) {
      showToast('Every content field is required.', true);
      return;
    }
    setEditorSaving(true);
    try {
      const result = await apiPut<{ updatedAt: string }>(`/admin/content/${page.key}`, {
        pageKey: page.key,
        content: JSON.stringify(editorContent),
      }, token);
      setEditorLastSavedAt(result.updatedAt);
      setEditorDirty(false);
      showToast(`${activeEditorPage} content saved successfully.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save page content', true);
    } finally {
      setEditorSaving(false);
    }
  };

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
          imageUrl: (formData.get('imageUrl') as string) || undefined,
          priceUsd: parseFloat(formData.get('priceUsd') as string),
          maxCapacity: parseInt(formData.get('maxCapacity') as string),
          scheduleDay: formData.get('scheduleDay') as string,
          scheduleTime: formData.get('scheduleTime') as string || `${formData.get('scheduleHour')}:${formData.get('scheduleMinute')} ${formData.get('scheduleAmPm')}`,
          durationMinutes: parseInt(formData.get('durationMinutes') as string),
        };
        await apiPost('/classes', payload, token);
        showToast('Class created successfully!');
        await fetchClasses();

      
      } else if (modalType === 'addPass') {
        const payload: any = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          priceUsd: parseFloat(formData.get('priceUsd') as string),
        };
        const totalClasses = formData.get('totalClasses') as string;
        if (totalClasses) payload.totalClasses = parseInt(totalClasses);
        
        const validityDays = formData.get('validityDays') as string;
        if (validityDays) payload.validityDays = parseInt(validityDays);

        await apiPost('/passes/admin/options', payload, token);
        showToast('Pass Option created successfully!');
        await fetchPassOptions();

      } else if (modalType === 'editPass') {
        const payload: any = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          priceUsd: parseFloat(formData.get('priceUsd') as string),
          isActive: formData.get('isActive') === 'true',
          totalClasses: null,
          validityDays: null
        };
        const totalClasses = formData.get('totalClasses') as string;
        if (totalClasses) payload.totalClasses = parseInt(totalClasses);
        
        const validityDays = formData.get('validityDays') as string;
        if (validityDays) payload.validityDays = parseInt(validityDays);

        await apiPatch(`/passes/admin/options/${editingPassOptionId}`, payload, token);
        showToast('Pass Option updated successfully!');
        await fetchPassOptions();

      } else if (modalType === 'editClass') {
        const payload: any = {
          name: formData.get('name') as string,
          type: formData.get('type') as string,
          instructorId: formData.get('instructorId') as string,
          meetingLink: (formData.get('meetingLink') as string) || undefined,
          imageUrl: (formData.get('imageUrl') as string) || undefined,
          priceUsd: parseFloat(formData.get('priceUsd') as string),
          maxCapacity: parseInt(formData.get('maxCapacity') as string),
          scheduleDay: formData.get('scheduleDay') as string,
          scheduleTime: formData.get('scheduleTime') as string || `${formData.get('scheduleHour')}:${formData.get('scheduleMinute')} ${formData.get('scheduleAmPm')}`,
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
          photoUrl: (formData.get('photoUrl') as string) || undefined,
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
          photoUrl: (formData.get('photoUrl') as string) || undefined,
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
  const editingPassOption = passOptions.find(p => p.id === editingPassOptionId);
  const editingClass = classes.find(c => c.id === editingClassId);
  const editingInstructor = instructors.find(i => i.id === editingInstructorId);
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const adminKpis = dashboardStats ? [
    { id: 'revenue', label: 'Total Revenue', value: currency.format(dashboardStats.totalRevenueUsd), trend: `${currency.format(dashboardStats.monthlyRevenueUsd)} this month`, details: [['Successful payments', dashboardStats.successfulPayments], ['This month', currency.format(dashboardStats.monthlyRevenueUsd)], ['All-time revenue', currency.format(dashboardStats.totalRevenueUsd)]], tab: 'bookings' },
    { id: 'students', label: 'Active Students', value: dashboardStats.totalStudents, trend: `+${dashboardStats.newUsersThisWeek} this week`, details: [['Active students', dashboardStats.totalStudents], ['New this week', dashboardStats.newUsersThisWeek], ['New this month', dashboardStats.newUsersThisMonth]], tab: 'users' },
    { id: 'classes', label: 'Active Classes', value: dashboardStats.activeClasses, trend: `${dashboardStats.totalClasses} total`, details: [['Active', dashboardStats.activeClasses], ['Inactive', Math.max(0, dashboardStats.totalClasses - dashboardStats.activeClasses)], ['Total classes', dashboardStats.totalClasses]], tab: 'classes' },
    { id: 'enrollments', label: 'Active Enrollments', value: dashboardStats.activeEnrollments, trend: `${dashboardStats.pendingEnrollments} pending`, details: [['Active', dashboardStats.activeEnrollments], ['Pending', dashboardStats.pendingEnrollments], ['Completed', dashboardStats.completedEnrollments], ['Cancelled', dashboardStats.cancelledEnrollments], ['Total', dashboardStats.totalEnrollments]], tab: 'bookings' },
    { id: 'messages', label: 'Unread Messages', value: dashboardStats.unreadContactMessages, trend: `${dashboardStats.totalContactMessages} total`, details: [['Unread', dashboardStats.unreadContactMessages], ['Read', Math.max(0, dashboardStats.totalContactMessages - dashboardStats.unreadContactMessages)], ['Total messages', dashboardStats.totalContactMessages]], tab: 'messages' },
    { id: 'testimonials', label: 'Pending Testimonials', value: dashboardStats.pendingTestimonials, trend: `${dashboardStats.totalTestimonials} total`, details: [['Pending review', dashboardStats.pendingTestimonials], ['Processed', Math.max(0, dashboardStats.totalTestimonials - dashboardStats.pendingTestimonials)], ['Total testimonials', dashboardStats.totalTestimonials]], tab: 'testimonials' },
    { id: 'instructors', label: 'Instructors', value: dashboardStats.totalInstructorProfiles, trend: `${dashboardStats.totalInstructorUsers} instructor accounts`, details: [['Active profiles', dashboardStats.totalInstructorProfiles], ['Instructor accounts', dashboardStats.totalInstructorUsers], ['Students added this month', dashboardStats.newUsersThisMonth]], tab: 'instructors' },
  ] : [];
  const selectedKpiData = adminKpis.find(kpi => kpi.id === selectedKpi);
  const visibleClasses = classCardFilter === 'active' ? classes.filter(c => c.status === 'ACTIVE') : classes;

  return (
    <div className={styles.admin}>
      {/* Mobile Overlay */}
      <div 
        className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.mobileOverlayOpen : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
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
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
                if (tab.id === 'content') void loadEditorPage(activeEditorPage);
                if (tab.id === 'newsletter') void loadNewsletterSubscribers();
              }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className={styles.mobileToggle} onClick={() => setIsMobileMenuOpen(true)} aria-label="Open admin navigation" type="button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <span className={styles.adminBadge}>Admin</span>
          </div>
          <span className={styles.userName}>{user?.name || 'Admin User'}</span>
        </header>

        <main className={styles.content}>

          {/* ── Dashboard ── */}
          {activeTab === 'dashboard' && (
            <>
              <h1 className={styles.pageTitle}>Admin Dashboard</h1>
              <p className={styles.pageSubtitle}>Live studio performance overview</p>
              {dashboardLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading stats...</div>
              ) : (
                <>
                  <div className={styles.kpiGrid}>
                    {adminKpis.map(kpi => (
                      <button type="button" key={kpi.id} className={`${styles.kpiCard} ${selectedKpi === kpi.id ? styles.kpiCardSelected : ''}`} onClick={() => setSelectedKpi(current => current === kpi.id ? null : kpi.id)} aria-expanded={selectedKpi === kpi.id} aria-controls="admin-kpi-details">
                        <span className={styles.kpiLabel}>{kpi.label}</span><strong className={styles.kpiValue}>{kpi.value}</strong><span className={`${styles.kpiTrend} ${styles.trendPositive}`}>{kpi.trend}</span><span className={styles.kpiHint}>View details →</span>
                      </button>
                    ))}
                  </div>
                  {selectedKpiData && (
                    <section id="admin-kpi-details" className={styles.kpiDetailPanel} aria-live="polite">
                      <div className={styles.kpiDetailHeader}><div><span>Metric details</span><h2>{selectedKpiData.label}</h2></div><button type="button" onClick={() => setSelectedKpi(null)} aria-label="Close KPI details">×</button></div>
                      <div className={styles.kpiDetailGrid}>{selectedKpiData.details.map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div>
                      <div className={styles.kpiDetailFooter}><span>Updated {dashboardStats ? new Date(dashboardStats.revenueUpdatedAt).toLocaleString() : 'just now'}</span>{selectedKpiData.tab && <button type="button" className={styles.btnPrimary} onClick={() => { setActiveTab(selectedKpiData.tab); setSelectedKpi(null); }}>Open {adminTabs.find(tab => tab.id === selectedKpiData.tab)?.label || 'details'}</button>}</div>
                    </section>
                  )}
                  {/* Recent enrollments */}
                  {(dashboardStats?.recentEnrollments?.length ?? 0) > 0 && (
                    <div style={{ marginTop: '32px' }}>
                      <h3 className={styles.chartTitle} style={{ marginBottom: '16px' }}>Recent Enrollments</h3>
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Enrolled</th></tr></thead>
                          <tbody>
                            {dashboardStats!.recentEnrollments.slice(0, 8).map((e: any) => (
                              <tr key={e.id}>
                                <td>{e.user?.name}</td>
                                <td>{e.class?.name}</td>
                                <td><span className={`${styles.badge} ${e.status === 'APPROVED' || e.status === 'ACTIVE' ? styles.badgeSuccess : e.status === 'PENDING' ? styles.badgeWarning : styles.badgeNeutral}`}>{e.status}</span></td>
                                <td>{new Date(e.enrolledAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {/* Popular classes */}
                  {(dashboardStats?.popularClasses?.length ?? 0) > 0 && (
                    <div style={{ marginTop: '32px' }}>
                      <h3 className={styles.chartTitle} style={{ marginBottom: '16px' }}>Popular Classes</h3>
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead><tr><th>Class</th><th>Type</th><th>Schedule</th><th>Enrolled/Max</th></tr></thead>
                          <tbody>
                            {dashboardStats!.popularClasses.map((c: any) => (
                              <tr key={c.id}>
                                <td><strong>{c.name}</strong></td>
                                <td>{c.type}</td>
                                <td>{c.scheduleDay} {c.scheduleTime}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ width: `${Math.min(100, (c.currentEnrollment / c.maxCapacity) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.currentEnrollment}/{c.maxCapacity}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          
          {/* ── Passes ── */}
          {activeTab === 'passes' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Class Passes</h1>
                  <p className={styles.pageSubtitle}>Manage pricing and pass options for students.</p>
                </div>
                <button className={styles.btnPrimary} onClick={() => setModalType('addPass')}>
                  + Create Pass Option
                </button>
              </div>
              <div className={styles.tableContainer}>
                {passOptionsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading passes...</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Price (USD)</th>
                        <th>Total Classes</th>
                        <th>Validity (Days)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passOptions.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No passes found.</td></tr>
                      ) : passOptions.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>${p.priceUsd}</td>
                          <td>{p.totalClasses ?? 'Unlimited'}</td>
                          <td>{p.validityDays ?? 'No Expiry'}</td>
                          <td>
                            <span className={`${styles.badge} ${p.isActive ? styles.badgeSuccess : styles.badgeFailed}`}>
                              {p.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`${styles.actionBtn} ${styles.btnEdit}`}
                              onClick={() => { setEditingPassOptionId(p.id); setModalType('editPass'); }}
                              style={{ marginRight: '8px' }}
                            >
                              Edit
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.btnDelete}`}
                              onClick={() => { setItemToDelete({ id: p.id, type: 'pass' }); setModalType('confirmDelete'); }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── Users ── */}
          {activeTab === 'users' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Users</h1>
                  <p className={styles.pageSubtitle}>Manage all registered users, roles, and account status.</p>
                </div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className={styles.input}
                  style={{ maxWidth: '360px' }}
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchUsers(userSearch)}
                />
                <button className={styles.btnPrimary} onClick={() => fetchUsers(userSearch)}>Search</button>
                <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => { setUserSearch(''); fetchUsers(); }}>Clear</button>
              </div>
              <div className={styles.tableContainer}>
                {usersLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Experience</th>
                        <th>Enrollments</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No users found.</td></tr>
                      ) : users.map(u => (
                        <tr key={u.id} onClick={() => handleUserRowClick(u.id)} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} className={styles.tableRowHover}>
                          <td><strong>{u.name}</strong></td>
                          <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td>
                            <select
                              value={u.role}
                              onChange={e => { e.stopPropagation(); handleUserRoleChange(u.id, e.target.value); }}
                              onClick={e => e.stopPropagation()}
                              style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem', background: 'var(--bg-alt)', color: 'var(--text)' }}
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="INSTRUCTOR">INSTRUCTOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td>{u.experienceLevel}</td>
                          <td style={{ textAlign: 'center' }}>{u._count?.enrollments ?? 0}</td>
                          <td>
                            <span className={`${styles.badge} ${u.isActive ? styles.badgeSuccess : styles.badgeFailed}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              className={`${styles.actionBtn} ${styles.btnPrimary}`}
                              style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'var(--primary-soft)', color: 'var(--primary)' }}
                              onClick={(e) => { e.stopPropagation(); handleUserRowClick(u.id); }}
                            >
                              View
                            </button>
                            {u.isActive && (
                              <button
                                className={`${styles.actionBtn} ${styles.btnDelete}`}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                onClick={(e) => { e.stopPropagation(); handleUserDeactivate(u.id); }}
                              >
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ── User Details Side Panel ── */}
              <div className={`${styles.sidePanelOverlay} ${isUserDetailsPanelOpen ? styles.sidePanelOverlayOpen : ''}`} onClick={() => setIsUserDetailsPanelOpen(false)}>
                <div className={`${styles.sidePanel} ${isUserDetailsPanelOpen ? styles.sidePanelOpen : ''}`} onClick={e => e.stopPropagation()}>
                  <div className={styles.sidePanelHeader}>
                    <h2>User Details</h2>
                    <button className={styles.closeBtn} onClick={() => setIsUserDetailsPanelOpen(false)}>✕</button>
                  </div>
                  
                  <div className={styles.sidePanelContent}>
                    {userDetailsLoading ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading details...</div>
                    ) : selectedUserForDetails ? (
                      <>
                        {/* Profile Summary */}
                        <div className={styles.detailsCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                                {selectedUserForDetails.name}
                              </h3>
                              <p style={{ margin: '0 0 3px 0', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500 }}>
                                {selectedUserForDetails.email}
                              </p>
                              {selectedUserForDetails.phone && (
                                <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500 }}>
                                  {selectedUserForDetails.phone}
                                </p>
                              )}
                            </div>
                            <span className={`${styles.badge} ${selectedUserForDetails.isActive ? styles.badgeSuccess : styles.badgeFailed}`}>
                              {selectedUserForDetails.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1.5px solid var(--border)' }}>
                            <div>
                              <span className={styles.detailLabel}>Role</span>
                              <p className={styles.detailValue}>{selectedUserForDetails.role}</p>
                            </div>
                            <div>
                              <span className={styles.detailLabel}>Experience</span>
                              <p className={styles.detailValue}>{selectedUserForDetails.experienceLevel}</p>
                            </div>
                            <div>
                              <span className={styles.detailLabel}>Joined</span>
                              <p className={styles.detailValue}>{new Date(selectedUserForDetails.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {selectedUserForDetails.healthNotes && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1.5px solid var(--border)' }}>
                              <span className={styles.detailLabel}>Health Notes</span>
                              <p className={styles.detailValue} style={{ fontWeight: 400, color: 'var(--text)' }}>{selectedUserForDetails.healthNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Registration Details */}
                        <div className={styles.detailsCard}>
                          <h4 className={styles.detailCardTitle}>Registration Details</h4>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                              <span className={styles.detailLabel}>Date of Birth</span>
                              <p className={styles.detailValue}>
                                {selectedUserForDetails.dob ? new Date(selectedUserForDetails.dob).toLocaleDateString() : 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <span className={styles.detailLabel}>Practice Frequency</span>
                              <p className={styles.detailValue}>{selectedUserForDetails.practiceFrequency || 'Not provided'}</p>
                            </div>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <span className={styles.detailLabel}>Emergency Contact</span>
                            <p className={styles.detailValue}>
                              {selectedUserForDetails.emergencyContactName || 'N/A'}{selectedUserForDetails.emergencyContactPhone ? ` (${selectedUserForDetails.emergencyContactPhone})` : ''}
                            </p>
                          </div>

                          {(selectedUserForDetails.purposeOfJoining && selectedUserForDetails.purposeOfJoining.length > 0) && (
                            <div style={{ marginBottom: '16px' }}>
                              <span className={styles.detailLabel}>Purpose of Joining</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {selectedUserForDetails.purposeOfJoining.map((purpose: string, idx: number) => (
                                  <span key={idx} style={{
                                    background: 'var(--primary-soft)',
                                    color: 'var(--primary)',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    border: '1px solid var(--primary)',
                                    opacity: 0.85
                                  }}>{purpose}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1.5px solid var(--border)', marginBottom: '16px' }}>
                            <div>
                              <span className={styles.detailLabel}>Physical Health</span>
                              <p className={styles.detailValue}>{selectedUserForDetails.physicalHealth || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className={styles.detailLabel}>Mental Health</span>
                              <p className={styles.detailValue}>{selectedUserForDetails.mentalHealth || 'Not specified'}</p>
                            </div>
                          </div>

                          <div style={{ paddingTop: '16px', borderTop: '1.5px solid var(--border)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                background: selectedUserForDetails.liabilityWaiver ? 'var(--success-soft)' : 'var(--error-soft)',
                                color: selectedUserForDetails.liabilityWaiver ? 'var(--success)' : 'var(--error)',
                                width: '24px', height: '24px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.85rem', fontWeight: 700
                              }}>
                                {selectedUserForDetails.liabilityWaiver ? '✓' : '✗'}
                              </span>
                              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>Liability Waiver</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                background: selectedUserForDetails.digitalMediaWaiver ? 'var(--success-soft)' : 'var(--error-soft)',
                                color: selectedUserForDetails.digitalMediaWaiver ? 'var(--success)' : 'var(--error)',
                                width: '24px', height: '24px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.85rem', fontWeight: 700
                              }}>
                                {selectedUserForDetails.digitalMediaWaiver ? '✓' : '✗'}
                              </span>
                              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>Digital Media Waiver</span>
                            </div>
                          </div>
                        </div>

                        {/* Enrollments */}
                        <div className={styles.detailsCard}>
                          <h4 className={styles.detailCardTitle}>Recent Enrollments</h4>
                          {(!selectedUserForDetails.enrollments || selectedUserForDetails.enrollments.length === 0) ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No recent enrollments.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {selectedUserForDetails.enrollments.map((e: any) => (
                                <div key={e.id} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: '8px',
                                  border: '1px solid var(--border)'
                                }}>
                                  <div>
                                    <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{e.class?.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                      Enrolled: {new Date(e.enrolledAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 700, border: '1px solid var(--primary)', opacity: 0.85 }}>
                                      {e.status}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                      {e.attendances?.length ?? 0} sessions attended
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Active Passes */}
                        <div className={styles.detailsCard}>
                          <h4 className={styles.detailCardTitle}>Passes</h4>
                          {(!selectedUserForDetails.userPasses || selectedUserForDetails.userPasses.length === 0) ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No passes purchased.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {selectedUserForDetails.userPasses.map((p: any) => (
                                <div key={p.id} style={{ padding: '14px', border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--surface-alt)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.97rem' }}>{p.passOption?.name}</p>
                                    <span className={`${styles.badge} ${p.isActive ? styles.badgeSuccess : styles.badgeFailed}`}>
                                      {p.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>Remaining: {p.remainingClasses !== null ? p.remainingClasses : 'Unlimited'}</span>
                                    {p.expiresAt && <span>Expires: {new Date(p.expiresAt).toLocaleDateString()}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Payments */}
                        <div className={styles.detailsCard}>
                          <h4 className={styles.detailCardTitle}>Recent Payments</h4>
                          {(!selectedUserForDetails.payments || selectedUserForDetails.payments.length === 0) ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No payment history.</p>
                          ) : (
                            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ textAlign: 'left', color: 'var(--text)', borderBottom: '1.5px solid var(--border)' }}>
                                  <th style={{ paddingBottom: '8px' }}>Date</th>
                                  <th style={{ paddingBottom: '8px' }}>Item</th>
                                  <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Amount</th>
                                  <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedUserForDetails.payments.map((pay: any) => (
                                  <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '8px 0' }}>{new Date(pay.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px 0' }}>{pay.enrollment ? `Class: ${pay.enrollment.class?.name}` : (pay.userPass ? `Pass: ${pay.userPass.passOption?.name}` : 'Unknown')}</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>${parseFloat(pay.amountUsd).toFixed(2)}</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: pay.status === 'SUCCEEDED' ? '#edf2ee' : '#faeeec', color: pay.status === 'SUCCEEDED' ? '#557A5B' : '#C17767', fontSize: '0.7rem', fontWeight: 600 }}>
                                        {pay.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                      </>
                    ) : (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>User not found.</div>
                    )}
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
                  <p className={styles.pageSubtitle}>Manage your complete studio schedule and class details.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button className={styles.btnPrimary} onClick={() => setModalType('addClass')}>+ Add Class</button>
                </div>
              </div>
              {classesLoading ? (
                <div className={styles.classesState} role="status">
                  <div className={styles.spinner} aria-hidden="true" />
                  <span>Loading classes…</span>
                </div>
              ) : classes.length === 0 ? (
                <div className={styles.classesState}>
                  <div className={styles.emptyStateIcon} aria-hidden="true">+</div>
                  <h2>No classes yet</h2>
                  <p>Create your first class to start building the studio schedule.</p>
                  <button className={styles.btnPrimary} onClick={() => setModalType('addClass')}>Add your first class</button>
                </div>
              ) : (
                <>
                  <section className={styles.classSummaryGrid} aria-label="Class summary">
                    <button type="button" className={`${styles.classSummaryCard} ${classCardFilter === 'all' ? styles.classSummarySelected : ''}`} onClick={() => setClassCardFilter('all')} aria-pressed={classCardFilter === 'all'}>
                      <span>Total classes</span>
                      <strong>{classes.length}</strong>
                    </button>
                    <button type="button" className={`${styles.classSummaryCard} ${classCardFilter === 'active' ? styles.classSummarySelected : ''}`} onClick={() => setClassCardFilter('active')} aria-pressed={classCardFilter === 'active'}>
                      <span>Active classes</span>
                      <strong>{classes.filter(c => c.status === 'ACTIVE').length}</strong>
                    </button>
                    <button type="button" className={styles.classSummaryCard} onClick={() => setClassCardFilter('all')}>
                      <span>Total enrollment</span>
                      <strong>{classes.reduce((total, c) => total + (c.currentEnrollment || 0), 0)}</strong>
                    </button>
                  </section>

                  <section className={styles.classCardGrid} aria-label={`${visibleClasses.length} classes`}>
                    {visibleClasses.map(c => {
                      const enrollment = c.currentEnrollment || 0;
                      const capacity = c.maxCapacity || 0;
                      const occupancy = capacity > 0 ? Math.min(100, Math.round((enrollment / capacity) * 100)) : 0;
                      const price = Number(c.priceUsd);

                      return (
                        <article key={c.id} className={styles.classCard}>
                          <div className={styles.classCardHeader}>
                            <div className={styles.classIdentity}>
                              <div className={styles.classMonogram} aria-hidden="true">{c.name?.charAt(0).toUpperCase() || 'C'}</div>
                              <div>
                                <div className={styles.classBadges}>
                                  <span className={`${styles.badge} ${c.status === 'ACTIVE' ? styles.badgeSuccess : styles.badgeNeutral}`}>{c.status}</span>
                                  <span className={styles.classType}>{c.type || 'Class'}</span>
                                </div>
                                <h2 className={styles.classCardTitle}>{c.name}</h2>
                                <p className={styles.classInstructor}>with {c.instructor?.user?.name || 'Instructor not assigned'}</p>
                              </div>
                            </div>
                          </div>

                          {c.description && <p className={styles.classDescription}>{c.description}</p>}

                          <dl className={styles.classDetails}>
                            <div><dt>Schedule</dt><dd>{c.scheduleDay || 'Not set'} · {c.scheduleTime || 'Time not set'}</dd></div>
                            <div><dt>Duration</dt><dd>{c.durationMinutes ? `${c.durationMinutes} minutes` : 'Not set'}</dd></div>
                            <div><dt>Age group</dt><dd>{c.ageGroup || 'All ages'}</dd></div>
                            <div><dt>Price</dt><dd>{Number.isFinite(price) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price) : 'Not set'}</dd></div>
                          </dl>

                          <div className={styles.capacityBlock}>
                            <div className={styles.capacityRow}>
                              <span>Enrollment</span>
                              <strong>{enrollment} / {capacity || '—'}</strong>
                            </div>
                            <div className={styles.capacityTrack} aria-label={`${occupancy}% full`} role="img">
                              <span style={{ width: `${occupancy}%` }} />
                            </div>
                          </div>

                          <div className={styles.classMetaRow}>
                            <span>{c.meetingLink ? 'Online meeting configured' : 'No meeting link'}</span>
                            <span>{capacity > enrollment ? `${capacity - enrollment} spots available` : capacity > 0 ? 'Class full' : 'Capacity not set'}</span>
                          </div>

                          <div className={styles.classCardActions}>
                            <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => {
                              setActiveTab('attendance');
                              setSelectedAttendanceClass(c.id);
                              handleLoadAttendance(c.id, attendanceDate);
                            }}>Attendance</button>
                            <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => { setEditingClassId(c.id); setModalType('editClass'); }}>Edit</button>
                            <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDeleteClass(c.id)}>Delete</button>
                          </div>
                        </article>
                      );
                    })}
                  </section>
                </>
              )}
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
                  <h1 className={styles.pageTitle}>Bookings & Enrollments</h1>
                  <p className={styles.pageSubtitle}>Manage all class enrollments and update their status.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => {
                    const headers = ['Student', 'Email', 'Class', 'Schedule', 'Status', 'Enrolled'];
                    const rows = enrollments.map(e => `"${e.user?.name}","${e.user?.email}","${e.class?.name}","${e.class?.scheduleDay} ${e.class?.scheduleTime}","${e.status}","${new Date(e.enrolledAt).toLocaleDateString()}"`);
                    const csv = [headers.join(','), ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `enrollments_${new Date().toISOString().split('T')[0]}.csv`; a.click();
                  }}>Export CSV</button>
                  <button className={styles.btnPrimary} onClick={fetchEnrollments}>Refresh</button>
                </div>
              </div>
              <div className={styles.tableContainer}>
                {enrollmentsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading enrollments...</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr><th>Student</th><th>Email</th><th>Class</th><th>Schedule</th><th>Status</th><th>Enrolled</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {enrollments.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No enrollments found.</td></tr>
                      ) : enrollments.map(e => (
                        <tr key={e.id}>
                          <td><strong>{e.user?.name}</strong></td>
                          <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{e.user?.email}</td>
                          <td>{e.class?.name}</td>
                          <td style={{ fontSize: '0.85rem' }}>{e.class?.scheduleDay} {e.class?.scheduleTime}</td>
                          <td>
                            <span className={`${styles.badge} ${
                              e.status === 'APPROVED' || e.status === 'ACTIVE' ? styles.badgeSuccess
                              : e.status === 'PENDING' ? styles.badgeWarning
                              : e.status === 'CANCELLED' || e.status === 'REJECTED' ? styles.badgeFailed
                              : styles.badgeNeutral
                            }`}>{e.status}</span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(e.enrolledAt).toLocaleDateString()}</td>
                          <td>
                            <div className={styles.actionBtns}>
                              {e.status === 'PENDING' && (
                                <>
                                  <button className={`${styles.actionBtn} ${styles.btnEdit}`} style={{ color: 'var(--success)' }} onClick={() => handleEnrollmentStatusChange(e.id, 'APPROVED')}>Approve</button>
                                  <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleEnrollmentStatusChange(e.id, 'REJECTED')}>Reject</button>
                                </>
                              )}
                              {(e.status === 'APPROVED' || e.status === 'ACTIVE') && (
                                <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleEnrollmentStatusChange(e.id, 'CANCELLED')}>Cancel</button>
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




          {/* ── Attendance ── */}
          {activeTab === 'attendance' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Attendance Manager</h1>
                  <p className={styles.pageSubtitle}>Explicitly mark each student Present or Absent. Unmarked students are not counted.</p>
                </div>
              </div>
              <div className={styles.attendanceControls}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Select Class</label>
                  <select
                    className={styles.input}
                    value={selectedAttendanceClass}
                    onChange={(e) => {
                      const classId = e.target.value;
                      attendanceLoadIdRef.current += 1;
                      setSelectedAttendanceClass(classId);
                      setAttendanceRecords([]);
                      setAttendanceLoading(false);
                      if (classId && attendanceDate) handleLoadAttendance(classId, attendanceDate);
                    }}
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
                    onChange={(e) => {
                      const date = e.target.value;
                      attendanceLoadIdRef.current += 1;
                      setAttendanceDate(date);
                      setAttendanceRecords([]);
                      setAttendanceLoading(false);
                      if (selectedAttendanceClass && date) handleLoadAttendance(selectedAttendanceClass, date);
                    }}
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
                      <div className={styles.attendanceSummary} aria-live="polite">
                        <span><strong>{attendanceRecords.filter(record => record.attended === true).length}</strong> Present</span>
                        <span><strong>{attendanceRecords.filter(record => record.attended === false).length}</strong> Absent</span>
                        <span><strong>{attendanceRecords.filter(record => record.attended === null).length}</strong> Unmarked</span>
                      </div>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Email Address</th>
                            <th style={{ width: '280px', textAlign: 'center' }}>Attendance Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.map((record, index) => (
                            <tr key={record.enrollmentId}>
                              <td><strong>{record.studentName}</strong></td>
                              <td>{record.studentEmail}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div className={styles.attendanceChoice} role="group" aria-label={`Attendance for ${record.studentName}`}>
                                  <button type="button" className={record.attended === true ? styles.attendancePresentActive : ''} aria-pressed={record.attended === true} onClick={() => setAttendanceRecords(records => records.map((item, itemIndex) => itemIndex === index ? { ...item, attended: true } : item))}>Present</button>
                                  <button type="button" className={record.attended === false ? styles.attendanceAbsentActive : ''} aria-pressed={record.attended === false} onClick={() => setAttendanceRecords(records => records.map((item, itemIndex) => itemIndex === index ? { ...item, attended: false } : item))}>Absent</button>
                                  {record.attended !== null && <button type="button" className={styles.attendanceClear} onClick={() => setAttendanceRecords(records => records.map((item, itemIndex) => itemIndex === index ? { ...item, attended: null } : item))} aria-label={`Clear attendance for ${record.studentName}`}>Clear</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingRight: '24px' }}>
                        <button className={styles.btnPrimary} onClick={handleSaveAttendance} disabled={attendanceSaving || !attendanceRecords.some(record => record.attended !== null)}>
                          {attendanceSaving ? 'Saving...' : 'Save Attendance'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Messages ── */}
          {activeTab === 'messages' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Contact Messages</h1>
                  <p className={styles.pageSubtitle}>View and manage all contact form submissions.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button className={styles.btnPrimary} onClick={fetchContactMessages}>Refresh</button>
                </div>
              </div>
              <div className={styles.tableContainer}>
                {messagesLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading messages...</div>
                ) : contactMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                    <p>No messages yet.</p>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: '24px' }}></th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Received</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactMessages.map(msg => (
                        <>
                          <tr key={msg.id} style={{ cursor: 'pointer', background: msg.isRead ? undefined : 'rgba(104,142,110,0.04)' }} onClick={() => setExpandedMessageId(expandedMessageId === msg.id ? null : msg.id)}>
                            <td>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedMessageId === msg.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </td>
                            <td><strong style={{ fontWeight: msg.isRead ? 400 : 700 }}>{msg.name}</strong></td>
                            <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{msg.email}</td>
                            <td>{msg.subject}</td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(msg.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`${styles.badge} ${msg.isRead ? styles.badgeNeutral : styles.badgeWarning}`}>
                                {msg.isRead ? 'Read' : 'Unread'}
                              </span>
                            </td>
                            <td onClick={e => e.stopPropagation()}>
                              <div className={styles.actionBtns}>
                                {!msg.isRead && (
                                  <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => handleMarkMessageRead(msg.id)}>Mark Read</button>
                                )}
                                <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                          {expandedMessageId === msg.id && (
                            <tr key={`${msg.id}-body`}>
                              <td colSpan={7} style={{ padding: '16px 24px', background: 'var(--bg-alt)', borderTop: 'none' }}>
                                <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxWidth: '700px' }}>
                                  {msg.message}
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                  <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`} className={styles.btnPrimary} style={{ display: 'inline-block', padding: '8px 20px', textDecoration: 'none', borderRadius: '6px', fontSize: '0.9rem' }}>
                                    Reply via Email
                                  </a>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
          {activeTab === 'newsletter' && (
            <>
              <div className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Newsletter</h1><p className={styles.pageSubtitle}>Manage confirmed subscribers and send email campaigns.</p></div><button className={styles.btnPrimary} onClick={loadNewsletterSubscribers}>Refresh</button></div>
              <div className={styles.newsletterGrid}>
                <form className={`${styles.chartCard} ${styles.newsletterComposer}`} onSubmit={sendNewsletterCampaign}>
                  <h2 className={styles.chartTitle}>Create Campaign</h2>
                  <label className={styles.label} htmlFor="newsletter-subject">Subject</label>
                  <input id="newsletter-subject" className={styles.input} maxLength={150} required value={newsletterCampaign.subject} onChange={event => setNewsletterCampaign(current => ({ ...current, subject: event.target.value }))} />
                  <label className={styles.label} htmlFor="newsletter-message" style={{ marginTop: 16 }}>Message</label>
                  <textarea id="newsletter-message" className={styles.input} rows={10} maxLength={20000} required value={newsletterCampaign.message} onChange={event => setNewsletterCampaign(current => ({ ...current, message: event.target.value }))} />
                  <button className={styles.btnPrimary} disabled={newsletterSending} style={{ marginTop: 18 }}>{newsletterSending ? 'Sending…' : 'Send Campaign'}</button>
                </form>
                <div className={styles.chartCard}><h2 className={styles.chartTitle}>Subscribers ({newsletterSubscribers.length})</h2><div className={styles.tableContainer}><table className={`${styles.table} ${styles.subscriberTable}`}><thead><tr><th>Email</th><th>Status</th></tr></thead><tbody>{newsletterSubscribers.map(item => <tr key={item.id}><td>{item.email}</td><td><span className={`${styles.badge} ${item.status === 'ACTIVE' ? styles.badgeSuccess : styles.badgeNeutral}`}>{item.status}</span></td></tr>)}</tbody></table></div></div>
              </div>
            </>
          )}

          {activeTab === 'content' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Content Editor</h1>
                  <p className={styles.pageSubtitle}>Edit website copy and page content.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                  <button type="button" className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={handlePreviewSite} disabled={editorLoading}>Preview Site</button>
                  <button className={styles.btnPrimary} onClick={handlePublishContent} disabled={editorSaving || editorLoading || Object.values(editorContent).some(value => !value.trim())}>
                    {editorSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
              <div className={styles.editorLayout}>
                <div className={styles.editorSidebar}>
                  <div>
                    <div className={styles.editorSectionTitle}>Pages</div>
                    <div className={styles.editorNav}>
                      {cmsPages.map(page => (
                        <button
                          key={page.key}
                          className={`${styles.editorLink} ${activeEditorPage === page.label ? styles.editorLinkActive : ''}`}
                          onClick={() => loadEditorPage(page.label)}
                          disabled={editorLoading || editorSaving}
                        >
                          {page.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.editorMain}>
                  <div className={styles.editorFields}>
                    {Object.entries(editorContent).map(([field, value]) => {
                      const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
                      const isLongText = value.length > 90 || /description|paragraph|bio/i.test(field);
                      const isImageUrl = /imageUrl$/i.test(field);
                      return (
                        <div className={styles.editorField} key={field}>
                          <label className={styles.label} htmlFor={`cms-${field}`}>{label}</label>
                          {isLongText ? (
                            <textarea id={`cms-${field}`} className={styles.input} rows={4} value={value} maxLength={2000} disabled={editorLoading || editorSaving} onChange={event => { setEditorContent(current => ({ ...current, [field]: event.target.value })); setEditorDirty(true); }} />
                          ) : (
                            <>
                              <input id={`cms-${field}`} type={field.endsWith('Url') ? 'url' : field === 'email' ? 'email' : 'text'} className={styles.input} value={value} maxLength={500} disabled={editorLoading || editorSaving} onChange={event => { setEditorContent(current => ({ ...current, [field]: event.target.value })); setEditorDirty(true); }} />
                              {isImageUrl && /^https:\/\//.test(value) && <div className={styles.editorImagePreview} role="img" aria-label={`${label} preview`} style={{ backgroundImage: `url("${value.replaceAll('"', '%22')}")` }} />}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.editorSaveStatus} role="status">
                    {editorLoading ? 'Loading content…' : editorDirty ? 'Unsaved changes' : editorLastSavedAt ? `Last saved ${new Date(editorLastSavedAt).toLocaleString()}` : 'Using default content — save to publish'}
                  </div>
                  <div className={styles.editorSectionTitle}>Live Preview ({activeEditorPage})</div>
                  <div className={styles.editorPreview}>{Object.values(editorContent)[0]}</div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── MODALS ── */}
      {modalType && modalType !== 'confirmDiscard' && (
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
                {modalType === 'addPass' && 'Create Pass Option'}
                {modalType === 'editPass' && 'Edit Pass Option'}
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
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Class Date *</label>
                      <input
                        type="date"
                        name="scheduleDay"
                        required
                        min={modalType === 'addClass' ? new Date().toISOString().split('T')[0] : undefined}
                        defaultValue={/^\d{4}-\d{2}-\d{2}$/.test(editingClass?.scheduleDay ?? '') ? editingClass?.scheduleDay : ''}
                        className={styles.input}
                      />
                      {editingClass?.scheduleDay && !/^\d{4}-\d{2}-\d{2}$/.test(editingClass.scheduleDay) && (
                        <small style={{ color: 'var(--error)' }}>This legacy class uses “{editingClass.scheduleDay}”. Select its next exact class date before saving.</small>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Schedule Time *</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {(() => {
                          const time = editingClass?.scheduleTime || '09:00';
                          let ampm = time.match(/AM|PM/i)?.[0].toUpperCase();
                          const [hStr, mStr] = time.replace(/AM|PM/i, '').trim().split(':');
                          let h = parseInt(hStr || '9', 10);
                          if (!ampm) {
                            ampm = h >= 12 ? 'PM' : 'AM';
                            if (h > 12) h -= 12;
                            if (h === 0) h = 12;
                          }
                          const m = mStr?.padStart(2, '0') || '00';

                          return (
                            <>
                              <select name="scheduleHour" defaultValue={h.toString()} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', flex: 1 }}>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => <option key={num} value={num}>{num}</option>)}
                              </select>
                              <span>:</span>
                              <select name="scheduleMinute" defaultValue={m} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', flex: 1 }}>
                                {['00','05','10','15','20','25','30','35','40','45','50','55'].map(num => <option key={num} value={num}>{num}</option>)}
                              </select>
                              <select name="scheduleAmPm" defaultValue={ampm} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', flex: 1 }}>
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </>
                          );
                        })()}
                      </div>
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
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Class Image URL (Optional)</label>
                      <input name="imageUrl" type="url" placeholder="https://..." defaultValue={editingClass?.imageUrl ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description</label>
                      <textarea name="description" rows={3} defaultValue={editingClass?.description} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
                    </div>
                  </div>
                )}

                {/* Add / Edit Pass */}
                {(modalType === 'addPass' || modalType === 'editPass') && (
                  <div className={styles.formRow}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pass Name *</label>
                      <input name="name" required defaultValue={editingPassOption?.name ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Price (USD) *</label>
                      <input name="priceUsd" type="number" min="0" step="0.01" required defaultValue={editingPassOption?.priceUsd ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Classes</label>
                      <input name="totalClasses" type="number" min="1" placeholder="Unlimited" defaultValue={editingPassOption?.totalClasses ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Validity (days)</label>
                      <input name="validityDays" type="number" min="1" placeholder="No expiry" defaultValue={editingPassOption?.validityDays ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    {modalType === 'editPass' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status *</label>
                        <select name="isActive" defaultValue={String(editingPassOption?.isActive ?? true)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}>
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description</label>
                      <textarea name="description" rows={3} defaultValue={editingPassOption?.description ?? ''} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
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
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Instructor Photo URL</label>
                      <input name="photoUrl" type="url" placeholder="https://..." style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bio</label>
                      <textarea name="bio" rows={3} placeholder="Short introduction about this instructor..." style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
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
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Instructor Photo URL</label>
                      <input name="photoUrl" type="url" placeholder="https://..." defaultValue={editingInstructor?.photoUrl ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bio</label>
                      <textarea name="bio" rows={4} defaultValue={editingInstructor?.bio ?? ''} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
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
                      <textarea name="content" required rows={4} placeholder="Copy the Google Review text here..." style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }} />
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

      {modalType === 'confirmDiscard' && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h3>Discard Changes?</h3>
              <button onClick={closeModal}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <p>You have unsaved changes on the current page. Are you sure you want to discard them?</p>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={closeModal}>Keep Editing</button>
              <button type="button" className={styles.discardBtn} onClick={() => {
                if (pendingEditorPage) {
                  void executeLoadEditorPage(pendingEditorPage);
                  setPendingEditorPage(null);
                }
                closeModal();
              }}>Discard Changes</button>
            </div>
          </div>
        </div>
      )}

      {editorPreviewOpen && (
        <div className={styles.cmsPreviewOverlay} role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setEditorPreviewOpen(false);
        }}>
          <section className={styles.cmsPreviewModal} role="dialog" aria-modal="true" aria-labelledby="cms-preview-title">
            <header className={styles.cmsPreviewHeader}>
              <div>
                <span>Unsaved preview</span>
                <h2 id="cms-preview-title">{activeEditorPage}</h2>
              </div>
              <button type="button" className={styles.cmsPreviewClose} onClick={() => setEditorPreviewOpen(false)} aria-label="Close content preview">×</button>
            </header>
            <div className={styles.cmsPreviewBody}>
              {Object.entries(editorContent).map(([field, value]) => {
                const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
                const isImageUrl = /imageUrl$/i.test(field) && /^https:\/\//.test(value);
                return (
                  <article className={styles.cmsPreviewSection} key={field}>
                    <div className={styles.cmsPreviewLabel}>{label}</div>
                    {isImageUrl ? (
                      <div className={styles.cmsPreviewImage} role="img" aria-label={`${label} preview`} style={{ backgroundImage: `url("${value.replaceAll('"', '%22')}")` }} />
                    ) : (
                      <p>{value}</p>
                    )}
                  </article>
                );
              })}
            </div>
            <footer className={styles.cmsPreviewFooter}>
              <span>This preview is private until you save the changes.</span>
              <button type="button" className={styles.btnPrimary} onClick={() => setEditorPreviewOpen(false)}>Continue Editing</button>
            </footer>
          </section>
        </div>
      )}

      {/* Toast Notification */}
      <div
        className={`${styles.toast} ${toastMessage ? styles.toastVisible : ''} ${toastIsError ? styles.toastError : ''}`}
        role={toastIsError ? 'alert' : 'status'}
        aria-live={toastIsError ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
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
