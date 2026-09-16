'use client';

import React, { useState, useEffect } from 'react';
import LogoutButton from './LogoutButton';
import { UserRole } from '@/lib/constants';
import {
  HeartHandshake,
  Users,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Plus,
  X,
  ChevronRight,
  Shield,
  Eye,
  Calendar,
  Lock,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Award,
  Bell,
  Settings,
  Menu,
  Phone,
  MapPin,
  GraduationCap,
  MessageSquare,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
  };
}

type BKTab =
  | 'dashboard'
  | 'siswa'
  | 'pelanggaran'
  | 'bimbingan'
  | 'tindak-lanjut'
  | 'statistik'
  | 'notifikasi'
  | 'pengaturan';

export default function BKView({ user }: Props) {
  const [activeTab, setActiveTab] = useState<BKTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Data States
  const [stats, setStats] = useState({
    totalStudents: 0,
    newCases: 0,
    inProgressCases: 0,
    followUpNeededCases: 0,
    resolvedCases: 0,
    totalCounselings: 0,
    totalCases: 0,
  });
  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [recentCounselings, setRecentCounselings] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Students State
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [isLoadingStudentDetail, setIsLoadingStudentDetail] = useState(false);

  // Violations State
  const [violations, setViolations] = useState<any[]>([]);
  const [violationStatusFilter, setViolationStatusFilter] = useState('all');
  const [violationClassFilter, setViolationClassFilter] = useState('all');
  const [violationSearch, setViolationSearch] = useState('');
  const [isLoadingViolations, setIsLoadingViolations] = useState(false);
  const [selectedViolationDetail, setSelectedViolationDetail] = useState<any | null>(null);
  const [isLoadingViolationDetail, setIsLoadingViolationDetail] = useState(false);

  // Counselings State
  const [counselings, setCounselings] = useState<any[]>([]);
  const [counselingTypeFilter, setCounselingTypeFilter] = useState('all');
  const [isLoadingCounselings, setIsLoadingCounselings] = useState(false);

  // Classes State
  const [classes, setClasses] = useState<any[]>([]);

  // Modals State
  const [isCreateViolationModalOpen, setIsCreateViolationModalOpen] = useState(false);
  const [isCreateCounselingModalOpen, setIsCreateCounselingModalOpen] = useState(false);
  const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] = useState(false);

  // Forms
  const [violationForm, setViolationForm] = useState({
    student_id: '',
    violation_type: 'Kedisiplinan',
    description: '',
    location: '',
    initial_action: '',
  });

  const [counselingForm, setCounselingForm] = useState({
    student_id: '',
    guidance_type: 'Pribadi',
    problem_statement: '',
    counseling_result: '',
    recommendation: '',
    follow_up: '',
    status: 'Proses',
  });

  const [studentForm, setStudentForm] = useState({
    name: '',
    nis: '',
    nisn: '',
    gender: 'L',
    class_id: '',
    parent_name: '',
    parent_phone: '',
    address: '',
  });

  // Action / Follow-up Form
  const [handlingForm, setHandlingForm] = useState({
    status: 'Dalam Penanganan',
    handling_notes: '',
    action_taken: '',
    notes: '',
  });

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Feedback Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Dashboard Stats
  const fetchDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch('/api/bk/dashboard');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setRecentViolations(data.recentViolations || []);
        setRecentCounselings(data.recentCounselings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Fetch Classes
  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/bk/classes');
      const data = await res.json();
      if (res.ok) {
        setClasses(data.classes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Students
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      if (studentSearch) params.set('q', studentSearch);
      if (studentClassFilter && studentClassFilter !== 'all') params.set('class_id', studentClassFilter);

      const res = await fetch(`/api/bk/students?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Fetch Violations
  const fetchViolations = async () => {
    setIsLoadingViolations(true);
    try {
      const params = new URLSearchParams();
      if (violationStatusFilter && violationStatusFilter !== 'all') params.set('status', violationStatusFilter);
      if (violationClassFilter && violationClassFilter !== 'all') params.set('class_id', violationClassFilter);
      if (violationSearch) params.set('q', violationSearch);

      const res = await fetch(`/api/bk/violations?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setViolations(data.violations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingViolations(false);
    }
  };

  // Fetch Counselings
  const fetchCounselings = async () => {
    setIsLoadingCounselings(true);
    try {
      const params = new URLSearchParams();
      if (counselingTypeFilter && counselingTypeFilter !== 'all') params.set('type', counselingTypeFilter);

      const res = await fetch(`/api/bk/counseling?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCounselings(data.counselings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCounselings(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (activeTab === 'siswa') {
      fetchStudents();
    } else if (activeTab === 'pelanggaran' || activeTab === 'tindak-lanjut') {
      fetchViolations();
    } else if (activeTab === 'bimbingan') {
      fetchCounselings();
    }
  }, [activeTab, studentSearch, studentClassFilter, violationStatusFilter, violationClassFilter, violationSearch, counselingTypeFilter]);

  // View Student Detail
  const openStudentDetail = async (studentId: string) => {
    setIsLoadingStudentDetail(true);
    setSelectedStudentDetail(null);
    try {
      const res = await fetch(`/api/bk/students/${studentId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedStudentDetail(data.student);
      } else {
        showToast(data.error || 'Gagal memuat detail siswa', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsLoadingStudentDetail(false);
    }
  };

  // View Violation Detail
  const openViolationDetail = async (violationId: string) => {
    setIsLoadingViolationDetail(true);
    setSelectedViolationDetail(null);
    try {
      const res = await fetch(`/api/bk/violations/${violationId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedViolationDetail(data.violation);
        setHandlingForm({
          status: data.violation.status || 'Dalam Penanganan',
          handling_notes: data.violation.handling_notes || '',
          action_taken: '',
          notes: '',
        });
      } else {
        showToast(data.error || 'Gagal memuat detail kasus', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsLoadingViolationDetail(false);
    }
  };

  // Handle Save Violation
  const handleSaveViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationForm.student_id || !violationForm.description) {
      showToast('Pilih siswa dan isi deskripsi pelanggaran', 'error');
      return;
    }

    try {
      const res = await fetch('/api/bk/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violationForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pelanggaran berhasil dilaporkan');
        setIsCreateViolationModalOpen(false);
        setViolationForm({
          student_id: '',
          violation_type: 'Kedisiplinan',
          description: '',
          location: '',
          initial_action: '',
        });
        fetchViolations();
        fetchDashboardData();
      } else {
        showToast(data.error || 'Gagal menyimpan laporan', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Handle Update Handling
  const handleUpdateHandling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedViolationDetail) return;

    try {
      const res = await fetch(`/api/bk/violations/${selectedViolationDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handlingForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Penanganan kasus berhasil diperbarui');
        openViolationDetail(selectedViolationDetail.id);
        fetchViolations();
        fetchDashboardData();
      } else {
        showToast(data.error || 'Gagal memperbarui kasus', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Handle Save Counseling
  const handleSaveCounseling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselingForm.student_id || !counselingForm.problem_statement || !counselingForm.counseling_result) {
      showToast('Lengkapi data bimbingan konseling', 'error');
      return;
    }

    try {
      const res = await fetch('/api/bk/counseling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(counselingForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Catatan bimbingan konseling berhasil disimpan');
        setIsCreateCounselingModalOpen(false);
        setCounselingForm({
          student_id: '',
          guidance_type: 'Pribadi',
          problem_statement: '',
          counseling_result: '',
          recommendation: '',
          follow_up: '',
          status: 'Proses',
        });
        fetchCounselings();
        fetchDashboardData();
      } else {
        showToast(data.error || 'Gagal menyimpan bimbingan', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Handle Save Student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim()) {
      showToast('Nama siswa wajib diisi', 'error');
      return;
    }

    try {
      const res = await fetch('/api/bk/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Data siswa berhasil ditambahkan');
        setIsCreateStudentModalOpen(false);
        setStudentForm({
          name: '',
          nis: '',
          nisn: '',
          gender: 'L',
          class_id: '',
          parent_name: '',
          parent_phone: '',
          address: '',
        });
        fetchStudents();
        fetchDashboardData();
      } else {
        showToast(data.error || 'Gagal menambahkan siswa', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password berhasil diperbarui.' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Gagal memperbarui password.' });
      }
    } catch (e) {
      setPasswordMsg({ type: 'error', text: 'Terjadi kesalahan server.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Dilaporkan':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Dilaporkan
          </span>
        );
      case 'Dalam Penanganan':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Dalam Penanganan
          </span>
        );
      case 'Perlu Tindak Lanjut':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Perlu Tindak Lanjut
          </span>
        );
      case 'Selesai':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Utama Guru BK */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm shadow-rose-100">
              <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 tracking-wider uppercase">
                  Bimbingan & Konseling
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400">• SMAN 18 Bombana</span>
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {user.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <span>Lihat Website</span>
            </a>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

          {/* Sidebar Navigasi (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-2 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm h-fit sticky top-28">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Menu Utama BK
            </div>

            {[
              { id: 'dashboard', label: 'Dashboard', icon: HeartHandshake },
              { id: 'siswa', label: 'Data Siswa', icon: Users },
              { id: 'pelanggaran', label: 'Pelanggaran Siswa', icon: AlertTriangle },
              { id: 'bimbingan', label: 'Bimbingan & Konseling', icon: MessageSquare },
              { id: 'tindak-lanjut', label: 'Tindak Lanjut', icon: Clock },
              { id: 'statistik', label: 'Rekap & Statistik', icon: TrendingUp },
              { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
              { id: 'pengaturan', label: 'Pengaturan Akun', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as BKTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'pelanggaran' && stats.newCases > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {stats.newCases}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Drawer Navigasi (Mobile) */}
          {isMobileNavOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setIsMobileNavOpen(false)}
              />
              <div className="relative w-72 max-w-[80vw] bg-white h-full p-6 shadow-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <HeartHandshake className="w-5 h-5 text-rose-600" />
                      <span>Portal Guru BK</span>
                    </div>
                    <button onClick={() => setIsMobileNavOpen(false)}>
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <nav className="space-y-1">
                    {[
                      { id: 'dashboard', label: 'Dashboard', icon: HeartHandshake },
                      { id: 'siswa', label: 'Data Siswa', icon: Users },
                      { id: 'pelanggaran', label: 'Pelanggaran Siswa', icon: AlertTriangle },
                      { id: 'bimbingan', label: 'Bimbingan & Konseling', icon: MessageSquare },
                      { id: 'tindak-lanjut', label: 'Tindak Lanjut', icon: Clock },
                      { id: 'statistik', label: 'Rekap & Statistik', icon: TrendingUp },
                      { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
                      { id: 'pengaturan', label: 'Pengaturan Akun', icon: Settings },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id as BKTab);
                            setIsMobileNavOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                            isActive
                              ? 'bg-rose-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <LogoutButton className="w-full justify-center" />
                </div>
              </div>
            </div>
          )}

          {/* Konten Tab Dinamis */}
          <main className="lg:col-span-9 space-y-6">

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Banner Selamat Datang */}
                <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-950/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="relative z-10 space-y-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur text-white border border-white/20 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Pusat Pelayanan & Pembimbingan Karakter Siswa
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      Selamat Bertugas, {user.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
                      Layanan Bimbingan dan Konseling SMA Negeri 18 Bombana terintegrasi dalam Satu Data Terpusat. Pantau perkembangan, catat bimbingan, dan koordinasikan penanganan bersama dewan guru dan orang tua.
                    </p>
                    <div className="pt-3 flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setIsCreateViolationModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 shadow-md transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Laporkan Pelanggaran
                      </button>
                      <button
                        onClick={() => setIsCreateCounselingModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-rose-800/80 hover:bg-rose-900 text-white font-bold text-xs border border-white/20 transition-all inline-flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Catat Bimbingan Baru
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Kartu Statistik Riil */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Siswa Binaan</span>
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900">{stats.totalStudents}</div>
                    <p className="text-[11px] text-slate-500">Total siswa terdata</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-1 bg-gradient-to-b from-amber-50/40 to-white">
                    <div className="flex items-center justify-between text-amber-600">
                      <span className="text-xs font-bold uppercase tracking-wider">Kasus Baru</span>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-extrabold text-amber-700">{stats.newCases}</div>
                    <p className="text-[11px] text-amber-600">Perlu penanganan</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-sm space-y-1 bg-gradient-to-b from-blue-50/40 to-white">
                    <div className="flex items-center justify-between text-blue-600">
                      <span className="text-xs font-bold uppercase tracking-wider">Diproses</span>
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-extrabold text-blue-700">{stats.inProgressCases}</div>
                    <p className="text-[11px] text-blue-600">Dalam penanganan</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-sm space-y-1 bg-gradient-to-b from-emerald-50/40 to-white">
                    <div className="flex items-center justify-between text-emerald-600">
                      <span className="text-xs font-bold uppercase tracking-wider">Kasus Selesai</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-700">{stats.resolvedCases}</div>
                    <p className="text-[11px] text-emerald-600">Telah diselesaikan</p>
                  </div>
                </div>

                {/* Kasus Perlu Tindak Lanjut Alert */}
                {stats.followUpNeededCases > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-semibold">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        Terdapat <strong>{stats.followUpNeededCases} kasus</strong> yang ditandai membutuhkan tindak lanjut khusus (panggilan ortu / pembinaan).
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setViolationStatusFilter('Perlu Tindak Lanjut');
                        setActiveTab('pelanggaran');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shrink-0"
                    >
                      Lihat Kasus
                    </button>
                  </div>
                )}

                {/* Grid Kasus Terbaru & Sesi Bimbingan */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Kasus Pelanggaran Terbaru */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Pelanggaran Siswa Terbaru</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('pelanggaran')}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Lihat Semua
                      </button>
                    </div>

                    {isLoadingDashboard ? (
                      <div className="py-8 text-center text-xs text-slate-400">Memuat kasus terbaru...</div>
                    ) : recentViolations.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                        Belum ada data pelanggaran siswa yang dilaporkan.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {recentViolations.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => openViolationDetail(v.id)}
                            className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 cursor-pointer transition-colors flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {v.student?.name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({v.class_at_incident})
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-1">{v.description}</p>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>Pelapor: {v.reporter?.name}</span>
                                <span>•</span>
                                <span>{new Date(v.date).toLocaleDateString('id-ID')}</span>
                              </div>
                            </div>
                            <div>{getStatusBadge(v.status)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sesi Bimbingan Terbaru */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-teal-600" />
                        <span>Sesi Bimbingan Terkini</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('bimbingan')}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                      >
                        Lihat Semua
                      </button>
                    </div>

                    {isLoadingDashboard ? (
                      <div className="py-8 text-center text-xs text-slate-400">Memuat sesi bimbingan...</div>
                    ) : recentCounselings.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                        Belum ada catatan bimbingan konseling tersimpan.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {recentCounselings.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {c.student?.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                  {c.guidance_type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-1">{c.problem_statement}</p>
                              <div className="text-[10px] text-slate-400">
                                {new Date(c.date).toLocaleDateString('id-ID')} • Konselor: {c.counselor?.name}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DATA SISWA */}
            {activeTab === 'siswa' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Data Siswa Binaan</h2>
                    <p className="text-xs text-slate-500">
                      Pencarian profil siswa, riwayat kasus pelanggaran, dan catatan konseling.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateStudentModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Tambah Siswa
                  </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Cari nama, NIS, NISN siswa..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={studentClassFilter}
                      onChange={(e) => setStudentClassFilter(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="all">Semua Kelas</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Kelas {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tabel Siswa */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Siswa</th>
                          <th className="py-3.5 px-6">NIS / NISN</th>
                          <th className="py-3.5 px-6">Kelas</th>
                          <th className="py-3.5 px-6">Pelanggaran</th>
                          <th className="py-3.5 px-6 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {isLoadingStudents ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400">
                              Memuat data siswa...
                            </td>
                          </tr>
                        ) : students.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400">
                              Tidak ada data siswa yang sesuai.
                            </td>
                          </tr>
                        ) : (
                          students.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 px-6">
                                <div
                                  onClick={() => openStudentDetail(st.id)}
                                  className="font-bold text-slate-900 hover:text-rose-600 cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>{st.name}</span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Gender: {st.gender === 'L' ? 'Laki-laki' : st.gender === 'P' ? 'Perempuan' : '-'}
                                </div>
                              </td>

                              <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                                {st.nis || '-'}{st.nisn ? ` / ${st.nisn}` : ''}
                              </td>

                              <td className="py-4 px-6">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {st.class?.name || 'Belum Terdaftar'}
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                {st._count?.violations > 0 ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    {st._count.violations} Kasus
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                    0 Kasus
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => openStudentDetail(st.id)}
                                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Profil & Riwayat
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PELANGGARAN SISWA */}
            {activeTab === 'pelanggaran' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      Satu Data Terpusat Pelanggaran Siswa
                    </h2>
                    <p className="text-xs text-slate-500">
                      Seluruh kasus pelanggaran yang dilaporkan guru, guru piket, maupun Guru BK secara transparan.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateViolationModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Laporkan Pelanggaran
                  </button>
                </div>

                {/* Filter & Pencarian Pelanggaran */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={violationSearch}
                      onChange={(e) => setViolationSearch(e.target.value)}
                      placeholder="Cari siswa, pelanggaran, lokasi..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                      value={violationStatusFilter}
                      onChange={(e) => setViolationStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="all">Semua Status</option>
                      <option value="Dilaporkan">Dilaporkan</option>
                      <option value="Dalam Penanganan">Dalam Penanganan</option>
                      <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                      <option value="Selesai">Selesai</option>
                    </select>

                    <select
                      value={violationClassFilter}
                      onChange={(e) => setViolationClassFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="all">Semua Kelas</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Kelas {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Daftar Kasus Pelanggaran */}
                <div className="space-y-3">
                  {isLoadingViolations ? (
                    <div className="bg-white p-12 text-center rounded-3xl text-xs text-slate-400">
                      Memuat daftar pelanggaran terpusat...
                    </div>
                  ) : violations.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
                      Belum ada data pelanggaran yang sesuai dengan filter.
                    </div>
                  ) : (
                    violations.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:border-rose-200 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => openStudentDetail(v.student_id)}
                              className="text-sm font-bold text-slate-900 hover:text-rose-600 cursor-pointer"
                            >
                              {v.student?.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              Kelas {v.class_at_incident}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              {v.violation_type}
                            </span>
                          </div>
                          <div>{getStatusBadge(v.status)}</div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {v.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                          <div className="flex flex-wrap items-center gap-3 text-[11px]">
                            <span>
                              Dilaporkan oleh: <strong>{v.reporter?.name}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Ditangani: <strong>{v.handler?.name || 'Belum Ditangani'}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(v.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {v.time ? ` • ${v.time}` : ''}
                            </span>
                          </div>

                          <button
                            onClick={() => openViolationDetail(v.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs text-slate-700 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Detail & Tindak Lanjut</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: BIMBINGAN & KONSELING */}
            {activeTab === 'bimbingan' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      Layanan Bimbingan & Konseling (BK)
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Data rahasia & terlindungi. Khusus diakses oleh Guru BK yang berwenang.</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateCounselingModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Catat Sesi Bimbingan
                  </button>
                </div>

                {/* Filter Bimbingan */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">Bidang Bimbingan:</span>
                  <select
                    value={counselingTypeFilter}
                    onChange={(e) => setCounselingTypeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="all">Semua Bidang</option>
                    <option value="Pribadi">Bimbingan Pribadi</option>
                    <option value="Sosial">Bimbingan Sosial</option>
                    <option value="Belajar">Bimbingan Belajar</option>
                    <option value="Karir">Bimbingan Karir</option>
                  </select>
                </div>

                {/* Daftar Sesi Bimbingan */}
                <div className="space-y-3">
                  {isLoadingCounselings ? (
                    <div className="bg-white p-12 text-center rounded-3xl text-xs text-slate-400">
                      Memuat catatan bimbingan konseling...
                    </div>
                  ) : counselings.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
                      Belum ada sesi bimbingan konseling yang tercatat.
                    </div>
                  ) : (
                    counselings.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => openStudentDetail(c.student_id)}
                              className="font-bold text-slate-900 text-sm hover:text-rose-600 cursor-pointer"
                            >
                              {c.student?.name}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {c.guidance_type}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(c.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                            <span className="font-bold text-slate-700">Pokok Masalah:</span>
                            <p className="text-slate-600">{c.problem_statement}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                            <span className="font-bold text-slate-700">Hasil Konseling:</span>
                            <p className="text-slate-600">{c.counseling_result}</p>
                          </div>
                        </div>

                        {c.recommendation && (
                          <div className="text-xs text-slate-600 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60">
                            <strong>Rekomendasi:</strong> {c.recommendation}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                          <span>Konselor: {c.counselor?.name}</span>
                          <span className="font-semibold text-slate-600">Status: {c.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: TINDAK LANJUT */}
            {activeTab === 'tindak-lanjut' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Monitoring Kasus Perlu Tindak Lanjut
                  </h2>
                  <p className="text-xs text-slate-500">
                    Daftar kasus siswa yang memerlukan pendampingan berkelanjutan, pemanggilan orang tua, atau konferensi kasus.
                  </p>
                </div>

                <div className="space-y-3">
                  {violations.filter(
                    (v) => v.status === 'Perlu Tindak Lanjut' || v.status === 'Dalam Penanganan'
                  ).length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
                      Tidak ada kasus yang sedang membutuhkan tindak lanjut saat ini.
                    </div>
                  ) : (
                    violations
                      .filter(
                        (v) => v.status === 'Perlu Tindak Lanjut' || v.status === 'Dalam Penanganan'
                      )
                      .map((v) => (
                        <div
                          key={v.id}
                          className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {v.student?.name} ({v.class_at_incident})
                              </span>
                              {getStatusBadge(v.status)}
                            </div>
                            <button
                              onClick={() => openViolationDetail(v.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                            >
                              Beri Tindakan
                            </button>
                          </div>
                          <p className="text-xs text-slate-600">{v.description}</p>
                          <div className="text-[11px] text-slate-400">
                            Terakhir ditangani oleh: <strong>{v.handler?.name || 'Belum ada'}</strong>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: REKAP & STATISTIK */}
            {activeTab === 'statistik' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Rekap & Statistik Pelayanan BK
                  </h2>
                  <p className="text-xs text-slate-500">
                    Analisis data penanganan kasus dan ketercapaian pembimbingan siswa SMAN 18 Bombana.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Ringkasan Status Kasus</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Dilaporkan (Belum Ditangani):</span>
                        <span className="font-bold text-amber-700">{stats.newCases} Kasus</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Dalam Penanganan:</span>
                        <span className="font-bold text-blue-700">{stats.inProgressCases} Kasus</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Perlu Tindak Lanjut Khusus:</span>
                        <span className="font-bold text-rose-700">{stats.followUpNeededCases} Kasus</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Selesai / Terbina:</span>
                        <span className="font-bold text-emerald-700">{stats.resolvedCases} Kasus</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-slate-900">
                        <span>Total Seluruh Kasus:</span>
                        <span>{stats.totalCases} Kasus</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Efektivitas Penyelesaian Kasus</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Tingkat Penyelesaian:</span>
                        <span className="font-bold text-slate-900">
                          {stats.totalCases > 0
                            ? `${Math.round((stats.resolvedCases / stats.totalCases) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats.totalCases > 0
                                ? Math.round((stats.resolvedCases / stats.totalCases) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Statistik dihitung secara real-time berdasarkan riwayat penanganan kasus yang telah diselesaikan oleh Guru BK dan petugas terkait.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: NOTIFIKASI */}
            {activeTab === 'notifikasi' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Notifikasi Masuk</h2>
                  <p className="text-xs text-slate-500">Pemberitahuan laporan kasus baru dari Guru Piket / Guru Mapel.</p>
                </div>

                <div className="space-y-3">
                  {recentViolations.filter((v) => v.status === 'Dilaporkan').length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
                      Tidak ada notifikasi laporan baru yang belum ditangani.
                    </div>
                  ) : (
                    recentViolations
                      .filter((v) => v.status === 'Dilaporkan')
                      .map((v) => (
                        <div
                          key={v.id}
                          className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                              <Bell className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900">
                                Laporan Kasus: {v.student?.name} ({v.class_at_incident})
                              </div>
                              <div className="text-xs text-slate-500">
                                Dilaporkan oleh {v.reporter?.name} • {new Date(v.date).toLocaleDateString('id-ID')}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => openViolationDetail(v.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
                          >
                            Proses Kasus
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 8: PENGATURAN AKUN */}
            {activeTab === 'pengaturan' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Pengaturan Akun Guru BK</h2>
                  <p className="text-xs text-slate-500">Kelola informasi kredensial dan keamanan akun Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card Informasi Akun */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-rose-600" />
                      <span>Informasi Akun</span>
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Nama Lengkap</span>
                        <span className="font-bold text-slate-800 text-sm">{user.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Username</span>
                        <span className="font-mono text-slate-800">@{user.username}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email</span>
                        <span className="text-slate-800">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Hak Akses</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Guru BK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Ganti Password */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-600" />
                      <span>Ganti Password Mandiri</span>
                    </h3>

                    {passwordMsg.text && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                          passwordMsg.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {passwordMsg.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span>{passwordMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password Lama
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.oldPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                          placeholder="Masukkan password saat ini"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password Baru (Minimal 6 karakter)
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Password baru"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ulangi Password Baru
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Ketik ulang password baru"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
                      >
                        {isSavingPassword ? 'Menyimpan...' : 'Perbarui Password'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL 1: DETAIL PROFIL SISWA & RIWAYAT PELANGGARAN */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-extrabold text-lg">
                  {selectedStudentDetail.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {selectedStudentDetail.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    NIS: {selectedStudentDetail.nis || '-'} • NISN: {selectedStudentDetail.nisn || '-'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profil Singkat */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Kelas</span>
                <span className="font-bold text-slate-800">
                  {selectedStudentDetail.class?.name || 'Belum Terdaftar'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Wali Kelas</span>
                <span className="font-bold text-slate-800">
                  {selectedStudentDetail.class?.homeroom_teacher?.name || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Jenis Kelamin</span>
                <span className="font-bold text-slate-800">
                  {selectedStudentDetail.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
              {selectedStudentDetail.parent_phone && (
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">Kontak Orang Tua (Rahasia)</span>
                  <span className="font-mono text-slate-800">{selectedStudentDetail.parent_phone}</span>
                </div>
              )}
            </div>

            {/* Riwayat Pelanggaran Siswa */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Riwayat Pelanggaran Terpusat</span>
              </h4>

              {selectedStudentDetail.violations?.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  Siswa ini belum memiliki catatan pelanggaran.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedStudentDetail.violations?.map((v: any) => (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedStudentDetail(null);
                        openViolationDetail(v.id);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/50 border border-slate-200/80 cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <span>{v.violation_type}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({new Date(v.date).toLocaleDateString('id-ID')})
                          </span>
                        </div>
                        {getStatusBadge(v.status)}
                      </div>
                      <p className="text-xs text-slate-600">{v.description}</p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Dilaporkan oleh: {v.reporter?.name}</span>
                        <span>•</span>
                        <span>Penanganan: {v.handler?.name || 'Belum ada'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Riwayat Konseling (Jika Ada) */}
            {selectedStudentDetail.counselings?.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>Riwayat Bimbingan Konseling</span>
                </h4>
                <div className="space-y-2">
                  {selectedStudentDetail.counselings.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-2xl bg-teal-50/50 border border-teal-200/60 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-teal-900">
                        <span>Bimbingan {c.guidance_type}</span>
                        <span className="text-[10px] font-normal text-teal-700">
                          {new Date(c.date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <p className="text-slate-700">{c.problem_statement}</p>
                      <p className="text-[11px] text-teal-800">
                        <strong>Hasil:</strong> {c.counseling_result}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL KASUS PELANGGARAN & FORM TINDAK LANJUT */}
      {selectedViolationDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                  Detail Kasus Pelanggaran Terpusat
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedViolationDetail.student?.name} ({selectedViolationDetail.class_at_incident})
                </h3>
              </div>
              <button
                onClick={() => setSelectedViolationDetail(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informasi Utama Kasus */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Tanggal Kejadian</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedViolationDetail.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {selectedViolationDetail.time ? ` ${selectedViolationDetail.time}` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Jenis Pelanggaran</span>
                <span className="font-bold text-rose-700">{selectedViolationDetail.violation_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Lokasi</span>
                <span className="font-bold text-slate-800">{selectedViolationDetail.location || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Pelapor (Reporter)</span>
                <span className="font-bold text-slate-800">{selectedViolationDetail.reporter?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Petugas Penanganan (Handler)</span>
                <span className="font-bold text-blue-700">{selectedViolationDetail.handler?.name || 'Belum ada'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Status Kasus</span>
                <div>{getStatusBadge(selectedViolationDetail.status)}</div>
              </div>
            </div>

            {/* Uraian Kronologi Kejadian */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Uraian Kronologi:
              </span>
              <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
                {selectedViolationDetail.description}
              </p>
            </div>

            {/* Tindakan Awal Pelapor */}
            {selectedViolationDetail.initial_action && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tindakan Awal oleh Pelapor:
                </span>
                <p className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                  {selectedViolationDetail.initial_action}
                </p>
              </div>
            )}

            {/* Riwayat Catatan Tindak Lanjut (Audit Trail) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Riwayat Tindak Lanjut (Audit Trail):</span>
              </h4>

              {selectedViolationDetail.follow_ups?.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                  Belum ada catatan tindak lanjut tambahan.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedViolationDetail.follow_ups?.map((f: any) => (
                    <div key={f.id} className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/60 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-blue-900">
                        <span>{f.action_taken}</span>
                        <span className="text-[10px] text-blue-600 font-normal">
                          {new Date(f.action_date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      {f.notes && <p className="text-slate-600">{f.notes}</p>}
                      <div className="text-[10px] text-slate-400">Petugas: {f.actor?.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Perbarui Kasus & Tambah Tindakan */}
            <form onSubmit={handleUpdateHandling} className="space-y-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Perbarui Status & Tambah Tindak Lanjut:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Kasus
                  </label>
                  <select
                    value={handlingForm.status}
                    onChange={(e) => setHandlingForm({ ...handlingForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Dalam Penanganan">Dalam Penanganan</option>
                    <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                    <option value="Selesai">Selesai (Kasus Ditutup)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tindakan yang Diambil
                  </label>
                  <input
                    type="text"
                    value={handlingForm.action_taken}
                    onChange={(e) => setHandlingForm({ ...handlingForm, action_taken: e.target.value })}
                    placeholder="Contoh: Konseling khusus, panggilan ortu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penanganan
                </label>
                <textarea
                  rows={2}
                  value={handlingForm.handling_notes}
                  onChange={(e) => setHandlingForm({ ...handlingForm, handling_notes: e.target.value })}
                  placeholder="Ketik catatan hasil pembinaan atau instruksi tindak lanjut..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
                >
                  Simpan Penanganan Kasus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LAPORKAN PELANGGARAN BARU */}
      {isCreateViolationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Laporkan Pelanggaran Siswa</span>
              </h3>
              <button onClick={() => setIsCreateViolationModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveViolation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa</label>
                <select
                  required
                  value={violationForm.student_id}
                  onChange={(e) => setViolationForm({ ...violationForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.class?.name || 'Tanpa Kelas'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Pelanggaran</label>
                <select
                  value={violationForm.violation_type}
                  onChange={(e) => setViolationForm({ ...violationForm, violation_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Kedisiplinan">Kedisiplinan (Terlambat, dsb)</option>
                  <option value="Atribut">Atribut & Kerapian Seragam</option>
                  <option value="Membolos">Membolos / Keluar Tanpa Izin</option>
                  <option value="Ketertiban">Ketertiban Sekolah</option>
                  <option value="Perilaku">Perilaku / Etika</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lokasi Kejadian</label>
                <input
                  type="text"
                  value={violationForm.location}
                  onChange={(e) => setViolationForm({ ...violationForm, location: e.target.value })}
                  placeholder="Contoh: Gerbang sekolah, kantin, ruang kelas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Kronologi Kejadian</label>
                <textarea
                  required
                  rows={3}
                  value={violationForm.description}
                  onChange={(e) => setViolationForm({ ...violationForm, description: e.target.value })}
                  placeholder="Jelaskan secara jelas kronologi pelanggaran yang terjadi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tindakan Awal Pelapor</label>
                <input
                  type="text"
                  value={violationForm.initial_action}
                  onChange={(e) => setViolationForm({ ...violationForm, initial_action: e.target.value })}
                  placeholder="Contoh: Diberi teguran lisan, diarahkan ke ruang BK"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateViolationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CATAT SESI BIMBINGAN BK BARU */}
      {isCreateCounselingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <span>Catat Sesi Bimbingan & Konseling</span>
              </h3>
              <button onClick={() => setIsCreateCounselingModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCounseling} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Siswa</label>
                  <select
                    required
                    value={counselingForm.student_id}
                    onChange={(e) => setCounselingForm({ ...counselingForm, student_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.class?.name || 'Tanpa Kelas'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bidang Bimbingan</label>
                  <select
                    value={counselingForm.guidance_type}
                    onChange={(e) => setCounselingForm({ ...counselingForm, guidance_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Pribadi">Bimbingan Pribadi</option>
                    <option value="Sosial">Bimbingan Sosial</option>
                    <option value="Belajar">Bimbingan Belajar</option>
                    <option value="Karir">Bimbingan Karir</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pokok Permasalahan</label>
                <textarea
                  required
                  rows={2}
                  value={counselingForm.problem_statement}
                  onChange={(e) => setCounselingForm({ ...counselingForm, problem_statement: e.target.value })}
                  placeholder="Ketik permasalahan yang dibahas dalam sesi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hasil Konseling</label>
                <textarea
                  required
                  rows={2}
                  value={counselingForm.counseling_result}
                  onChange={(e) => setCounselingForm({ ...counselingForm, counseling_result: e.target.value })}
                  placeholder="Catatan hasil diskusi dan respon siswa..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rekomendasi</label>
                  <input
                    type="text"
                    value={counselingForm.recommendation}
                    onChange={(e) => setCounselingForm({ ...counselingForm, recommendation: e.target.value })}
                    placeholder="Contoh: Konsultasi wali kelas"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rencana Tindak Lanjut</label>
                  <input
                    type="text"
                    value={counselingForm.follow_up}
                    onChange={(e) => setCounselingForm({ ...counselingForm, follow_up: e.target.value })}
                    placeholder="Contoh: Monitoring mingguan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCounselingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20"
                >
                  Simpan Bimbingan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: TAMBAH SISWA BARU */}
      {isCreateStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                <span>Tambah Siswa Binaan</span>
              </h3>
              <button onClick={() => setIsCreateStudentModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="Contoh: Ahmad Fadilah"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS</label>
                  <input
                    type="text"
                    value={studentForm.nis}
                    onChange={(e) => setStudentForm({ ...studentForm, nis: e.target.value })}
                    placeholder="Contoh: 2024101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    value={studentForm.nisn}
                    onChange={(e) => setStudentForm({ ...studentForm, nisn: e.target.value })}
                    placeholder="Contoh: 0071234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={studentForm.class_id}
                    onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Kelas {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon Orang Tua</label>
                <input
                  type="text"
                  value={studentForm.parent_phone}
                  onChange={(e) => setStudentForm({ ...studentForm, parent_phone: e.target.value })}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
