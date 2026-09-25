'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  ClipboardList,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  Bell,
  UserCog,
  LogOut,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  Plus,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  RefreshCw,
  UserCheck,
  Flag,
  BookOpen,
  School,
  Award,
  Sparkles,
  Menu as MenuIcon,
  Info,
  CalendarDays,
  Activity,
  ArrowUpRight,
  AlertCircle,
  HelpCircle,
  Lock,
  Phone,
  MapPin,
  Mail,
  User,
  HeartHandshake,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: string;
  email: string;
  nip?: string | null;
}

interface HomeroomViewProps {
  user: CurrentUser;
}

export default function HomeroomView({ user }: HomeroomViewProps) {
  // Navigation State (11 Menus)
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Month & Year Filter State (Default current month & year)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Class Selection (If teacher has multiple or switching)
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [homeroomClass, setHomeroomClass] = useState<any>(null);
  const [hasHomeroomClass, setHasHomeroomClass] = useState<boolean>(true);

  // 1. Dashboard State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // 2. Students State
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGenderFilter, setStudentGenderFilter] = useState('all');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [detailStudentLoading, setDetailStudentLoading] = useState(false);

  // 3. Attendance State
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // 4. Violations State
  const [violationsData, setViolationsData] = useState<any[]>([]);
  const [violationsCounts, setViolationsCounts] = useState<Record<string, number>>({});
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [violationsError, setViolationsError] = useState<string | null>(null);
  const [violationSearch, setViolationSearch] = useState('');
  const [violationStatusFilter, setViolationStatusFilter] = useState('all');
  const [violationCategoryFilter, setViolationCategoryFilter] = useState('all');
  const [selectedViolationDetail, setSelectedViolationDetail] = useState<any>(null);

  // Add Violation Modal
  const [showAddViolationModal, setShowAddViolationModal] = useState(false);
  const [newViolationStudentId, setNewViolationStudentId] = useState('');
  const [newViolationType, setNewViolationType] = useState('Kedisiplinan');
  const [newViolationDescription, setNewViolationDescription] = useState('');
  const [newViolationLocation, setNewViolationLocation] = useState('Lingkungan Sekolah');
  const [newViolationDate, setNewViolationDate] = useState(new Date().toISOString().split('T')[0]);
  const [newViolationPoints, setNewViolationPoints] = useState(5);
  const [newViolationSubmitting, setNewViolationSubmitting] = useState(false);

  // 5. Follow Ups State
  const [followUpsData, setFollowUpsData] = useState<any[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);
  const [followUpSearch, setFollowUpSearch] = useState('');

  // 6. Guidance & Watchlist State (from statistics API)
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  // 7. Activities State
  const [activitiesData, setActivitiesData] = useState<any>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // 9. Notifications State
  const [notificationsData, setNotificationsData] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // 10. Account Settings State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Helper to append class_id param if selected
  const appendClassParam = (url: string) => {
    if (selectedClassId) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}class_id=${encodeURIComponent(selectedClassId)}`;
    }
    return url;
  };

  // ==========================================
  // FETCHERS
  // ==========================================

  // 1. Fetch Dashboard
  const fetchDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const url = appendClassParam(`/api/homeroom/dashboard?year=${selectedYear}&month=${selectedMonth}`);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data dashboard.');

      setHasHomeroomClass(data.hasHomeroomClass);
      if (data.hasHomeroomClass) {
        setHomeroomClass(data.homeroomClass);
        setAssignedClasses(data.assignedClasses || [data.homeroomClass]);
        if (!selectedClassId && data.homeroomClass?.id) {
          setSelectedClassId(data.homeroomClass.id);
        }
      }
      setDashboardData(data);
    } catch (err: any) {
      setDashboardError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setDashboardLoading(false);
    }
  };

  // 2. Fetch Students
  const fetchStudents = async () => {
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const params = new URLSearchParams();
      if (studentSearch) params.append('q', studentSearch);
      if (studentGenderFilter !== 'all') params.append('gender', studentGenderFilter);
      if (selectedClassId) params.append('class_id', selectedClassId);

      const res = await fetch(`/api/homeroom/students?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data siswa.');

      setHasHomeroomClass(data.hasHomeroomClass);
      if (data.hasHomeroomClass && data.homeroomClass) {
        setHomeroomClass(data.homeroomClass);
      }
      setStudentsData(data.students || []);
    } catch (err: any) {
      setStudentsError(err.message || 'Gagal memuat data siswa.');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch Student Detail
  const fetchStudentDetail = async (studentId: string) => {
    setDetailStudentLoading(true);
    try {
      const res = await fetch(`/api/homeroom/students/${studentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat rincian siswa.');
      setSelectedStudentDetail(data);
    } catch (err: any) {
      alert(err.message || 'Gagal membuka detail siswa.');
    } finally {
      setDetailStudentLoading(false);
    }
  };

  // 3. Fetch Attendance
  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const url = appendClassParam(`/api/homeroom/attendance?year=${selectedYear}&month=${selectedMonth}`);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat rekap absensi.');

      setHasHomeroomClass(data.hasHomeroomClass);
      if (data.hasHomeroomClass && data.homeroomClass) {
        setHomeroomClass(data.homeroomClass);
      }
      setAttendanceData(data);
    } catch (err: any) {
      setAttendanceError(err.message || 'Gagal mengambil rekap kehadiran.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // 4. Fetch Violations
  const fetchViolations = async () => {
    setViolationsLoading(true);
    setViolationsError(null);
    try {
      const params = new URLSearchParams();
      if (violationSearch) params.append('q', violationSearch);
      if (violationStatusFilter !== 'all') params.append('status', violationStatusFilter);
      if (violationCategoryFilter !== 'all') params.append('category', violationCategoryFilter);
      if (selectedClassId) params.append('class_id', selectedClassId);

      const res = await fetch(`/api/homeroom/violations?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data pelanggaran.');

      setHasHomeroomClass(data.hasHomeroomClass);
      if (data.hasHomeroomClass && data.homeroomClass) {
        setHomeroomClass(data.homeroomClass);
      }
      setViolationsData(data.violations || []);
      setViolationsCounts(data.countsByStatus || {});
    } catch (err: any) {
      setViolationsError(err.message || 'Gagal mengambil data catatan disiplin.');
    } finally {
      setViolationsLoading(false);
    }
  };

  // Submit New Violation
  const handleAddViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViolationStudentId || !newViolationDescription.trim()) {
      alert('Pilih siswa dan isi deskripsi pelanggaran.');
      return;
    }
    setNewViolationSubmitting(true);
    try {
      const res = await fetch(appendClassParam('/api/homeroom/violations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: newViolationStudentId,
          violation_type: newViolationType,
          description: newViolationDescription,
          location: newViolationLocation,
          date: newViolationDate,
          penalty_points: newViolationPoints,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat pelanggaran.');

      alert(data.message || 'Pelanggaran berhasil dicatat.');
      setShowAddViolationModal(false);
      setNewViolationStudentId('');
      setNewViolationDescription('');
      setNewViolationLocation('Lingkungan Sekolah');
      setNewViolationPoints(5);
      fetchViolations();
      if (activeMenu === 'dashboard') fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setNewViolationSubmitting(false);
    }
  };

  // 5. Fetch Follow Ups
  const fetchFollowUps = async () => {
    setFollowUpsLoading(true);
    setFollowUpsError(null);
    try {
      const params = new URLSearchParams();
      if (followUpSearch) params.append('q', followUpSearch);
      if (selectedClassId) params.append('class_id', selectedClassId);

      const res = await fetch(`/api/homeroom/follow-ups?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat tindak lanjut.');

      setHasHomeroomClass(data.hasHomeroomClass);
      if (data.hasHomeroomClass && data.homeroomClass) {
        setHomeroomClass(data.homeroomClass);
      }
      setFollowUpsData(data.followUps || []);
    } catch (err: any) {
      setFollowUpsError(err.message || 'Gagal mengambil catatan tindak lanjut.');
    } finally {
      setFollowUpsLoading(false);
    }
  };

  // 6. Fetch Statistics & Watchlist (Guidance)
  const fetchStatistics = async () => {
    setStatisticsLoading(true);
    setStatisticsError(null);
    try {
      const url = appendClassParam('/api/homeroom/statistics');
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat statistik kelas.');

      setHasHomeroomClass(data.hasHomeroomClass);
      if (data.hasHomeroomClass && data.homeroomClass) {
        setHomeroomClass(data.homeroomClass);
      }
      setStatisticsData(data);
    } catch (err: any) {
      setStatisticsError(err.message || 'Gagal mengambil analisis kelas.');
    } finally {
      setStatisticsLoading(false);
    }
  };

  // 7. Fetch Activities
  const fetchActivities = async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const url = appendClassParam('/api/homeroom/activities');
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat kegiatan kelas.');

      setHasHomeroomClass(data.hasHomeroomClass);
      if (data.hasHomeroomClass && data.homeroomClass) {
        setHomeroomClass(data.homeroomClass);
      }
      setActivitiesData(data);
    } catch (err: any) {
      setActivitiesError(err.message || 'Gagal mengambil agenda kegiatan.');
    } finally {
      setActivitiesLoading(false);
    }
  };

  // 9. Fetch Notifications
  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const url = appendClassParam('/api/homeroom/notifications');
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat notifikasi.');

      setHasHomeroomClass(data.hasHomeroomClass);
      if (data.hasHomeroomClass && data.homeroomClass) {
        setHomeroomClass(data.homeroomClass);
      }
      setNotificationsData(data.notifications || []);
    } catch (err: any) {
      setNotificationsError(err.message || 'Gagal mengambil notifikasi.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah kata sandi');
      setPasswordSuccess('Kata sandi berhasil diperbarui.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari Portal Wali Kelas?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  };

  // Tab Switching Effects
  useEffect(() => {
    if (activeMenu === 'dashboard') {
      fetchDashboard();
    } else if (activeMenu === 'students') {
      fetchStudents();
    } else if (activeMenu === 'attendance') {
      fetchAttendance();
    } else if (activeMenu === 'violations') {
      fetchViolations();
      // Ensure students list is loaded for add modal
      if (studentsData.length === 0) fetchStudents();
    } else if (activeMenu === 'follow_ups') {
      fetchFollowUps();
    } else if (activeMenu === 'guidance') {
      fetchStatistics();
    } else if (activeMenu === 'activities') {
      fetchActivities();
    } else if (activeMenu === 'recap') {
      fetchDashboard();
      fetchAttendance();
      fetchStatistics();
    } else if (activeMenu === 'notifications') {
      fetchNotifications();
    }
  }, [activeMenu, selectedYear, selectedMonth, selectedClassId]);

  // Menu Definition (Exactly 11 Menus)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: School },
    { id: 'students', label: 'Siswa Saya', icon: Users },
    { id: 'attendance', label: 'Absensi Kelas', icon: CalendarDays },
    { id: 'violations', label: 'Pelanggaran Siswa', icon: ShieldAlert },
    { id: 'follow_ups', label: 'Tindak Lanjut', icon: Clock },
    { id: 'guidance', label: 'Pembinaan Siswa', icon: UserCheck },
    { id: 'activities', label: 'Kegiatan Kelas', icon: Award },
    { id: 'recap', label: 'Rekap Kelas', icon: FileText },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'account', label: 'Pengaturan Akun', icon: UserCog },
    { id: 'logout', label: 'Logout', icon: LogOut, isDanger: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 antialiased">
      {/* ==================================================== */}
      {/* SIDEBAR NAVIGATION (PRINT:HIDDEN) */}
      {/* ==================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 md:static md:translate-x-0 print:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-900/40">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-indigo-400">
                Wali Kelas
              </div>
              <h1 className="text-sm font-black text-white tracking-tight">
                SMAN 18 BOMBANA
              </h1>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Classroom Identity Quick Card in Sidebar */}
        <div className="p-4 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            Rombel Binaan
          </div>
          {homeroomClass ? (
            <div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Kelas {homeroomClass.name}</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {homeroomClass.academic_year || '2024/2025'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {user.name}
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-300 font-medium">
              Belum ada rombel ditugaskan
            </div>
          )}
        </div>

        {/* Navigation Items (11 Menus) */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            const isDanger = item.isDanger;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'logout') {
                    handleLogout();
                  } else {
                    setActiveMenu(item.id);
                    setMobileSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isDanger
                    ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                    : isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </button>
            );
          })}
        </nav>

        {/* User Card in Bottom Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {user.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {user.nip || user.username}
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ==================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ==================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar Header (PRINT:HIDDEN) */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden transition"
              aria-label="Buka Menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span>SMAN 18 Bombana</span>
                <span>/</span>
                <span className="font-semibold text-slate-700">Wali Kelas</span>
                {homeroomClass && (
                  <>
                    <span>/</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
                      Kelas {homeroomClass.name}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 capitalize tracking-tight">
                {menuItems.find((m) => m.id === activeMenu)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Periode Selector (Month & Year) */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden"
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell Shortcut */}
            <button
              onClick={() => setActiveMenu('notifications')}
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 transition relative"
              title="Notifikasi Kelas"
            >
              <Bell className="w-4 h-4" />
              {notificationsData.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-400/20" />
              )}
            </button>
          </div>
        </header>

        {/* Content Body Container */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* ==================================================== */}
          {/* PERSONAL CLASSROOM BANNER IDENTITY */}
          {/* ==================================================== */}
          {hasHomeroomClass && homeroomClass ? (
            <div className="mb-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/40 relative overflow-hidden print:hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-indigo-200 border border-white/15">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Portal Monitoring Rombongan Belajar</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    <span>Kelas {homeroomClass.name}</span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/60 border border-indigo-400/40 text-indigo-100 font-bold uppercase">
                      Tingkat {homeroomClass.grade}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-200/90 font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Tahun Ajaran: <strong className="text-white">{homeroomClass.academic_year || '2024/2025'}</strong></span>
                    <span>•</span>
                    <span>Wali Kelas: <strong className="text-white">{user.name}</strong></span>
                    {user.nip && (
                      <>
                        <span>•</span>
                        <span>NIP: <strong className="text-white">{user.nip}</strong></span>
                      </>
                    )}
                  </p>
                </div>

                {/* Multiple Classes Switcher (if assigned > 1) */}
                {assignedClasses.length > 1 && (
                  <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-200">Ganti Kelas Binaan:</span>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-400/40 focus:outline-hidden"
                    >
                      {assignedClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          Kelas {c.name} ({c.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* EMPTY STATE: USER BELUM MEMILIKI KELAS WALI KELAS */
            <div className="mb-6 p-6 sm:p-8 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 shadow-sm print:hidden">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-amber-900">
                    Belum ditugaskan sebagai wali kelas.
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Saat ini akun Anda belum terhubung dengan rombongan belajar (rombel) aktif di sistem. Silakan berkoordinasi dengan Wakil Kepala Sekolah Bidang Kurikulum atau Administrator Sekolah untuk menetapkan kelas binaan Anda.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={fetchDashboard}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Periksa Ulang Penugasan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 1: DASHBOARD */}
          {/* ==================================================== */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6">
              {dashboardLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  <p className="text-xs font-semibold">Memuat data dashboard kelas...</p>
                </div>
              ) : dashboardError ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
                  {dashboardError}
                </div>
              ) : (
                <>
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {/* 1. Total Siswa */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Siswa</span>
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-800">
                          {dashboardData?.stats?.totalStudents || 0}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Siswa Aktif di Rombel
                        </div>
                      </div>
                    </div>

                    {/* 2. Laki-Laki */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Laki-Laki</span>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-800">
                          {dashboardData?.stats?.totalMale || 0}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Siswa Putra
                        </div>
                      </div>
                    </div>

                    {/* 3. Perempuan */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Perempuan</span>
                        <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-800">
                          {dashboardData?.stats?.totalFemale || 0}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Siswa Putri
                        </div>
                      </div>
                    </div>

                    {/* 4. Kehadiran Bulan Ini */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Kehadiran</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-emerald-600">
                          {dashboardData?.stats?.attendanceSummary?.percentage || 0}%
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {dashboardData?.stats?.attendanceSummary?.hadir || 0} Kehadiran (H)
                        </div>
                      </div>
                    </div>

                    {/* 5. Kasus Aktif */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Kasus Aktif</span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-amber-600">
                          {dashboardData?.stats?.activeViolationsCount || 0}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Perlu Penanganan
                        </div>
                      </div>
                    </div>

                    {/* 6. Butuh Perhatian */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Perhatian</span>
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-rose-600">
                          {dashboardData?.stats?.studentsNeedingAttentionCount || 0}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Alpa / Poin Tinggi
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Watchlist & Recent Disciplinary Cases */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Watchlist / Siswa Butuh Perhatian (2 Cols) */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Watchlist Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-500" />
                              <span>Siswa Memerlukan Perhatian Khusus</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Siswa dengan akumulasi alpa, sakit berulang, atau catatan kedisiplinan aktif
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveMenu('guidance')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <span>Lihat Semua</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {dashboardData?.studentsNeedingAttention?.length > 0 ? (
                          <div className="divide-y divide-slate-100">
                            {dashboardData.studentsNeedingAttention.map((s: any) => (
                              <div
                                key={s.id}
                                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center border border-rose-200">
                                    {s.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 truncate">
                                      {s.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      NIS: {s.nis || '-'} • {s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  {s.reasons?.map((reason: string, rIdx: number) => (
                                    <span
                                      key={rIdx}
                                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
                                    >
                                      {reason}
                                    </span>
                                  ))}
                                  <button
                                    onClick={() => fetchStudentDetail(s.id)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Lihat Detail Siswa"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-400">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-xs font-medium text-slate-600">
                              Alhamdulillah, seluruh siswa kelas ini dalam kondisi tertib dan berdisiplin baik.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Recent Violations in Homeroom Class */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-indigo-600" />
                              <span>Catatan Pelanggaran & Kedisiplinan Terkini</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Laporan kedisiplinan siswa di kelas Anda
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveMenu('violations')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <span>Kelola</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {dashboardData?.recentViolations?.length > 0 ? (
                          <div className="space-y-3">
                            {dashboardData.recentViolations.map((v: any) => (
                              <div
                                key={v.id}
                                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800">
                                      {v.student?.name}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      {v.violation_type}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        v.status === 'Selesai'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : v.status === 'Dalam Penanganan'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}
                                    >
                                      {v.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 line-clamp-1">
                                    {v.description}
                                  </p>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                                    <span>
                                      {new Date(v.date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    <span>•</span>
                                    <span>Pelapor: {v.reporter?.name || 'Petugas'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <button
                                    onClick={() => setSelectedViolationDetail(v)}
                                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs"
                                  >
                                    Detail Kasus
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            Belum ada catatan pelanggaran yang dilaporkan pada kelas ini.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Class Attendance Breakdown & Announcements */}
                    <div className="space-y-6">
                      {/* Attendance Breakdown Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-indigo-600" />
                          <span>Ringkasan Kehadiran Rombel</span>
                        </h3>
                        <div className="text-xs text-slate-500 mb-4">
                          Periode: <strong>{monthNames[selectedMonth - 1]} {selectedYear}</strong>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-emerald-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Hadir (H)
                              </span>
                              <span className="font-bold text-slate-800">
                                {dashboardData?.stats?.attendanceSummary?.hadir || 0}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{
                                  width: `${
                                    dashboardData?.stats?.attendanceSummary?.percentage || 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                              <div className="text-[10px] font-bold text-blue-600 uppercase">Sakit</div>
                              <div className="text-base font-extrabold text-blue-900 mt-0.5">
                                {dashboardData?.stats?.attendanceSummary?.sakit || 0}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                              <div className="text-[10px] font-bold text-amber-600 uppercase">Izin</div>
                              <div className="text-base font-extrabold text-amber-900 mt-0.5">
                                {dashboardData?.stats?.attendanceSummary?.izin || 0}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-center">
                              <div className="text-[10px] font-bold text-rose-600 uppercase">Alpa</div>
                              <div className="text-base font-extrabold text-rose-900 mt-0.5">
                                {dashboardData?.stats?.attendanceSummary?.alpa || 0}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => setActiveMenu('attendance')}
                              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition text-center"
                            >
                              Buka Absensi Kelas Lengkap
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* School Agenda & Announcements */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>Pengumuman & Agenda Sekolah</span>
                        </h3>

                        {dashboardData?.announcements?.length > 0 ? (
                          <div className="space-y-3">
                            {dashboardData.announcements.slice(0, 4).map((a: any) => (
                              <div
                                key={a.id}
                                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1"
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span className="font-bold text-indigo-600 uppercase">
                                    {a.category}
                                  </span>
                                  <span>
                                    {new Date(a.published_at || a.created_at).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                                  {a.title}
                                </h4>
                                <p className="text-[11px] text-slate-600 line-clamp-2">
                                  {a.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-4">
                            Belum ada pengumuman baru dari sekolah.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: SISWA SAYA */}
          {/* ==================================================== */}
          {activeMenu === 'students' && (
            <div className="space-y-6">
              {/* Filter & Search Header */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama, NIS, atau NISN siswa..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:outline-indigo-500"
                    >
                    </input>
                  </div>

                  {/* Gender Filter */}
                  <select
                    value={studentGenderFilter}
                    onChange={(e) => setStudentGenderFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-indigo-500"
                  >
                    <option value="all">Semua Jenis Kelamin</option>
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>

                  <button
                    onClick={fetchStudents}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Terapkan
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-semibold self-end sm:self-center">
                  Total: <strong className="text-indigo-600">{studentsData.length} Siswa</strong>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {studentsLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                    <p className="text-xs font-semibold">Memuat daftar siswa kelas...</p>
                  </div>
                ) : studentsError ? (
                  <div className="p-6 text-center text-red-600 text-xs">
                    {studentsError}
                  </div>
                ) : studentsData.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Tidak ditemukan data siswa pada kelas ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">No</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">NIS / NISN</th>
                          <th className="py-3 px-4 text-center">L/P</th>
                          <th className="py-3 px-4">Kontak Orang Tua</th>
                          <th className="py-3 px-4 text-center">Kehadiran (H/S/I/A)</th>
                          <th className="py-3 px-4 text-center">Pelanggaran</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {studentsData.map((s, idx) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-slate-800">
                                {s.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {s.email || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">
                              <div>NIS: {s.nis || '-'}</div>
                              <div className="text-slate-400">NISN: {s.nisn || '-'}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  s.gender === 'L'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-pink-50 text-pink-700 border border-pink-200'
                                }`}
                              >
                                {s.gender || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-slate-600 font-medium">
                                {s.parent_phone || s.phone || '-'}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                {s.address || 'Alamat belum diisi'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              <span className="text-emerald-700 font-bold">{s.attendanceSummary?.hadir || 0}H</span>{' '}
                              <span className="text-blue-600 font-medium">{s.attendanceSummary?.sakit || 0}S</span>{' '}
                              <span className="text-amber-600 font-medium">{s.attendanceSummary?.izin || 0}I</span>{' '}
                              <span className="text-rose-600 font-bold">{s.attendanceSummary?.alpa || 0}A</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {s.violationsCount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                                  {s.violationsCount} Kasus
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => fetchStudentDetail(s.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: ABSENSI KELAS */}
          {/* ==================================================== */}
          {activeMenu === 'attendance' && (
            <div className="space-y-6">
              {/* Filter Controls & Summary Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                    <span>Rekapitulasi Presensi Bulanan Kelas</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data akumulasi kehadiran resmi siswa pada rombongan belajar Anda
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
                    <span>Bulan:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="bg-transparent focus:outline-hidden"
                    >
                      {monthNames.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="bg-transparent focus:outline-hidden"
                    >
                      {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={fetchAttendance}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="Segarkan Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Attendance Summary Metric Cards */}
              {attendanceData?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-emerald-950">
                    <div className="text-[11px] font-bold uppercase text-emerald-700">Rata-Rata Kehadiran</div>
                    <div className="text-2xl font-black mt-1">
                      {attendanceData.summary.averageAttendanceRate || 0}%
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Total Hadir (H)</div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {attendanceData.summary.totalH || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="text-[11px] font-bold uppercase text-blue-600">Total Sakit (S)</div>
                    <div className="text-2xl font-black text-blue-900 mt-1">
                      {attendanceData.summary.totalS || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="text-[11px] font-bold uppercase text-amber-600">Total Izin (I)</div>
                    <div className="text-2xl font-black text-amber-900 mt-1">
                      {attendanceData.summary.totalI || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="text-[11px] font-bold uppercase text-rose-600">Total Alpa (A)</div>
                    <div className="text-2xl font-black text-rose-900 mt-1">
                      {attendanceData.summary.totalA || 0}
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Per Student Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {attendanceLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                    <p className="text-xs font-semibold">Memuat rekap absensi kelas...</p>
                  </div>
                ) : attendanceError ? (
                  <div className="p-6 text-center text-red-600 text-xs">
                    {attendanceError}
                  </div>
                ) : attendanceData?.attendanceList?.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Belum ada data presensi yang tercatat untuk periode ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">No</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">NIS</th>
                          <th className="py-3 px-4 text-center">L/P</th>
                          <th className="py-3 px-4 text-center text-emerald-700 bg-emerald-50/40">Hadir (H)</th>
                          <th className="py-3 px-4 text-center text-blue-700 bg-blue-50/40">Sakit (S)</th>
                          <th className="py-3 px-4 text-center text-amber-700 bg-amber-50/40">Izin (I)</th>
                          <th className="py-3 px-4 text-center text-rose-700 bg-rose-50/40">Alpa (A)</th>
                          <th className="py-3 px-4 text-center">Total</th>
                          <th className="py-3 px-4 text-center">% Kehadiran</th>
                          <th className="py-3 px-4">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {attendanceData?.attendanceList?.map((s: any, idx: number) => (
                          <tr key={s.studentId} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 font-extrabold text-slate-800">
                              {s.name}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {s.nis || '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              {s.gender || '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 bg-emerald-50/20">
                              {s.present}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-medium text-blue-700 bg-blue-50/20">
                              {s.sick}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-medium text-amber-700 bg-amber-50/20">
                              {s.permission}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/20">
                              {s.unexcused}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                              {s.total}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                                  s.percentage >= 90
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : s.percentage >= 75
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {s.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate">
                              {s.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: PELANGGARAN SISWA */}
          {/* ==================================================== */}
          {activeMenu === 'violations' && (
            <div className="space-y-6">
              {/* Header Action & Stats */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    <span>Monitoring Kedisiplinan & Tata Tertib Rombel</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pencatatan kasus tata tertib dan riwayat pembinaan kedisiplinan
                  </p>
                </div>

                <button
                  onClick={() => setShowAddViolationModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Pelanggaran</span>
                </button>
              </div>

              {/* Status Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Total Laporan</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {violationsData.length}
                  </div>
                </div>
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                  <div className="text-[11px] font-bold uppercase text-amber-700">Dilaporkan</div>
                  <div className="text-2xl font-black text-amber-900 mt-1">
                    {violationsCounts['Dilaporkan'] || 0}
                  </div>
                </div>
                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                  <div className="text-[11px] font-bold uppercase text-blue-700">Dalam Penanganan</div>
                  <div className="text-2xl font-black text-blue-900 mt-1">
                    {violationsCounts['Dalam Penanganan'] || 0}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                  <div className="text-[11px] font-bold uppercase text-emerald-700">Selesai</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">
                    {violationsCounts['Selesai'] || 0}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa atau jenis pelanggaran..."
                    value={violationSearch}
                    onChange={(e) => setViolationSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchViolations()}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:outline-indigo-500"
                  />
                </div>

                <select
                  value={violationStatusFilter}
                  onChange={(e) => setViolationStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
                >
                  <option value="all">Semua Status</option>
                  <option value="Dilaporkan">Dilaporkan</option>
                  <option value="Dalam Penanganan">Dalam Penanganan</option>
                  <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                  <option value="Selesai">Selesai</option>
                </select>

                <button
                  onClick={fetchViolations}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                </button>
              </div>

              {/* Violations Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {violationsLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                    <p className="text-xs font-semibold">Memuat catatan pelanggaran...</p>
                  </div>
                ) : violationsError ? (
                  <div className="p-6 text-center text-red-600 text-xs">
                    {violationsError}
                  </div>
                ) : violationsData.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Tidak ada catatan pelanggaran yang sesuai filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Kategori & Kejadian</th>
                          <th className="py-3 px-4 text-center">Poin</th>
                          <th className="py-3 px-4">Pelapor</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {violationsData.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(v.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-slate-800">
                                {v.student?.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                NIS: {v.student?.nis || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-indigo-700">
                                {v.violation_type}
                              </div>
                              <div className="text-slate-600 text-[11px] line-clamp-1">
                                {v.description}
                              </div>
                              {v.location && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  <span>{v.location}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                              {v.penalty_points || 5}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{v.reporter?.name || 'Petugas'}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  v.status === 'Selesai'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : v.status === 'Dalam Penanganan'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {v.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setSelectedViolationDetail(v)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
                              >
                                Rincian
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: TINDAK LANJUT */}
          {/* ==================================================== */}
          {activeMenu === 'follow_ups' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Rekam Jejak Tindak Lanjut Penanganan Kasus</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Riwayat pembinaan dan tindakan nyata terhadap pelanggaran siswa rombel
                  </p>
                </div>

                <div className="text-xs font-semibold text-slate-600">
                  Total Tindakan: <strong className="text-indigo-600">{followUpsData.length}</strong>
                </div>
              </div>

              {/* Follow Ups Timeline / Cards */}
              {followUpsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  <p className="text-xs font-semibold">Memuat rekap tindak lanjut...</p>
                </div>
              ) : followUpsError ? (
                <div className="p-6 bg-red-50 text-red-600 rounded-xl text-xs">
                  {followUpsError}
                </div>
              ) : followUpsData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                  Belum ada catatan tindak lanjut penanganan untuk siswa di kelas ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {followUpsData.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {f.violation?.student?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 text-xs sm:text-sm">
                              {f.violation?.student?.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Kasus: {f.violation?.violation_type} • Status Kasus: <strong className="text-indigo-600">{f.violation?.status}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-400">
                          {new Date(f.action_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-xs font-extrabold text-slate-700">
                          Tindakan Pembinaan yang Dilakukan:
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed">
                          {f.action_taken}
                        </div>
                      </div>

                      {f.notes && (
                        <div className="text-xs text-slate-600">
                          <strong>Catatan Khusus:</strong> {f.notes}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                        <span>Penanggung Jawab / Petugas: <strong>{f.handler?.name || 'Wali Kelas / BK'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: PEMBINAAN SISWA */}
          {/* ==================================================== */}
          {activeMenu === 'guidance' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Pusat Pembinaan Karakter & Pendampingan Siswa Binaan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identifikasi proaktif siswa yang membutuhkan bimbingan intensif wali kelas
                </p>
              </div>

              {statisticsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  <p className="text-xs font-semibold">Memuat data pembinaan siswa...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Guidance Watchlist Cards */}
                  {statisticsData?.watchlist?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {statisticsData.watchlist.map((st: any) => (
                        <div
                          key={st.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-200">
                                  {st.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800">
                                    {st.name}
                                  </h4>
                                  <div className="text-xs text-slate-500">
                                    NIS: {st.nis || '-'} • {st.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => fetchStudentDetail(st.id)}
                                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                title="Buka Detail Siswa"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Attention Reasons / Badges */}
                            <div className="flex flex-wrap gap-1.5">
                              {st.reasons?.map((r: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>

                            {/* Summary Metrics */}
                            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Alpa (A)</div>
                                <div className="text-base font-extrabold text-rose-600 mt-0.5">{st.unexcused}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Sakit (S)</div>
                                <div className="text-base font-extrabold text-blue-600 mt-0.5">{st.sick}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Poin Disiplin</div>
                                <div className="text-base font-extrabold text-slate-800 mt-0.5">{st.activePoints}</div>
                              </div>
                            </div>
                          </div>

                          {/* Recommended Actions for Homeroom Teacher */}
                          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                            <div className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                              <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Rekomendasi Tindak Lanjut Wali Kelas:</span>
                            </div>
                            <ul className="text-[11px] text-indigo-950/80 list-disc list-inside space-y-0.5">
                              {st.unexcused >= 2 && (
                                <li>Lakukan pemanggilan orang tua/wali siswa terkait ketidakhadiran tanpa keterangan.</li>
                              )}
                              {st.activePoints >= 10 && (
                                <li>Koordinasikan kasus tata tertib ini bersama Guru BK dan Waka Kesiswaan.</li>
                              )}
                              {st.sick >= 3 && (
                                <li>Konfirmasi kondisi kesehatan siswa dengan wali murid untuk kepastian medis.</li>
                              )}
                              <li>Berikan sesi pembimbingan personal dari hati ke hati untuk memotivasi belajar siswa.</li>
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">
                        Tidak ada siswa dalam daftar pembinaan khusus. Seluruh siswa kelas menunjukkan kedisiplinan dan absensi yang baik.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 7: KEGIATAN KELAS */}
          {/* ==================================================== */}
          {activeMenu === 'activities' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Agenda & Kegiatan Sekolah / Rombel</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kalender jadwal penting, agenda sekolah, dan kegiatan yang melibatkan siswa kelas
                </p>
              </div>

              {activitiesLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  <p className="text-xs font-semibold">Memuat agenda kegiatan...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Agendas */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Agenda Mendatang</span>
                    </h4>

                    {activitiesData?.agendas?.length > 0 ? (
                      <div className="space-y-3">
                        {activitiesData.agendas.map((ag: any) => (
                          <div
                            key={ag.id}
                            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-bold text-indigo-600 uppercase">
                                Agenda
                              </span>
                              <span>
                                {new Date(ag.published_at || ag.created_at).toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <h5 className="text-xs font-extrabold text-slate-800">
                              {ag.title}
                            </h5>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {ag.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                        Belum ada agenda kegiatan yang dijadwalkan.
                      </div>
                    )}
                  </div>

                  {/* School Announcements */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pengumuman Sekolah</span>
                    </h4>

                    {activitiesData?.schoolAnnouncements?.length > 0 ? (
                      <div className="space-y-3">
                        {activitiesData.schoolAnnouncements.map((an: any) => (
                          <div
                            key={an.id}
                            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-bold text-amber-600 uppercase">
                                {an.category}
                              </span>
                              <span>
                                {new Date(an.published_at || an.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <h5 className="text-xs font-extrabold text-slate-800">
                              {an.title}
                            </h5>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {an.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                        Tidak ada pengumuman umum.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 8: REKAP KELAS (DENGAN PRINT CETAK RESMI) */}
          {/* ==================================================== */}
          {activeMenu === 'recap' && (
            <div className="space-y-6">
              {/* Screen Top Header with Print Button (PRINT:HIDDEN) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Laporan Lengkap & Rekapitulasi Rombel</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Format resmi cetak laporan kondisi kelas untuk arsip dan pengesahan
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Unduh PDF (Print)</span>
                </button>
              </div>

              {/* PRINTABLE DOCUMENT CONTAINER */}
              <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-slate-900 print:p-0 print:border-none print:shadow-none print:m-0">
                {/* KOP SURAT RESMI SEKOLAH */}
                <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 text-center">
                  <div className="text-xs uppercase tracking-widest font-bold text-slate-700">
                    PEMERINTAH PROVINSI SULAWESI TENGGARA
                  </div>
                  <div className="text-xs uppercase tracking-widest font-bold text-slate-700">
                    DINAS PENDIDIKAN DAN KEBUDAYAAN
                  </div>
                  <div className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950 mt-1">
                    {dashboardData?.schoolProfile?.school_name || 'SMA NEGERI 18 BOMBANA'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    {dashboardData?.schoolProfile?.address || 'Jl. Poros Mata Osu - Bombana, Desa Wia wia, Kecamatan Matausu, Kabupaten Bombana, Sulawesi Tenggara 93772'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Website: {dashboardData?.schoolProfile?.website ? dashboardData.schoolProfile.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'sman18bombana.sch.id'} | Email: {dashboardData?.schoolProfile?.email || 'info@sman18bombana.sch.id'}
                  </div>
                </div>

                {/* LAPORAN TITLE */}
                <div className="text-center mb-6">
                  <h2 className="text-sm sm:text-base font-black uppercase underline tracking-wider">
                    REKAPITULASI LAPORAN KONDISI KELAS & KEDISIPLINAN
                  </h2>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    Periode: {monthNames[selectedMonth - 1]} {selectedYear}
                  </p>
                </div>

                {/* IDENTITAS ROMBEL */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:p-0 print:border-none">
                  <div>
                    <div className="flex">
                      <span className="w-28 font-bold">Rombongan Belajar</span>
                      <span>: Kelas {homeroomClass?.name || '-'}</span>
                    </div>
                    <div className="flex mt-1">
                      <span className="w-28 font-bold">Tingkat / Jenjang</span>
                      <span>: Kelas {homeroomClass?.grade || '-'}</span>
                    </div>
                    <div className="flex mt-1">
                      <span className="w-28 font-bold">Tahun Ajaran</span>
                      <span>: {homeroomClass?.academic_year || '2024/2025'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex">
                      <span className="w-28 font-bold">Wali Kelas</span>
                      <span>: {user.name}</span>
                    </div>
                    <div className="flex mt-1">
                      <span className="w-28 font-bold">NIP</span>
                      <span>: {user.nip || homeroomClass?.homeroom_teacher?.nip || '-'}</span>
                    </div>
                    <div className="flex mt-1">
                      <span className="w-28 font-bold">Total Siswa</span>
                      <span>
                        : {studentsData.length} Siswa ({statisticsData?.genderDistribution?.male || 0} L / {statisticsData?.genderDistribution?.female || 0} P)
                      </span>
                    </div>
                  </div>
                </div>

                {/* RINGKASAN KEHADIRAN KELAS */}
                <div className="mb-6">
                  <h4 className="text-xs font-black uppercase text-slate-800 mb-2">
                    I. Ringkasan Kehadiran Rombel Periode Ini
                  </h4>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 border border-slate-300 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-bold">Rata-Rata Kehadiran</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {attendanceData?.summary?.averageAttendanceRate || 100}%
                      </div>
                    </div>
                    <div className="p-2 border border-slate-300 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-bold">Hadir (H)</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {attendanceData?.summary?.totalH || 0}
                      </div>
                    </div>
                    <div className="p-2 border border-slate-300 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-bold">Sakit (S)</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {attendanceData?.summary?.totalS || 0}
                      </div>
                    </div>
                    <div className="p-2 border border-slate-300 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-bold">Izin (I)</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {attendanceData?.summary?.totalI || 0}
                      </div>
                    </div>
                    <div className="p-2 border border-slate-300 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-bold">Alpa (A)</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {attendanceData?.summary?.totalA || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABEL DATA & REKAP SELURUH SISWA */}
                <div className="mb-8">
                  <h4 className="text-xs font-black uppercase text-slate-800 mb-2">
                    II. Rekapitulasi Presensi & Tata Tertib Siswa
                  </h4>
                  <table className="w-full text-left text-[11px] border border-slate-400 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-400 text-center">
                        <th className="py-2 px-2 border-r border-slate-400 w-8">No</th>
                        <th className="py-2 px-3 border-r border-slate-400 text-left">Nama Siswa</th>
                        <th className="py-2 px-2 border-r border-slate-400">NIS/NISN</th>
                        <th className="py-2 px-2 border-r border-slate-400 w-10">L/P</th>
                        <th className="py-2 px-2 border-r border-slate-400 w-10">H</th>
                        <th className="py-2 px-2 border-r border-slate-400 w-10">S</th>
                        <th className="py-2 px-2 border-r border-slate-400 w-10">I</th>
                        <th className="py-2 px-2 border-r border-slate-400 w-10">A</th>
                        <th className="py-2 px-2 border-r border-slate-400 w-14">% Hadir</th>
                        <th className="py-2 px-2 border-r border-slate-400">Pelanggaran</th>
                        <th className="py-2 px-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {studentsData.map((s, idx) => (
                        <tr key={s.id} className="text-center">
                          <td className="py-1.5 px-2 border-r border-slate-400">{idx + 1}</td>
                          <td className="py-1.5 px-3 border-r border-slate-400 text-left font-bold">{s.name}</td>
                          <td className="py-1.5 px-2 border-r border-slate-400 font-mono text-[10px]">{s.nis || s.nisn || '-'}</td>
                          <td className="py-1.5 px-2 border-r border-slate-400">{s.gender || '-'}</td>
                          <td className="py-1.5 px-2 border-r border-slate-400">{s.attendanceSummary?.hadir || 0}</td>
                          <td className="py-1.5 px-2 border-r border-slate-400">{s.attendanceSummary?.sakit || 0}</td>
                          <td className="py-1.5 px-2 border-r border-slate-400">{s.attendanceSummary?.izin || 0}</td>
                          <td className="py-1.5 px-2 border-r border-slate-400 font-bold">{s.attendanceSummary?.alpa || 0}</td>
                          <td className="py-1.5 px-2 border-r border-slate-400 font-bold">
                            {s.attendanceSummary?.total > 0
                              ? `${Math.round(((s.attendanceSummary?.hadir || 0) / s.attendanceSummary.total) * 100)}%`
                              : '100%'}
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-400">
                            {s.violationsCount > 0 ? `${s.violationsCount} Kasus` : '-'}
                          </td>
                          <td className="py-1.5 px-2 text-[10px] text-slate-600">
                            {s.attendanceSummary?.alpa >= 2 ? 'Perlu Pembinaan' : 'Baik'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* LEMBAR PENGESAHAN TANDA TANGAN */}
                <div className="grid grid-cols-2 text-center text-xs mt-12 pt-6">
                  <div>
                    <div>Mengetahui,</div>
                    <div className="font-bold">{dashboardData?.principal?.position || 'Kepala SMAN 18 Bombana'}</div>
                    <div className="h-20" />
                    <div className="font-black underline uppercase">
                      {dashboardData?.principal?.name || 'Kepala Sekolah'}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {dashboardData?.principal?.nip || 'NIP. -'}
                    </div>
                  </div>
                  <div>
                    <div>Bombana, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="font-bold">Wali Kelas {homeroomClass?.name || ''}</div>
                    <div className="h-20" />
                    <div className="font-black underline uppercase">{user.name}</div>
                    <div className="text-[11px] text-slate-600">
                      {user.nip
                        ? (user.nip.startsWith('NIP') ? user.nip : `NIP. ${user.nip}`)
                        : (homeroomClass?.homeroom_teacher?.nip
                            ? (homeroomClass.homeroom_teacher.nip.startsWith('NIP')
                                ? homeroomClass.homeroom_teacher.nip
                                : `NIP. ${homeroomClass.homeroom_teacher.nip}`)
                            : 'NIP. -')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 9: NOTIFIKASI */}
          {/* ==================================================== */}
          {activeMenu === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span>Pusat Notifikasi & Peringatan Dini Kelas</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pemberitahuan mendesak seputar absensi siswa, kedisiplinan, dan pengumuman sekolah
                  </p>
                </div>
                <button
                  onClick={fetchNotifications}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Segarkan Notifikasi"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {notificationsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  <p className="text-xs font-semibold">Memuat notifikasi...</p>
                </div>
              ) : notificationsData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    Tidak ada notifikasi penting saat ini. Seluruh kondisi kelas terpantau aman dan tertib.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationsData.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition ${
                        notif.type === 'danger'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : notif.type === 'warning'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            notif.type === 'danger'
                              ? 'bg-rose-200 text-rose-700'
                              : notif.type === 'warning'
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold">
                            {notif.title}
                          </div>
                          <div className="text-xs opacity-90 mt-0.5 leading-relaxed">
                            {notif.message}
                          </div>
                          <div className="text-[10px] opacity-70 mt-1">
                            {new Date(notif.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      {notif.linkMenu && (
                        <button
                          onClick={() => setActiveMenu(notif.linkMenu)}
                          className="px-3 py-1.5 rounded-lg bg-white shadow-2xs border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shrink-0"
                        >
                          Periksa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 10: PENGATURAN AKUN */}
          {/* ==================================================== */}
          {activeMenu === 'account' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-indigo-600" />
                  <span>Informasi Akun & Keamanan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengaturan profil akun dan perubahan kata sandi login wali kelas
                </p>
              </div>

              {/* Profile Overview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Data Identitas Guru
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Nama Lengkap</span>
                    <span className="font-extrabold text-slate-800 text-sm">{user.name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">NIP</span>
                    <span className="font-extrabold text-slate-800 text-sm">{user.nip || 'Belum diatur'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Username</span>
                    <span className="font-mono font-bold text-slate-800">{user.username}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Email</span>
                    <span className="font-semibold text-slate-800">{user.email || '-'}</span>
                  </div>
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 sm:col-span-2">
                    <span className="text-indigo-600 block text-[10px] font-bold uppercase">Tugas Pokok</span>
                    <span className="font-extrabold text-indigo-950 text-sm">
                      Wali Kelas {homeroomClass ? `Kelas ${homeroomClass.name} (${homeroomClass.academic_year || '2024/2025'})` : 'Belum Ditugaskan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ubah Kata Sandi</span>
                </h4>

                {passwordError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      placeholder="Masukkan kata sandi lama Anda"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Kata Sandi Baru
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Ulangi kata sandi baru"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-xs"
                  >
                    {passwordLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: DETAIL SISWA (BIODATA, PRESENSI, DISIPLIN) */}
      {/* STRICT PRIVACY: TIDAK ADA DATA BIMBINGAN BK */}
      {/* ==================================================== */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
                  {selectedStudentDetail.student?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedStudentDetail.student?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    NIS: {selectedStudentDetail.student?.nis || '-'} • NISN: {selectedStudentDetail.student?.nisn || '-'} • Kelas {selectedStudentDetail.homeroomClass?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Biodata Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Biodata Siswa
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] font-bold block">Jenis Kelamin</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedStudentDetail.student?.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] font-bold block">Agama</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedStudentDetail.student?.religion || 'Islam'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] font-bold block">Kontak Siswa</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedStudentDetail.student?.phone || '-'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] font-bold block">Kontak Orang Tua / Wali</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedStudentDetail.student?.parent_phone || '-'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
                  <span className="text-slate-400 text-[10px] font-bold block">Alamat Domisili</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {selectedStudentDetail.student?.address || 'Belum diisi'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Recap */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Akumulasi Kehadiran
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Hadir</div>
                  <div className="text-lg font-black text-emerald-900 mt-0.5">
                    {selectedStudentDetail.attendanceTotals?.hadir || 0}
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">Sakit</div>
                  <div className="text-lg font-black text-blue-900 mt-0.5">
                    {selectedStudentDetail.attendanceTotals?.sakit || 0}
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Izin</div>
                  <div className="text-lg font-black text-amber-900 mt-0.5">
                    {selectedStudentDetail.attendanceTotals?.izin || 0}
                  </div>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Alpa</div>
                  <div className="text-lg font-black text-rose-900 mt-0.5">
                    {selectedStudentDetail.attendanceTotals?.alpa || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Violations History */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Riwayat Catatan Kedisiplinan
              </h4>
              {selectedStudentDetail.violations?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedStudentDetail.violations.map((vl: any) => (
                    <div
                      key={vl.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800">
                          {vl.violation_type} ({vl.penalty_points || 5} Poin)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(vl.date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <p className="text-slate-600">{vl.description}</p>
                      <div className="text-[10px] text-slate-400">
                        Status: <strong>{vl.status}</strong> • Pelapor: {vl.reporter?.name || 'Petugas'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Siswa ini tidak memiliki riwayat catatan pelanggaran disiplin.
                </div>
              )}
            </div>

            {/* PRIVACY POLICY GUARANTEE */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-[11px] text-indigo-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Jaminan Kerahasiaan BK:</strong> Sesuai kode etik konseling dan regulasi privasi sekolah, catatan konseling psikologis Guru BK bersifat rahasia dan tidak ditampilkan pada portal wali kelas.
              </span>
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: CATAT PELANGGARAN SISWA */}
      {/* ==================================================== */}
      {showAddViolationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Catat Pelanggaran Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  Rombel: Kelas {homeroomClass?.name}
                </p>
              </div>
              <button
                onClick={() => setShowAddViolationModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddViolation} className="space-y-4 text-xs">
              {/* Select Student */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Siswa <span className="text-red-500">*</span>
                </label>
                <select
                  value={newViolationStudentId}
                  onChange={(e) => setNewViolationStudentId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs"
                >
                  <option value="">-- Pilih Siswa Kelas {homeroomClass?.name} --</option>
                  {studentsData.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nis || 'Tanpa NIS'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Violation Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Pelanggaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newViolationType}
                    onChange={(e) => setNewViolationType(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs"
                  >
                    <option value="Kedisiplinan">Kedisiplinan</option>
                    <option value="Kerapian">Kerapian Seragam</option>
                    <option value="Keterlambatan">Keterlambatan</option>
                    <option value="Ketertiban">Ketertiban Kelas</option>
                    <option value="Akademik">Tugas & Akademik</option>
                    <option value="Pelanggaran Berat">Pelanggaran Berat</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Poin Penalti
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newViolationPoints}
                    onChange={(e) => setNewViolationPoints(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Date & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Kejadian
                  </label>
                  <input
                    type="date"
                    value={newViolationDate}
                    onChange={(e) => setNewViolationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lokasi Kejadian
                  </label>
                  <input
                    type="text"
                    value={newViolationLocation}
                    onChange={(e) => setNewViolationLocation(e.target.value)}
                    placeholder="Lingkungan Sekolah"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi Kronologis Kejadian <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newViolationDescription}
                  onChange={(e) => setNewViolationDescription(e.target.value)}
                  required
                  placeholder="Jelaskan secara ringkas pelanggaran yang dilakukan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-indigo-500 text-xs leading-relaxed"
                />
              </div>

              {/* Reporter Info */}
              <div className="text-[11px] text-slate-500 p-2.5 bg-slate-50 rounded-xl">
                Pelapor otomatis tercatat sebagai: <strong>{user.name}</strong> (Wali Kelas).
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddViolationModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={newViolationSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-xs"
                >
                  {newViolationSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: DETAIL PELANGGARAN */}
      {/* ==================================================== */}
      {selectedViolationDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Rincian Kasus Pelanggaran
                </h3>
                <p className="text-xs text-slate-500">
                  Siswa: {selectedViolationDetail.student?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedViolationDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Kategori</span>
                  <span className="font-extrabold text-indigo-700">{selectedViolationDetail.violation_type}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                  <span className="font-extrabold text-slate-800">{selectedViolationDetail.status}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tanggal</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedViolationDetail.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Poin</span>
                  <span className="font-bold text-rose-600">{selectedViolationDetail.penalty_points || 5} Poin</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Deskripsi Kejadian</span>
                <p className="text-slate-800 leading-relaxed">{selectedViolationDetail.description}</p>
              </div>

              {selectedViolationDetail.location && (
                <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Lokasi: {selectedViolationDetail.location}</span>
                </div>
              )}

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Pelapor: <strong>{selectedViolationDetail.reporter?.name || 'Petugas'}</strong></span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedViolationDetail(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
