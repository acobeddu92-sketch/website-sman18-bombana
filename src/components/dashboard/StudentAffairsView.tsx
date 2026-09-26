'use client';

import React, { useState, useEffect, useMemo } from 'react';
import GalleryManagementModal from './GalleryManagementModal';
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
  Image as ImageIcon,
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
} from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: string;
  email: string;
  nip?: string | null;
}

interface StudentAffairsViewProps {
  user: CurrentUser;
}

export default function StudentAffairsView({ user }: StudentAffairsViewProps) {
  // Navigation State
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Month & Year Filter State (Default current month & year)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Students Data
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [detailStudentLoading, setDetailStudentLoading] = useState(false);

  // Attendance Data
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('all');
  const [verifyingAttendanceId, setVerifyingAttendanceId] = useState<string | null>(null);
  const [verifyStatusAction, setVerifyStatusAction] = useState('Diverifikasi');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  // Violations Data
  const [violationsData, setViolationsData] = useState<any[]>([]);
  const [violationsStats, setViolationsStats] = useState<Record<string, number>>({});
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [violationsError, setViolationsError] = useState<string | null>(null);
  const [violationSearch, setViolationSearch] = useState('');
  const [violationStatusFilter, setViolationStatusFilter] = useState('all');
  const [violationClassFilter, setViolationClassFilter] = useState('all');
  const [violationCategoryFilter, setViolationCategoryFilter] = useState('all');
  const [violationGradeFilter, setViolationGradeFilter] = useState('all');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('all');
  const [selectedViolationDetail, setSelectedViolationDetail] = useState<any>(null);
  const [detailViolationLoading, setDetailViolationLoading] = useState(false);

  // Follow Up Form in Detail Modal
  const [followUpActionTaken, setFollowUpActionTaken] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpStatusAfter, setFollowUpStatusAfter] = useState('Dalam Penanganan');
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);

  // New Violation Form Modal
  const [showAddViolationModal, setShowAddViolationModal] = useState(false);
  const [newViolationStudentId, setNewViolationStudentId] = useState('');
  const [newViolationType, setNewViolationType] = useState('Kedisiplinan');
  const [newViolationDescription, setNewViolationDescription] = useState('');
  const [newViolationLocation, setNewViolationLocation] = useState('Lingkungan Sekolah');
  const [newViolationTime, setNewViolationTime] = useState('');
  const [newViolationInitialAction, setNewViolationInitialAction] = useState('');
  const [newViolationSubmitting, setNewViolationSubmitting] = useState(false);

  // Follow Ups Global Data
  const [followUpsData, setFollowUpsData] = useState<any[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);
  const [followUpSearch, setFollowUpSearch] = useState('');

  // Picket Reports Data
  const [picketData, setPicketData] = useState<any[]>([]);
  const [picketLoading, setPicketLoading] = useState(false);
  const [picketError, setPicketError] = useState<string | null>(null);
  const [selectedPicketDetail, setSelectedPicketDetail] = useState<any>(null);

  // Activities Data
  const [activitiesData, setActivitiesData] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Statistics Data
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  // Notifications Data
  const [notificationsData, setNotificationsData] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // Change Password Modal
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Month Names Helper
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // 1. Fetch Dashboard Data
  const fetchDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/dashboard?year=${selectedYear}&month=${selectedMonth}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}: Gagal memuat dashboard`);
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      setDashboardError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setDashboardLoading(false);
    }
  };

  // 2. Fetch Students Data
  const fetchStudents = async () => {
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const params = new URLSearchParams();
      if (studentSearch) params.append('q', studentSearch);
      if (selectedClassFilter !== 'all') params.append('class_id', selectedClassFilter);
      if (selectedGradeFilter !== 'all') params.append('grade', selectedGradeFilter);

      const res = await fetch(`/api/student-affairs/students?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal memuat master data siswa');
      }
      const data = await res.json();
      setStudentsData(data.students || []);
      setClassesList(data.classes || []);
    } catch (err: any) {
      setStudentsError(err.message || 'Gagal mengambil data siswa.');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch Student Detail
  const fetchStudentDetail = async (id: string) => {
    setDetailStudentLoading(true);
    try {
      const res = await fetch(`/api/student-affairs/students/${id}`);
      if (!res.ok) throw new Error('Gagal memuat detail siswa');
      const data = await res.json();
      setSelectedStudentDetail(data.student);
    } catch (err: any) {
      alert(err.message || 'Gagal membuka detail siswa.');
    } finally {
      setDetailStudentLoading(false);
    }
  };

  // 3. Fetch Attendance Data
  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });
      if (attendanceClassFilter !== 'all') {
        params.append('class_id', attendanceClassFilter);
      }

      const res = await fetch(`/api/student-affairs/attendance?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal memuat rekap absensi');
      }
      const data = await res.json();
      setAttendanceData(data);
      if (data.classes && classesList.length === 0) {
        setClassesList(data.classes);
      }
    } catch (err: any) {
      setAttendanceError(err.message || 'Gagal mengambil data absensi.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Submit Verify Attendance
  const handleVerifyAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingAttendanceId) return;
    setVerifySubmitting(true);
    try {
      const res = await fetch('/api/student-affairs/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: verifyingAttendanceId,
          status: verifyStatusAction,
          verification_notes: verificationNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui verifikasi');
      alert(data.message || 'Verifikasi berhasil disimpan.');
      setVerifyingAttendanceId(null);
      setVerificationNotes('');
      fetchAttendance();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan verifikasi.');
    } finally {
      setVerifySubmitting(false);
    }
  };

  // 4. Fetch Violations Data
  const fetchViolations = async () => {
    setViolationsLoading(true);
    setViolationsError(null);
    try {
      const params = new URLSearchParams();
      if (violationSearch) params.append('q', violationSearch);
      if (violationStatusFilter !== 'all') params.append('status', violationStatusFilter);
      if (violationClassFilter !== 'all') params.append('class_id', violationClassFilter);
      if (violationCategoryFilter !== 'all') params.append('violation_type', violationCategoryFilter);
      if (violationGradeFilter !== 'all') params.append('grade', violationGradeFilter);

      const res = await fetch(`/api/student-affairs/violations?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal memuat data pelanggaran');
      }
      const data = await res.json();
      setViolationsData(data.violations || []);
      setViolationsStats(data.countsByStatus || {});
      if (data.classes && classesList.length === 0) {
        setClassesList(data.classes);
      }
    } catch (err: any) {
      setViolationsError(err.message || 'Gagal mengambil data pelanggaran.');
    } finally {
      setViolationsLoading(false);
    }
  };

  // Fetch Violation Detail
  const fetchViolationDetail = async (id: string) => {
    setDetailViolationLoading(true);
    try {
      const res = await fetch(`/api/student-affairs/violations/${id}`);
      if (!res.ok) throw new Error('Gagal memuat detail kasus pelanggaran');
      const data = await res.json();
      setSelectedViolationDetail(data.violation);
      setFollowUpStatusAfter(data.violation.status);
    } catch (err: any) {
      alert(err.message || 'Gagal membuka kasus pelanggaran.');
    } finally {
      setDetailViolationLoading(false);
    }
  };

  // Submit Follow Up in Modal
  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedViolationDetail || !followUpActionTaken.trim()) return;
    setFollowUpSubmitting(true);
    try {
      const res = await fetch(
        `/api/student-affairs/violations/${selectedViolationDetail.id}/follow-up`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_taken: followUpActionTaken,
            notes: followUpNotes,
            status_after: followUpStatusAfter,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan tindak lanjut');
      alert('Tindak lanjut berhasil dicatat.');
      setFollowUpActionTaken('');
      setFollowUpNotes('');
      // Refresh modal detail and list
      fetchViolationDetail(selectedViolationDetail.id);
      fetchViolations();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  // Submit New Violation
  const handleCreateViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViolationStudentId || !newViolationDescription.trim()) {
      alert('Pilih siswa dan isi deskripsi kejadian pelanggaran.');
      return;
    }
    setNewViolationSubmitting(true);
    try {
      const res = await fetch('/api/student-affairs/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: newViolationStudentId,
          violation_type: newViolationType,
          description: newViolationDescription,
          location: newViolationLocation,
          time: newViolationTime,
          initial_action: newViolationInitialAction,
          status: 'Dilaporkan',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat pelanggaran');
      alert('Pelanggaran siswa berhasil dicatat ke pusat data.');
      setShowAddViolationModal(false);
      setNewViolationStudentId('');
      setNewViolationDescription('');
      setNewViolationTime('');
      setNewViolationInitialAction('');
      fetchViolations();
      fetchDashboard();
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

      const res = await fetch(`/api/student-affairs/follow-ups?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat rekap tindak lanjut');
      const data = await res.json();
      setFollowUpsData(data.followUps || []);
    } catch (err: any) {
      setFollowUpsError(err.message || 'Gagal mengambil data tindak lanjut.');
    } finally {
      setFollowUpsLoading(false);
    }
  };

  // 6. Fetch Picket Reports
  const fetchPicket = async () => {
    setPicketLoading(true);
    setPicketError(null);
    try {
      const res = await fetch('/api/student-affairs/picket');
      if (!res.ok) throw new Error('Gagal memuat rekap piket');
      const data = await res.json();
      setPicketData(data.reports || []);
    } catch (err: any) {
      setPicketError(err.message || 'Gagal mengambil data piket.');
    } finally {
      setPicketLoading(false);
    }
  };

  // 7. Fetch Activities
  const fetchActivities = async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const res = await fetch('/api/student-affairs/activities');
      if (!res.ok) throw new Error('Gagal memuat kegiatan kesiswaan');
      const data = await res.json();
      setActivitiesData(data.activities || []);
    } catch (err: any) {
      setActivitiesError(err.message || 'Gagal mengambil data kegiatan.');
    } finally {
      setActivitiesLoading(false);
    }
  };

  // 8. Fetch Statistics
  const fetchStatistics = async () => {
    setStatisticsLoading(true);
    setStatisticsError(null);
    try {
      const res = await fetch('/api/student-affairs/statistics');
      if (!res.ok) throw new Error('Gagal memuat statistik kesiswaan');
      const data = await res.json();
      setStatisticsData(data.statistics || null);
    } catch (err: any) {
      setStatisticsError(err.message || 'Gagal mengambil data statistik.');
    } finally {
      setStatisticsLoading(false);
    }
  };

  // 9. Fetch Notifications
  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await fetch('/api/student-affairs/notifications');
      if (!res.ok) throw new Error('Gagal memuat notifikasi kesiswaan');
      const data = await res.json();
      setNotificationsData(data.notifications || []);
    } catch (err: any) {
      setNotificationsError(err.message || 'Gagal mengambil data notifikasi.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Seluruh kolom kata sandi wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
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
      setPasswordError(err.message || 'Terjadi kesalahan.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari Pusat Kesiswaan?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  };

  // Initial & Tab Switching Effects
  useEffect(() => {
    if (activeMenu === 'dashboard') {
      fetchDashboard();
    } else if (activeMenu === 'students') {
      fetchStudents();
    } else if (activeMenu === 'attendance' || activeMenu === 'attendance_verification') {
      fetchAttendance();
    } else if (activeMenu === 'violations') {
      fetchViolations();
    } else if (activeMenu === 'follow_ups') {
      fetchFollowUps();
    } else if (activeMenu === 'picket') {
      fetchPicket();
    } else if (activeMenu === 'activities') {
      fetchActivities();
    } else if (activeMenu === 'guidance') {
      fetchStatistics();
      fetchViolations();
    } else if (activeMenu === 'statistics') {
      fetchStatistics();
    } else if (activeMenu === 'reports') {
      fetchDashboard();
      fetchAttendance();
      fetchViolations();
      fetchPicket();
    } else if (activeMenu === 'notifications') {
      fetchNotifications();
    }
  }, [activeMenu, selectedYear, selectedMonth]);

  // Menu Definition (Exactly 13 Menus + Logout)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: School },
    { id: 'students', label: 'Data Siswa', icon: Users },
    { id: 'attendance', label: 'Kehadiran & Presensi', icon: CalendarDays },
    { id: 'attendance_verification', label: 'Verifikasi Presensi', icon: CheckCircle2 },
    { id: 'violations', label: 'Pelanggaran Siswa', icon: ShieldAlert },
    { id: 'follow_ups', label: 'Tindak Lanjut', icon: Clock },
    { id: 'picket', label: 'Laporan Piket', icon: ClipboardList },
    { id: 'guidance', label: 'Pembinaan Siswa', icon: UserCheck },
    { id: 'activities', label: 'Kegiatan Kesiswaan', icon: Award },
    { id: 'galeri', label: 'Galeri & Dokumentasi', icon: ImageIcon },
    { id: 'statistics', label: 'Statistik Kesiswaan', icon: BarChart3 },
    { id: 'reports', label: 'Rekap & Laporan', icon: FileText },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'account', label: 'Pengaturan Akun', icon: UserCog },
    { id: 'logout', label: 'Logout', icon: LogOut, isDanger: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* ==================================================== */}
      {/* SIDEBAR */}
      {/* ==================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 md:static md:translate-x-0 print:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/40">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">SMAN 18 BOMBANA</h1>
              <p className="text-[11px] text-emerald-400 font-medium">Pusat Kesiswaan</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <p className="text-xs text-slate-400">Selamat datang,</p>
          <p className="font-semibold text-sm text-emerald-200 truncate mt-0.5">{user.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
              Wakasek Kesiswaan
            </span>
            {user.nip && (
              <span className="text-[10px] text-slate-400 font-mono">NIP: {user.nip}</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'logout') {
                    handleLogout();
                  } else if (item.id === 'galeri') {
                    setIsGalleryModalOpen(true);
                    setMobileSidebarOpen(false);
                  } else {
                    setActiveMenu(item.id);
                    setMobileSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  item.isDanger
                    ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 mt-4 border-t border-slate-800 pt-3'
                    : isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Monitoring & Tata Tertib Siswa
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden print:hidden"
        />
      )}

      {/* ==================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ==================================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Pusat Kesiswaan</span>
                <span className="text-slate-400 text-xs font-normal">/</span>
                <span className="text-emerald-700 text-sm font-semibold capitalize">
                  {menuItems.find((m) => m.id === activeMenu)?.label || 'Dashboard'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">Monitoring dan Pengelolaan Kesiswaan</p>
            </div>
          </div>

          {/* Quick Period Selector */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Periode:</span>
              <span className="font-semibold text-emerald-800">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <button
              onClick={() => {
                if (activeMenu === 'dashboard') fetchDashboard();
                if (activeMenu === 'students') fetchStudents();
                if (activeMenu === 'attendance') fetchAttendance();
                if (activeMenu === 'violations') fetchViolations();
              }}
              title="Segarkan Data"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ==================================================== */}
          {/* 1. DASHBOARD UTAMA */}
          {/* ==================================================== */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pusat Monitoring Terintegrasi
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Pusat Kesiswaan
                  </h1>
                  <p className="text-emerald-100/90 text-sm mt-2 leading-relaxed">
                    Monitoring dan Pengelolaan Kesiswaan SMAN 18 Bombana. Kendali terpadu data siswa,
                    kehadiran, kedisiplinan, penanganan kasus, serta pengawasan piket harian sekolah.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-emerald-200 font-medium">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-300" />
                      {user.name} (Wakasek Kesiswaan)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-300" />
                      Periode Aktif: {monthNames[selectedMonth - 1]} {selectedYear}
                    </span>
                  </div>
                </div>
                <div className="absolute right-[-40px] bottom-[-40px] opacity-10 pointer-events-none text-white">
                  <School className="w-80 h-80" />
                </div>
              </div>

              {/* Period Selector Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span>Atur Periode Rekap:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-emerald-600"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        Bulan {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-emerald-600"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        Tahun {y}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={fetchDashboard}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-1.5 rounded-lg transition"
                  >
                    Terapkan
                  </button>
                </div>
              </div>

              {/* Error State */}
              {dashboardError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <p className="font-bold">Gagal memuat indikator kesiswaan:</p>
                    <p>{dashboardError}</p>
                  </div>
                </div>
              )}

              {/* 9 Indikator REAL Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {/* 1. Total Siswa Aktif */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">1. Siswa Aktif</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-slate-900">
                      {dashboardLoading ? '...' : dashboardData?.stats?.totalStudents ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {dashboardData?.stats?.totalClasses || 0} Kelas terdaftar
                    </p>
                  </div>
                </div>

                {/* 2. Hadir */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">2. Hadir (H)</span>
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-teal-700">
                      {dashboardLoading ? '...' : dashboardData?.stats?.hadir ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Periode {monthNames[selectedMonth - 1]}
                    </p>
                  </div>
                </div>

                {/* 3. Sakit */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">3. Sakit (S)</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-blue-700">
                      {dashboardLoading ? '...' : dashboardData?.stats?.sakit ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Izin sakit resmi</p>
                  </div>
                </div>

                {/* 4. Izin */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">4. Izin (I)</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-amber-700">
                      {dashboardLoading ? '...' : dashboardData?.stats?.izin ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Dispensasi & keperluan</p>
                  </div>
                </div>

                {/* 5. Alpa */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">5. Alpa (A)</span>
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-rose-700">
                      {dashboardLoading ? '...' : dashboardData?.stats?.alpa ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tanpa keterangan</p>
                  </div>
                </div>

                {/* 6. Total Kasus Pelanggaran */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">6. Total Kasus</span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-indigo-800">
                      {dashboardLoading ? '...' : dashboardData?.stats?.totalViolations ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Kumulatif pelanggaran</p>
                  </div>
                </div>

                {/* 7. Kasus Belum Ditindaklanjuti */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">7. Belum Tindak Lanjut</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-amber-600">
                      {dashboardLoading ? '...' : dashboardData?.stats?.unhandledCount ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Perlu perhatian segera</p>
                  </div>
                </div>

                {/* 8. Kasus Dalam Penanganan */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">8. Dalam Penanganan</span>
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-sky-700">
                      {dashboardLoading ? '...' : dashboardData?.stats?.inProgressCount ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sedang dibimbing</p>
                  </div>
                </div>

                {/* 9. Kasus Selesai */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">9. Kasus Selesai</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-emerald-700">
                      {dashboardLoading ? '...' : dashboardData?.stats?.resolvedCount ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tuntas & terdokumentasi</p>
                  </div>
                </div>

                {/* Laporan Piket Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">Laporan Piket</span>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-slate-800">
                      {dashboardLoading ? '...' : dashboardData?.stats?.totalPicketReports ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Laporan piket tercatat</p>
                  </div>
                </div>
              </div>

              {/* Panel MONITORING KESISWAAN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      Panel Monitoring Kesiswaan
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Evaluasi otomatis berdasarkan data database nyata
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Kehadiran */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Kehadiran Siswa</p>
                      <p className="font-bold text-xs text-slate-800 mt-1">
                        {dashboardData?.monitoring?.attendance || 'Memuat...'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        dashboardData?.monitoring?.attendance === 'Normal'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dashboardData?.monitoring?.attendance === 'Perlu Perhatian'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {dashboardData?.monitoring?.attendance || '-'}
                    </span>
                  </div>

                  {/* Pelanggaran */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Tingkat Kasus</p>
                      <p className="font-bold text-xs text-slate-800 mt-1">
                        {dashboardData?.monitoring?.violations || 'Memuat...'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        dashboardData?.monitoring?.violations === 'Normal'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dashboardData?.monitoring?.violations || '-'}
                    </span>
                  </div>

                  {/* Tindak Lanjut */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Tindak Lanjut</p>
                      <p className="font-bold text-xs text-slate-800 mt-1">
                        {dashboardData?.monitoring?.followUp || 'Memuat...'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        dashboardData?.monitoring?.followUp === 'Optimal'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dashboardData?.monitoring?.followUp || '-'}
                    </span>
                  </div>

                  {/* Piket */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Pengawasan Piket</p>
                      <p className="font-bold text-xs text-slate-800 mt-1">
                        {dashboardData?.monitoring?.picket || 'Memuat...'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                      {dashboardData?.monitoring?.picket || '-'}
                    </span>
                  </div>

                  {/* Kegiatan */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Kegiatan Siswa</p>
                      <p className="font-bold text-xs text-slate-800 mt-1">
                        {dashboardData?.monitoring?.activities || 'Memuat...'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                      {dashboardData?.monitoring?.activities || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Kasus Terbaru & Piket Terakhir */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kasus Pelanggaran Terbaru */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-xs text-slate-900">
                          Kasus Pelanggaran Terkini
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveMenu('violations')}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                      >
                        Lihat Semua <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    {dashboardLoading ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Memuat data kasus terkini...
                      </div>
                    ) : dashboardData?.recentViolations?.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                        Tidak ada kasus pelanggaran aktif. Kedisiplinan terjaga aman.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {dashboardData?.recentViolations?.map((v: any) => (
                          <div
                            key={v.id}
                            className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition bg-slate-50/60 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-xs text-slate-800">
                                {v.studentName}{' '}
                                <span className="text-slate-400 font-normal">({v.className})</span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {v.violationType} • Pelapor: {v.reporterName}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  v.status === 'Selesai'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : v.status === 'Dalam Penanganan'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {v.status}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(v.date).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pengawasan Piket Terakhir */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-xs text-slate-900">
                          Laporan Piket Harian Sekolah
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveMenu('picket')}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                      >
                        Lihat Riwayat <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    {dashboardData?.latestPicket ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Laporan Piket Terakhir
                            </span>
                            <p className="font-bold text-sm text-slate-900 mt-1">
                              {dashboardData.latestPicket.teacherName}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(dashboardData.latestPicket.date).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 italic leading-relaxed">
                          "{dashboardData.latestPicket.summary}"
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>Siswa bermasalah dijaring:</span>
                          <span className="font-bold text-slate-800">
                            {dashboardData.latestPicket.violationCount} Siswa
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                        Belum ada laporan piket harian yang diserahkan.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. DATA SISWA (MASTER DATA) */}
          {/* ==================================================== */}
          {activeMenu === 'students' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Master Data Siswa</h3>
                    <p className="text-xs text-slate-500">
                      Sinkronisasi penuh dengan Master Data Siswa Administrator
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg self-start sm:self-auto">
                    Total: {studentsData.length} Siswa Terdaftar
                  </span>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama siswa, NIS, atau NISN..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                      className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>
                  <select
                    value={selectedGradeFilter}
                    onChange={(e) => setSelectedGradeFilter(e.target.value)}
                    className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  >
                    <option value="all">Semua Tingkat</option>
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  >
                    <option value="all">Semua Rombel</option>
                    {classesList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={fetchStudents}
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition"
                  >
                    Terapkan
                  </button>
                </div>

                {/* Table */}
                {studentsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat data siswa dari database...
                  </div>
                ) : studentsError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {studentsError}
                  </div>
                ) : studentsData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    Tidak ditemukan data siswa yang cocok dengan filter pencarian.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-3 px-4">No</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">NIS / NISN</th>
                          <th className="py-3 px-4">L/P</th>
                          <th className="py-3 px-4">Kelas</th>
                          <th className="py-3 px-4">Wali Kelas</th>
                          <th className="py-3 px-4 text-center">Riwayat Kasus</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {studentsData.map((std, idx) => (
                          <tr key={std.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{std.name}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {std.nis || '-'} / {std.nisn || '-'}
                            </td>
                            <td className="py-3 px-4">{std.gender || '-'}</td>
                            <td className="py-3 px-4 font-medium text-emerald-800">
                              {std.class?.name || 'Tanpa Kelas'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {std.class?.homeroom_teacher?.name || '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {std._count?.violations > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  {std._count.violations} Kasus
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => fetchStudentDetail(std.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-md border border-slate-200 transition"
                              >
                                <Eye className="w-3.5 h-3.5" /> Detail
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
          {/* 3. REKAP ABSENSI SISWA */}
          {/* ==================================================== */}
          {activeMenu === 'attendance' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Rekap Absensi Siswa</h3>
                    <p className="text-xs text-slate-500">
                      Pusat monitoring dan verifikasi rekapitulasi kehadiran bulanan dari guru
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Rekap
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Tahun:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Bulan:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium"
                    >
                      {monthNames.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Rombel:</span>
                    <select
                      value={attendanceClassFilter}
                      onChange={(e) => setAttendanceClassFilter(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium"
                    >
                      <option value="all">Semua Rombel</option>
                      {classesList.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={fetchAttendance}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-1.5 rounded-lg transition"
                  >
                    Tampilkan Rekap
                  </button>
                </div>

                {/* Summary Row */}
                {attendanceData?.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <p className="text-[11px] text-slate-500">Total Hadir (H)</p>
                      <p className="text-lg font-bold text-teal-700">
                        {attendanceData.summary.totalH}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Total Sakit (S)</p>
                      <p className="text-lg font-bold text-blue-700">
                        {attendanceData.summary.totalS}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Total Izin (I)</p>
                      <p className="text-lg font-bold text-amber-700">
                        {attendanceData.summary.totalI}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Total Alpa (A)</p>
                      <p className="text-lg font-bold text-rose-700">
                        {attendanceData.summary.totalA}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Akumulasi Total</p>
                      <p className="text-lg font-bold text-slate-900">
                        {attendanceData.summary.grandTotal}
                      </p>
                    </div>
                  </div>
                )}

                {/* Attendances List by Header */}
                {attendanceLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat data rekap absensi sekolah...
                  </div>
                ) : attendanceError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {attendanceError}
                  </div>
                ) : attendanceData?.attendances?.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    Belum ada rekapitulasi absensi bulanan yang diserahkan untuk periode ini.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {attendanceData.attendances.map((att: any) => (
                      <div
                        key={att.id}
                        className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs bg-white"
                      >
                        {/* Header Box */}
                        <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-sm text-slate-900">
                              Kelas {att.class?.name} • Mapel: {att.subject}
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Guru: {att.teacher?.name} • Status:{' '}
                              <span
                                className={`font-semibold ${
                                  att.status === 'Disetujui'
                                    ? 'text-emerald-700'
                                    : att.status === 'Diverifikasi'
                                    ? 'text-teal-700'
                                    : att.status === 'Dikirim'
                                    ? 'text-sky-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {att.status}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setVerifyingAttendanceId(att.id);
                                setVerifyStatusAction(att.status === 'Draft' ? 'Diverifikasi' : att.status);
                                setVerificationNotes(att.verification_notes || '');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                            >
                              Verifikasi / Setujui
                            </button>
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                              <tr>
                                <th className="py-2.5 px-3">No</th>
                                <th className="py-2.5 px-3">Nama Siswa</th>
                                <th className="py-2.5 px-3">NIS</th>
                                <th className="py-2.5 px-3 text-center text-teal-700">H (Hadir)</th>
                                <th className="py-2.5 px-3 text-center text-blue-700">S (Sakit)</th>
                                <th className="py-2.5 px-3 text-center text-amber-700">I (Izin)</th>
                                <th className="py-2.5 px-3 text-center text-rose-700">A (Alpa)</th>
                                <th className="py-2.5 px-3 text-center font-bold">Total</th>
                                <th className="py-2.5 px-3">Catatan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {att.items?.map((it: any, iIdx: number) => (
                                <tr key={it.id} className="hover:bg-slate-50/60">
                                  <td className="py-2 px-3 text-slate-400">{iIdx + 1}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900">
                                    {it.student?.name}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-slate-500">
                                    {it.student?.nis || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-center font-semibold text-teal-700">
                                    {it.present}
                                  </td>
                                  <td className="py-2 px-3 text-center text-blue-700">{it.sick}</td>
                                  <td className="py-2 px-3 text-center text-amber-700">
                                    {it.permission}
                                  </td>
                                  <td className="py-2 px-3 text-center text-rose-700">
                                    {it.unexcused}
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold text-slate-900">
                                    {it.total}
                                  </td>
                                  <td className="py-2 px-3 text-slate-500 italic">
                                    {it.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          
          {/* ==================================================== */}
          {/* 3B. VERIFIKASI PRESENSI */}
          {/* ==================================================== */}
          {activeMenu === 'attendance_verification' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Verifikasi Presensi Siswa</h3>
                    <p className="text-xs text-slate-500">
                      Pusat verifikasi, validasi, dan pengesahan rekapitulasi kehadiran bulanan dari wali kelas / guru mata pelajaran
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveMenu('attendance')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <CalendarDays className="w-3.5 h-3.5" /> Buka Lembar Presensi
                    </button>
                  </div>
                </div>

                {/* Status Chips & Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Menunggu Verifikasi</span>
                    <span className="text-lg font-bold text-amber-700">
                      {(attendanceData?.attendances || []).filter((a: any) => a.status === 'Draft' || a.status === 'Dikirim' || !a.verified_by_id).length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Diverifikasi</span>
                    <span className="text-lg font-bold text-teal-700">
                      {(attendanceData?.attendances || []).filter((a: any) => a.status === 'Diverifikasi').length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Disetujui (Final)</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {(attendanceData?.attendances || []).filter((a: any) => a.status === 'Disetujui').length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Dikembalikan</span>
                    <span className="text-lg font-bold text-rose-700">
                      {(attendanceData?.attendances || []).filter((a: any) => a.status === 'Dikembalikan').length}
                    </span>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <select
                      value={verificationStatusFilter}
                      onChange={(e) => setVerificationStatusFilter(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700"
                    >
                      <option value="all">Semua Status</option>
                      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                      <option value="Diverifikasi">Diverifikasi</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Dikembalikan">Dikembalikan</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Tahun:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Bulan:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700"
                    >
                      {monthNames.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={fetchAttendance}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-1.5 rounded-lg transition"
                  >
                    Segarkan
                  </button>
                </div>

                {/* Attendance List */}
                {attendanceLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat daftar rekap presensi untuk verifikasi...
                  </div>
                ) : attendanceError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {attendanceError}
                  </div>
                ) : (attendanceData?.attendances || []).filter((att: any) => {
                    if (verificationStatusFilter === 'all') return true;
                    if (verificationStatusFilter === 'Menunggu Verifikasi') {
                      return att.status === 'Draft' || att.status === 'Dikirim' || !att.verified_by_id;
                    }
                    return att.status === verificationStatusFilter;
                  }).length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    Tidak ada rekapitulasi presensi yang sesuai dengan status verifikasi ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(attendanceData?.attendances || [])
                      .filter((att: any) => {
                        if (verificationStatusFilter === 'all') return true;
                        if (verificationStatusFilter === 'Menunggu Verifikasi') {
                          return att.status === 'Draft' || att.status === 'Dikirim' || !att.verified_by_id;
                        }
                        return att.status === verificationStatusFilter;
                      })
                      .map((att: any) => (
                        <div
                          key={att.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">
                                Kelas {att.class?.name} • Mapel: {att.subject}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Guru: <span className="font-medium text-slate-700">{att.teacher?.name}</span> • Total Siswa: {att.items?.length || 0}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  att.status === 'Disetujui'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : att.status === 'Diverifikasi'
                                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                    : att.status === 'Dikembalikan'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {att.status || 'Draft'}
                              </span>
                              <button
                                onClick={() => {
                                  setVerifyingAttendanceId(att.id);
                                  setVerifyStatusAction(
                                    att.status === 'Draft' || att.status === 'Dikirim'
                                      ? 'Diverifikasi'
                                      : att.status
                                  );
                                  setVerificationNotes(att.verification_notes || '');
                                }}
                                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                              >
                                Verifikasi / Ubah Status
                              </button>
                            </div>
                          </div>

                          {/* Verification Audit Trail Box */}
                          {att.verified_at && (
                            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-semibold">Riwayat Verifikasi:</span> Diverifikasi oleh{' '}
                                <span className="font-semibold text-emerald-800">{att.verifier?.name || 'Wakasek Kesiswaan'}</span> pada{' '}
                                {new Date(att.verified_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                              {att.verification_notes && (
                                <div className="text-slate-600 italic">
                                  &quot;{att.verification_notes}&quot;
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 4. PELANGGARAN & KETERTIBAN */}
          {/* ==================================================== */}
          {activeMenu === 'violations' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Satu Data Pusat Pelanggaran & Ketertiban
                    </h3>
                    <p className="text-xs text-slate-500">
                      Monitoring penegakan tata tertib terpadu sekolah (Pelapor Guru / Penangan Kesiswaan & BK)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddViolationModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" /> Catat Kasus Pelanggaran
                  </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari siswa, uraian pelanggaran, lokasi..."
                      value={violationSearch}
                      onChange={(e) => setViolationSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchViolations()}
                      className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>
                  <select
                    value={violationGradeFilter}
                    onChange={(e) => setViolationGradeFilter(e.target.value)}
                    className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  >
                    <option value="all">Semua Tingkat</option>
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                  <select
                    value={violationClassFilter}
                    onChange={(e) => setViolationClassFilter(e.target.value)}
                    className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  >
                    <option value="all">Semua Rombel</option>
                    {classesList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={violationCategoryFilter}
                    onChange={(e) => setViolationCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="Kedisiplinan">Kedisiplinan</option>
                    <option value="Kerapian">Kerapian</option>
                    <option value="Keterlambatan">Keterlambatan</option>
                    <option value="Merokok">Merokok</option>
                    <option value="Bolos">Bolos</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <select
                    value={violationStatusFilter}
                    onChange={(e) => setViolationStatusFilter(e.target.value)}
                    className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  >
                    <option value="all">Semua Status</option>
                    <option value="Dilaporkan">Dilaporkan</option>
                    <option value="Dalam Penanganan">Dalam Penanganan</option>
                    <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                  <button
                    onClick={fetchViolations}
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition shrink-0"
                  >
                    Terapkan
                  </button>
                </div>

                {/* Table */}
                {violationsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat daftar kasus pelanggaran...
                  </div>
                ) : violationsError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {violationsError}
                  </div>
                ) : violationsData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    Tidak ada catatan pelanggaran yang sesuai dengan kriteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Kelas</th>
                          <th className="py-3 px-4">Kategori Pelanggaran</th>
                          <th className="py-3 px-4">Pelapor</th>
                          <th className="py-3 px-4">Petugas Penangan</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {violationsData.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                              {new Date(v.date).toLocaleDateString('id-ID')}
                              {v.time && <span className="text-[10px] block text-slate-400">{v.time}</span>}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {v.student?.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {v.student?.class?.name || v.class_at_incident}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800">{v.violation_type}</span>
                              <p className="text-[11px] text-slate-500 truncate max-w-xs">
                                {v.description}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{v.reporter?.name || '-'}</td>
                            <td className="py-3 px-4 text-slate-600">{v.handler?.name || '-'}</td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  v.status === 'Selesai'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : v.status === 'Dalam Penanganan'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {v.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => fetchViolationDetail(v.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 transition"
                              >
                                <Eye className="w-3.5 h-3.5" /> Buka Kasus
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
          {/* 5. TINDAK LANJUT KASUS */}
          {/* ==================================================== */}
          {activeMenu === 'follow_ups' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Rekapitulasi Tindak Lanjut Pelanggaran
                    </h3>
                    <p className="text-xs text-slate-500">
                      Seluruh tindakan pembinaan, pemanggilan, dan penyelesaian kasus kesiswaan
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg">
                    Total Tindakan: {followUpsData.length}
                  </span>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari tindakan, catatan, atau siswa..."
                      value={followUpSearch}
                      onChange={(e) => setFollowUpSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchFollowUps()}
                      className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>
                  <button
                    onClick={fetchFollowUps}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition"
                  >
                    Cari
                  </button>
                </div>

                {/* Table */}
                {followUpsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat data tindak lanjut...
                  </div>
                ) : followUpsError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {followUpsError}
                  </div>
                ) : followUpsData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    Belum ada riwayat tindak lanjut yang tercatat.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Tanggal Tindakan</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Kelas</th>
                          <th className="py-3 px-4">Jenis Tindakan</th>
                          <th className="py-3 px-4">Petugas</th>
                          <th className="py-3 px-4">Catatan Perkembangan</th>
                          <th className="py-3 px-4 text-center">Status Setelahnya</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {followUpsData.map((f) => (
                          <tr key={f.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                              {new Date(f.action_date).toLocaleDateString('id-ID')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {f.violation?.student?.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {f.violation?.student?.class?.name || f.violation?.class_at_incident}
                            </td>
                            <td className="py-3 px-4 font-medium text-emerald-800">
                              {f.action_taken}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{f.actor?.name}</td>
                            <td className="py-3 px-4 text-slate-500 max-w-sm leading-relaxed">
                              {f.notes || '-'}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  f.status_after === 'Selesai'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {f.status_after}
                              </span>
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
          {/* 6. LAPORAN PIKET */}
          {/* ==================================================== */}
          {activeMenu === 'picket' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Monitoring Laporan Piket Harian
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rekapitulasi situasi ketertiban harian sekolah dan penjaringan siswa bermasalah
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg">
                    Total Laporan: {picketData.length}
                  </span>
                </div>

                {picketLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat data piket...
                  </div>
                ) : picketError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {picketError}
                  </div>
                ) : picketData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    Belum ada rekaman laporan piket guru di database.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {picketData.map((p) => (
                      <div
                        key={p.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <span className="font-bold text-sm text-slate-900">
                            {p.picket_teacher?.name}
                          </span>
                          <span className="text-xs text-emerald-800 font-medium font-mono">
                            {new Date(p.date).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div>
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                            Kondisi / Ketertiban Sekolah:
                          </p>
                          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                            {p.school_condition_summary || 'Tidak ada catatan kondisi khusus.'}
                          </p>
                        </div>

                        {p.general_notes && (
                          <div className="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600 italic">
                            "{p.general_notes}"
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Siswa Bermasalah Dijaring:
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            {p.violations?.length || 0} Siswa
                          </span>
                        </div>

                        {p.violations?.length > 0 && (
                          <div className="pt-1">
                            <p className="text-[11px] font-semibold text-slate-600 mb-1">
                              Rincian Siswa:
                            </p>
                            <div className="space-y-1">
                              {p.violations.map((pv: any) => (
                                <div
                                  key={pv.id}
                                  className="text-[11px] p-1.5 rounded bg-slate-50 flex items-center justify-between"
                                >
                                  <span>
                                    {pv.student?.name} ({pv.student?.class?.name || 'Umum'})
                                  </span>
                                  <span className="font-medium text-amber-800">
                                    {pv.violation_type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 7. KEGIATAN KESISWAAN */}
          {/* ==================================================== */}
          {activeMenu === 'activities' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Kegiatan Kesiswaan</h3>
                    <p className="text-xs text-slate-500">
                      Agenda, pembinaan karakter, dan kegiatan kesiswaan sekolah
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                    {activitiesData.length} Agenda
                  </span>
                </div>

                {activitiesLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat agenda kegiatan kesiswaan...
                  </div>
                ) : activitiesError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {activitiesError}
                  </div>
                ) : activitiesData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl space-y-2">
                    <Award className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">
                      Belum ada data kegiatan kesiswaan.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Agenda kegiatan akan tampil otomatis bila terdaftar di pengumuman sekolah.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activitiesData.map((act) => (
                      <div
                        key={act.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs hover:border-emerald-300 transition"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 capitalize">
                            {act.category}
                          </span>
                          <span className="text-slate-400">
                            {new Date(act.date).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{act.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {act.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 8. PEMBINAAN SISWA */}
          {/* ==================================================== */}
          {activeMenu === 'guidance' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900">
                    Pusat Pembinaan & Perhatian Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Monitoring objektif siswa yang membutuhkan atensi khusus berdasarkan akumulasi
                    kasus dan catatan kehadiran (tanpa membuka rahasia konseling BK).
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Violations Accumulation */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <h4 className="font-bold text-xs text-slate-900">
                        Siswa dengan Akumulasi Kasus Terbanyak
                      </h4>
                    </div>

                    {statisticsData?.topStudentsWithViolations?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        Tidak ada siswa dengan catatan pelanggaran berulang.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {statisticsData?.topStudentsWithViolations?.map((s: any, idx: number) => (
                          <div
                            key={s.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{s.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  Kelas: {s.className} • NIS: {s.nis || '-'}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              {s.violationCount} Kasus
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Kasus Belum Tuntas / Perlu Tindak Lanjut Segera */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <h4 className="font-bold text-xs text-slate-900">
                        Kasus Belum Ditindaklanjuti
                      </h4>
                    </div>

                    {violationsData.filter(
                      (v) => v.status === 'Dilaporkan' || v.status === 'Perlu Tindak Lanjut'
                    ).length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        Semua laporan kasus telah ditangani atau tuntas.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {violationsData
                          .filter(
                            (v) => v.status === 'Dilaporkan' || v.status === 'Perlu Tindak Lanjut'
                          )
                          .slice(0, 6)
                          .map((v: any) => (
                            <div
                              key={v.id}
                              className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {v.student?.name} ({v.student?.class?.name || v.class_at_incident})
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {v.violation_type}
                                </p>
                              </div>
                              <button
                                onClick={() => fetchViolationDetail(v.id)}
                                className="px-2 py-1 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-900 rounded font-medium border border-amber-200"
                              >
                                Tangani
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 9. REKAP & STATISTIK */}
          {/* ==================================================== */}
          {activeMenu === 'statistics' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Rekap & Statistik Kesiswaan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Analitik kuantitatif kesiswaan berdasarkan data riil database
                    </p>
                  </div>
                  <button
                    onClick={fetchStatistics}
                    className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Segarkan
                  </button>
                </div>

                {statisticsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat grafik & statistik...
                  </div>
                ) : statisticsError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {statisticsError}
                  </div>
                ) : !statisticsData ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    Data statistik belum tersedia.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Siswa per Kelas */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-700" /> Distribusi Siswa per Kelas
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {statisticsData.studentsPerClass?.map((c: any) => (
                          <div
                            key={c.classId}
                            className="p-3 rounded-lg bg-white border border-slate-200 text-center"
                          >
                            <p className="font-bold text-xs text-slate-800">{c.className}</p>
                            <p className="text-xl font-extrabold text-emerald-700 mt-1">
                              {c.studentCount}
                            </p>
                            <p className="text-[10px] text-slate-400">Siswa Aktif</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pelanggaran per Kategori */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-700" /> Distribusi Pelanggaran per Kategori
                      </h4>
                      {statisticsData.violationsByCategory?.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">
                          Belum ada data pelanggaran terdaftar.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {statisticsData.violationsByCategory?.map((v: any) => (
                            <div key={v.category} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-800">{v.category}</span>
                                <span className="font-bold text-rose-700">{v.count} Kasus</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{
                                    width: `${Math.min(100, (v.count / 20) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 10. LAPORAN KESISWAAN */}
          {/* ==================================================== */}
          {activeMenu === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Pusat Laporan Kesiswaan</h3>
                    <p className="text-xs text-slate-500">
                      Laporan resmi komprehensif bidang kesiswaan SMAN 18 Bombana siap cetak
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Printer className="w-4 h-4" /> Cetak Laporan Resmi
                  </button>
                </div>

                {/* Printable Report Preview */}
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 space-y-6 print:border-none print:p-0 print:bg-transparent">
                  {/* Kop Surat Header Laporan */}
                  <div className="text-center border-b-2 border-slate-800 pb-3">
                    <h2 className="font-bold text-sm tracking-wide uppercase">
                      PEMERINTAH PROVINSI SULAWESI TENGGARA
                    </h2>
                    <h1 className="font-extrabold text-base tracking-wide uppercase">
                      SMA NEGERI 18 BOMBANA
                    </h1>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Jl. Pendidikan No. 18, Kec. Poleang, Kab. Bombana, Sulawesi Tenggara
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Website: https://sman18bombana.sch.id • Email: info@sman18bombana.sch.id
                    </p>
                  </div>

                  {/* Judul Laporan */}
                  <div className="text-center space-y-1">
                    <h3 className="font-extrabold text-sm uppercase underline">
                      REKAPITULASI LAPORAN MONITORING KESISWAAN
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Periode: {monthNames[selectedMonth - 1]} {selectedYear}
                    </p>
                  </div>

                  {/* Ringkasan Eksekutif */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-200 rounded-lg p-3 bg-white">
                    <div>
                      <span className="text-slate-400 block text-[10px]">TOTAL SISWA AKTIF</span>
                      <span className="font-bold text-slate-900">
                        {dashboardData?.stats?.totalStudents || 0} Siswa
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">TOTAL KEHADIRAN (H)</span>
                      <span className="font-bold text-teal-800">
                        {dashboardData?.stats?.hadir || 0} Rekaman
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">TOTAL KASUS PELANGGARAN</span>
                      <span className="font-bold text-rose-800">
                        {dashboardData?.stats?.totalViolations || 0} Kasus
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">LAPORAN PIKET</span>
                      <span className="font-bold text-slate-900">
                        {dashboardData?.stats?.totalPicketReports || 0} Laporan
                      </span>
                    </div>
                  </div>

                  {/* Ringkasan Kasus Terkini */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-900">
                      Daftar Kasus Pelanggaran Terakhir:
                    </h4>
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="p-2 border border-slate-200">Tanggal</th>
                          <th className="p-2 border border-slate-200">Nama Siswa</th>
                          <th className="p-2 border border-slate-200">Kelas</th>
                          <th className="p-2 border border-slate-200">Jenis Pelanggaran</th>
                          <th className="p-2 border border-slate-200">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {violationsData.slice(0, 8).map((v) => (
                          <tr key={v.id}>
                            <td className="p-2 border border-slate-200">
                              {new Date(v.date).toLocaleDateString('id-ID')}
                            </td>
                            <td className="p-2 border border-slate-200 font-semibold">
                              {v.student?.name}
                            </td>
                            <td className="p-2 border border-slate-200">
                              {v.student?.class?.name || v.class_at_incident}
                            </td>
                            <td className="p-2 border border-slate-200">{v.violation_type}</td>
                            <td className="p-2 border border-slate-200">{v.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tanda Tangan Pengesahan */}
                  <div className="pt-8 flex justify-between text-xs">
                    <div className="w-48 text-center">
                      <p>Mengetahui,</p>
                      <p className="font-semibold">Kepala Sekolah</p>
                      <div className="h-16" />
                      <p className="font-bold underline">H. Syafruddin, S.Pd., M.Pd.</p>
                      <p className="text-[10px] text-slate-500">NIP. 19681231 199412 1 002</p>
                    </div>
                    <div className="w-56 text-center">
                      <p>Bombana, {new Date().toLocaleDateString('id-ID')}</p>
                      <p className="font-semibold">Wakasek Kesiswaan</p>
                      <div className="h-16" />
                      <p className="font-bold underline">{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {user.nip ? `NIP. ${user.nip}` : 'NIP. -'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 11. NOTIFIKASI */}
          {/* ==================================================== */}
          {activeMenu === 'notifications' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Notifikasi Kesiswaan</h3>
                    <p className="text-xs text-slate-500">
                      Pemberitahuan kasus baru dan pengumuman kedinasan sekolah
                    </p>
                  </div>
                  <button
                    onClick={fetchNotifications}
                    className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Segarkan
                  </button>
                </div>

                {notificationsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Memuat notifikasi...
                  </div>
                ) : notificationsError ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                    {notificationsError}
                  </div>
                ) : notificationsData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    Tidak ada notifikasi baru saat ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {notificationsData.map((n) => (
                      <div
                        key={n.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-start gap-3.5 shadow-2xs"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.badgeColor === 'amber'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {n.badgeColor === 'amber' ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(n.date).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 12. PENGATURAN AKUN */}
          {/* ==================================================== */}
          {activeMenu === 'account' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Pengaturan Akun</h3>
                    <p className="text-xs text-slate-500">Perbarui kata sandi akun Wakasek Kesiswaan</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Pejabat:</span>
                    <span className="font-semibold text-slate-800">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Username:</span>
                    <span className="font-mono text-slate-800">{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role Sistem:</span>
                    <span className="font-medium text-emerald-800">Wakasek Kesiswaan</span>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs border border-rose-200">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Kata Sandi Baru (Minimal 6 Karakter)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Ulangi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {passwordLoading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ==================================================== */}
      {/* MODAL: DETAIL SISWA */}
      {/* ==================================================== */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedStudentDetail.name}
                </h3>
                <p className="text-xs text-slate-500">
                  NIS: {selectedStudentDetail.nis || '-'} • NISN: {selectedStudentDetail.nisn || '-'}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">KELAS</span>
                <span className="font-bold text-emerald-800">
                  {selectedStudentDetail.class?.name || 'Belum Ditentukan'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">WALI KELAS</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudentDetail.class?.homeroom_teacher?.name || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ORANG TUA / WALI</span>
                <span className="text-slate-700">{selectedStudentDetail.parent_name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">STATUS AKTIF</span>
                <span className="font-semibold text-emerald-700">Aktif</span>
              </div>
            </div>

            {/* Attendance Summary */}
            <div>
              <h4 className="font-bold text-xs text-slate-900 mb-2">Ringkasan Kehadiran</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                  <span className="block text-[10px] text-teal-700 font-semibold">HADIR</span>
                  <span className="font-bold text-base text-teal-800">
                    {selectedStudentDetail.attendanceSummary?.hadir || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="block text-[10px] text-blue-700 font-semibold">SAKIT</span>
                  <span className="font-bold text-base text-blue-800">
                    {selectedStudentDetail.attendanceSummary?.sakit || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="block text-[10px] text-amber-700 font-semibold">IZIN</span>
                  <span className="font-bold text-base text-amber-800">
                    {selectedStudentDetail.attendanceSummary?.izin || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="block text-[10px] text-rose-700 font-semibold">ALPA</span>
                  <span className="font-bold text-base text-rose-800">
                    {selectedStudentDetail.attendanceSummary?.alpa || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Violations History */}
            <div>
              <h4 className="font-bold text-xs text-slate-900 mb-2">Riwayat Pelanggaran Siswa</h4>
              {selectedStudentDetail.violations?.length === 0 ? (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg text-center">
                  Siswa ini bersih dari catatan pelanggaran.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedStudentDetail.violations.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{v.violation_type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(v.date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{v.description}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <span>Pelapor: {v.reporter?.name || '-'}</span>
                        <span className="font-semibold text-emerald-800">{v.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DETAIL PELANGGARAN & TINDAK LANJUT */}
      {/* ==================================================== */}
      {selectedViolationDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Detail Kasus Pelanggaran
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {selectedViolationDetail.violation_type}
                </h3>
              </div>
              <button
                onClick={() => setSelectedViolationDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Siswa & Pelapor */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">SISWA</span>
                <span className="font-bold text-slate-900">
                  {selectedViolationDetail.student?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">KELAS SAAT KEJADIAN</span>
                <span className="font-semibold text-slate-800">
                  {selectedViolationDetail.class_at_incident}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TANGGAL KEJADIAN</span>
                <span className="text-slate-700">
                  {new Date(selectedViolationDetail.date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PELAPOR AWAL</span>
                <span className="font-semibold text-slate-800">
                  {selectedViolationDetail.reporter?.name} ({selectedViolationDetail.reporter?.role})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PETUGAS PENANGAN</span>
                <span className="font-semibold text-emerald-800">
                  {selectedViolationDetail.handler?.name || 'Belum Ditugaskan'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">STATUS SAAT INI</span>
                <span className="font-bold text-emerald-700">
                  {selectedViolationDetail.status}
                </span>
              </div>
            </div>

            {/* Kronologi */}
            <div>
              <p className="text-[11px] font-bold text-slate-700 uppercase">Uraian / Kronologi:</p>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                {selectedViolationDetail.description}
              </p>
            </div>

            {/* Timeline Tindak Lanjut */}
            <div>
              <p className="text-[11px] font-bold text-slate-700 uppercase mb-2">
                Riwayat Tindak Lanjut Kasus:
              </p>
              {selectedViolationDetail.follow_ups?.length === 0 ? (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg text-center">
                  Belum ada tindakan yang dicatat untuk kasus ini.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedViolationDetail.follow_ups.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-lg border border-slate-200 bg-emerald-50/40 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-900">{f.action_taken}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(f.action_date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      {f.notes && <p className="text-slate-600 italic">"{f.notes}"</p>}
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-emerald-100">
                        <span>Petugas: {f.actor?.name}</span>
                        <span className="font-semibold text-emerald-800">
                          Status: {f.status_after}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Tambah Tindak Lanjut Langsung */}
            <form
              onSubmit={handleAddFollowUp}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
            >
              <p className="text-xs font-bold text-slate-800">
                Tambah Tindakan / Penanganan Kasus
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Tindakan yang Diambil
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pemanggilan Orang Tua, Bimbingan Khusus..."
                    value={followUpActionTaken}
                    onChange={(e) => setFollowUpActionTaken(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Status Kasus Setelahnya
                  </label>
                  <select
                    value={followUpStatusAfter}
                    onChange={(e) => setFollowUpStatusAfter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600"
                  >
                    <option value="Dalam Penanganan">Dalam Penanganan</option>
                    <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                    <option value="Selesai">Selesai (Kasus Tuntas)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Catatan Perkembangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan hasil pembinaan atau tindak lanjut..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={followUpSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50"
                >
                  {followUpSubmitting ? 'Menyimpan...' : 'Simpan Tindakan'}
                </button>
              </div>
            </form>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedViolationDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VERIFIKASI ABSENSI */}
      {/* ==================================================== */}
      {verifyingAttendanceId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Verifikasi Rekap Absensi Siswa
              </h3>
              <button
                onClick={() => setVerifyingAttendanceId(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Pilih Keputusan Status
                </label>
                <select
                  value={verifyStatusAction}
                  onChange={(e) => setVerifyStatusAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="Diverifikasi">Diverifikasi (Sudah Ditinjau Kesiswaan)</option>
                  <option value="Disetujui">Disetujui (Sah & Final)</option>
                  <option value="Dikembalikan">Dikembalikan (Perlu Perbaikan Guru)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Catatan Verifikasi (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Beri arahan atau catatan untuk guru mata pelajaran..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyingAttendanceId(null)}
                  className="px-3.5 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={verifySubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {verifySubmitting ? 'Memproses...' : 'Simpan Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PENCATATAN PELANGGARAN BARU */}
      {/* ==================================================== */}
      {showAddViolationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-700" />
                Catat Pelanggaran Siswa Baru
              </h3>
              <button
                onClick={() => setShowAddViolationModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateViolation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Pilih Siswa (Dari Master Data) *
                </label>
                <select
                  value={newViolationStudentId}
                  onChange={(e) => setNewViolationStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600 font-medium"
                  required
                >
                  <option value="">-- Pilih Siswa Terdaftar --</option>
                  {studentsData.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class?.name || 'Tanpa Kelas'}) - NIS: {s.nis || '-'}
                    </option>
                  ))}
                </select>
                {studentsData.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Buka menu "Data Siswa" terlebih dahulu untuk memuat master siswa.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kategori Pelanggaran *
                  </label>
                  <select
                    value={newViolationType}
                    onChange={(e) => setNewViolationType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="Kedisiplinan">Kedisiplinan</option>
                    <option value="Atribut & Seragam">Atribut & Seragam</option>
                    <option value="Keterlambatan">Keterlambatan</option>
                    <option value="Perilaku & Sikap">Perilaku & Sikap</option>
                    <option value="Merokok / Zat Terlarang">Merokok / Zat Terlarang</option>
                    <option value="Bolos Pelajaran">Bolos Pelajaran</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Waktu Kejadian</label>
                  <input
                    type="text"
                    placeholder="Contoh: 07:15 WITA"
                    value={newViolationTime}
                    onChange={(e) => setNewViolationTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Lokasi Kejadian</label>
                <input
                  type="text"
                  placeholder="Contoh: Gerbang Sekolah, Lapangan, Kantin..."
                  value={newViolationLocation}
                  onChange={(e) => setNewViolationLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Uraian Kejadian / Kronologi *
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan secara jelas kronologi pelanggaran yang dilakukan..."
                  value={newViolationDescription}
                  onChange={(e) => setNewViolationDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Tindakan Awal yang Diambil
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Diberi teguran lisan, diminta memakai atribut lengkap..."
                  value={newViolationInitialAction}
                  onChange={(e) => setNewViolationInitialAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddViolationModal(false)}
                  className="px-3.5 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={newViolationSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {newViolationSubmitting ? 'Menyimpan...' : 'Simpan Kasus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GalleryManagementModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        userRole={user.role}
      />
    </div>
  );
}
