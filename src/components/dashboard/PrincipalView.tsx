'use client';

import React, { useState } from 'react';
import LogoutButton from './LogoutButton';
import SafeImage from '@/components/ui/SafeImage';
import { UserRole } from '@/lib/constants';
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  CalendarCheck,
  Megaphone,
  FileText,
  CheckSquare,
  Bell,
  Settings,
  Award,
  BookOpen,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  ClipboardList,
  Activity,
  BarChart3,
  Calendar,
  Layers,
  Building2,
} from 'lucide-react';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
  };
  data: {
    stats: {
      totalTeachers: number;
      totalStudents: number;
      totalWaliKelas: number;
      totalActivities: number;
      totalAnnouncements: number;
    };
    schoolProfile: any;
    principalProfile: any;
    announcements: any[];
    galleryAlbums: any[];
    teachers: any[];
    students: any[];
  };
}

type TabType =
  | 'dashboard'
  | 'profil'
  | 'guru'
  | 'siswa'
  | 'kegiatan'
  | 'pengumuman'
  | 'laporan-guru'
  | 'laporan-wali'
  | 'laporan-kegiatan'
  | 'laporan-rekap'
  | 'persetujuan'
  | 'notifikasi'
  | 'pengaturan';

export default function PrincipalView({ user, data }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLaporanMenuOpen, setIsLaporanMenuOpen] = useState(true);

  // Filter & Search states
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [announcementFilter, setAnnouncementFilter] = useState('semua');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

  // Approval flow simulation state
  const [approvals, setApprovals] = useState([
    {
      id: 'app-1',
      title: 'Laporan Pembelajaran & Jurnal Mengajar Pekan Ke-2',
      submitter: 'Drs. Muh. Ilham, M.Pd.',
      role: 'Guru Fisika',
      date: '14 September 2026',
      status: 'pending', // 'pending' | 'approved' | 'rejected'
      summary: 'Target capaian KD 3.2 selesai 100%. Terdapat 3 siswa yang memerlukan pengayaan materi kinematika.',
      feedback: '',
    },
    {
      id: 'app-2',
      title: 'Laporan Perkembangan Karakter & Presensi Rombel X-1',
      submitter: 'Siti Rahmawati, S.Pd.',
      role: 'Wali Kelas X-1',
      date: '12 September 2026',
      status: 'pending',
      summary: 'Kehadiran kelas mencapai 98.4%. Seluruh siswa aktif mengikuti kegiatan piket kebersihan adiwiyata kelas.',
      feedback: '',
    },
    {
      id: 'app-3',
      title: 'Proposal & Anggaran Kegiatan Pekan Olahraga & Seni (Porseni)',
      submitter: 'Ahmad Fauzi, S.Pd.',
      role: 'Wakasek Kesiswaan',
      date: '10 September 2026',
      status: 'approved',
      summary: 'Rencana pelaksanaan porseni antar kelas menyambut HUT Sekolah dengan 8 cabang lomba.',
      feedback: 'Disetujui. Pastikan koordinasi dengan tim keamanan dan fasilitas kebersihan.',
    },
    {
      id: 'app-4',
      title: 'Rencana Pelaksanaan Aksi Bersih Pesisir & Penanaman Mangrove',
      submitter: 'Hasanuddin, S.Si.',
      role: 'Koordinator Adiwiyata',
      date: '08 September 2026',
      status: 'approved',
      summary: 'Agenda lingkungan pelestarian pesisir Poleang melibatkan 120 siswa kelas XI.',
      feedback: 'Sangat baik. Prioritaskan keselamatan siswa selama di pesisir.',
    },
  ]);

  const [approvalModalItem, setApprovalModalItem] = useState<any | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState('');

  // Password update states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [passLoading, setPassLoading] = useState(false);

  const { stats, schoolProfile, principalProfile, announcements, galleryAlbums, teachers, students } = data;

  // Handler Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = await res.json();
      if (res.ok) {
        setPassMsg({ type: 'success', text: 'Password akun Kepala Sekolah berhasil diubah!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassMsg({ type: 'error', text: json.error || 'Gagal mengubah password.' });
      }
    } catch {
      setPassMsg({ type: 'error', text: 'Terjadi kesalahan koneksi server.' });
    } finally {
      setPassLoading(false);
    }
  };

  // Handler persetujuan review
  const handleApprove = (id: string, feedbackText?: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'approved', feedback: feedbackText || 'Disetujui oleh Kepala Sekolah.' } : item
      )
    );
    setApprovalModalItem(null);
  };

  const handleReject = (id: string, feedbackText?: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'rejected', feedback: feedbackText || 'Dikembalikan untuk perbaikan.' } : item
      )
    );
    setApprovalModalItem(null);
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  // Filter Guru
  const filteredTeachers = teachers.filter((t) => {
    return (
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.username.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  });

  // Filter Siswa
  const filteredStudents = students.filter((s) => {
    return (
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.username.toLowerCase().includes(studentSearch.toLowerCase())
    );
  });

  // Filter Pengumuman
  const filteredAnnouncements = announcements.filter((a) => {
    if (announcementFilter === 'semua') return true;
    return a.category === announcementFilter;
  });

  // Parse facilities
  let parsedFacilities: { name: string; desc: string }[] = [];
  try {
    if (schoolProfile?.facilities) {
      parsedFacilities = JSON.parse(schoolProfile.facilities);
    }
  } catch {
    parsedFacilities = [];
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profil', label: 'Profil Sekolah', icon: School, badge: 'Read Only' },
    { id: 'guru', label: 'Guru & Tendik', icon: Users, badge: 'Read Only' },
    { id: 'siswa', label: 'Siswa', icon: GraduationCap, badge: 'Read Only' },
    { id: 'kegiatan', label: 'Kegiatan Sekolah', icon: CalendarCheck },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: FileText,
      hasSubmenu: true,
      submenus: [
        { id: 'laporan-guru', label: 'Laporan Guru', icon: FileSpreadsheet },
        { id: 'laporan-wali', label: 'Laporan Wali Kelas', icon: ClipboardList },
        { id: 'laporan-kegiatan', label: 'Laporan Kegiatan', icon: Activity },
        { id: 'laporan-rekap', label: 'Rekap Sekolah', icon: BarChart3 },
      ],
    },
    {
      id: 'persetujuan',
      label: 'Persetujuan',
      icon: CheckSquare,
      badgeCount: pendingApprovalsCount,
    },
    { id: 'notifikasi', label: 'Notifikasi', icon: Bell, badgeCount: 3 },
    { id: 'pengaturan', label: 'Pengaturan Akun', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row antialiased">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-emerald-100 flex flex-col transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 p-1 flex items-center justify-center shrink-0">
              <SafeImage
                src={schoolProfile?.logo || '/images/logo.svg'}
                alt="Logo SMAN 18"
                className="w-full h-full object-contain"
                fallback={<School className="w-6 h-6 text-emerald-600" />}
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Portal Kepemimpinan
              </span>
              <span className="block text-sm font-extrabold text-slate-900 leading-tight">
                SMAN 18 BOMBANA
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Singkat di Sidebar */}
        <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/80 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <Award className="w-6 h-6 text-emerald-100" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Kepala Sekolah
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
              {principalProfile?.name || user.name}
            </p>
            <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
          </div>
        </div>

        {/* Menu Items Navigasi */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.hasSubmenu) {
              const isAnySubActive = item.submenus?.some((sub) => sub.id === activeTab);
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsLaporanMenuOpen(!isLaporanMenuOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                      isAnySubActive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isAnySubActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isLaporanMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isLaporanMenuOpen && (
                    <div className="pl-6 space-y-1 pt-0.5 pb-1">
                      {item.submenus?.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(sub.id as TabType);
                              setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              isSubActive
                                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                                : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
                            }`}
                          >
                            <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <a
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <span>Buka Website Sekolah</span>
          </a>
          <LogoutButton className="w-full justify-center" />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Supervisi & Pengambilan Keputusan
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 capitalize leading-tight mt-0.5">
                {activeTab.replace('-', ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('notifikasi')}
              className="relative p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white" />
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-800 leading-none">
                {principalProfile?.name || user.name}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Kepala Sekolah</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              <Award className="w-5 h-5 text-emerald-100" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Banner Sambutan Kepemimpinan */}
              <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold mb-3 border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Green & Friendly School Leadership</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Selamat Datang, {principalProfile?.name || user.name}
                  </h1>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-2 leading-relaxed">
                    Pusat kendali, supervisi pembelajaran, dan monitoring mutu sekolah SMA Negeri 18 Bombana. Pantau aktivitas terkini, setujui laporan, dan awasi perkembangan sekolah secara terintegrasi.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
                  <Award className="w-72 h-72" />
                </div>
              </div>

              {/* 4 Kartu Statistik Utama */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Jumlah Guru
                    </span>
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalTeachers}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Tenaga pendidik aktif</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Jumlah Siswa
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalStudents}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Peserta didik terdaftar</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Wali Kelas
                    </span>
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalWaliKelas}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Pembina rombel kelas</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Kegiatan & Agenda
                    </span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalActivities}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Dokumentasi & agenda</p>
                </div>
              </div>

              {/* Dua Kolom: Pengumuman Terbaru & Agenda Sekolah */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Pengumuman Terbaru */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-emerald-600" />
                      <span>Pengumuman & Berita Terbaru</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('pengumuman')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  <div className="space-y-3">
                    {announcements.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedAnnouncement(item)}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 transition-colors cursor-pointer flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              {item.category}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(item.published_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 mt-1 line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {item.content}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        Belum ada pengumuman yang dipublikasikan.
                      </p>
                    )}
                  </div>
                </div>

                {/* Kolom Kanan: Agenda Sekolah & Supervisi */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Agenda Sekolah</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('kegiatan')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Kelola Kegiatan
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800">Rapat Dewan Guru & Kurikulum</span>
                        <span className="text-[10px] font-bold text-emerald-600">Kamis, 18 Sep</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Evaluasi implementasi P5 Kurikulum Merdeka dan persiapan asesmen sumatif tengah semester.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-800">Supervisi Pembelajaran Kelas X</span>
                        <span className="text-[10px] font-bold text-teal-600">Senin, 22 Sep</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Kunjungan kelas dan supervisi perangkat ajar guru mata pelajaran IPA dan Matematika.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-800">Aksi Bersih Lingkungan Adiwiyata</span>
                        <span className="text-[10px] font-bold text-blue-600">Jumat, 26 Sep</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Kerja bakti pemilahan sampah organik dan pemeliharaan taman toga sekolah bersama siswa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ringkasan Aktivitas Sekolah */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Ringkasan Aktivitas Sekolah Terkini</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Kehadiran Harian Siswa</p>
                      <p className="text-slate-500 mt-0.5">Tingkat kehadiran siswa pekan ini mencapai 97.8%.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">KBM & Kurikulum</p>
                      <p className="text-slate-500 mt-0.5">Seluruh rombel aktif melaksanakan KBM sesuai jadwal.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Laporan Menunggu Review</p>
                      <p className="text-slate-500 mt-0.5">{pendingApprovalsCount} dokumen menunggu keputusan Kepala Sekolah.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFIL SEKOLAH (READ ONLY) */}
          {activeTab === 'profil' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Read Only Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <School className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-emerald-900">
                      Informasi Profil Sekolah
                    </h3>
                    <p className="text-[11px] text-emerald-700">
                      Mode Tinjau: Hanya Baca (Read Only). Pengeditan data dilakukan oleh Administrator.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-white rounded-full text-emerald-800 border border-emerald-200">
                  Read Only
                </span>
              </div>

              {/* Identitas Sekolah */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Identitas & Kontak Resmi</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Nama Sekolah</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {schoolProfile?.school_name || 'SMA NEGERI 18 BOMBANA'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Slogan / Motto</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {schoolProfile?.tagline || 'Membentuk Generasi Berkarakter, Cerdas, dan Berwawasan Lingkungan'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Kepala Sekolah</span>
                    <span className="font-bold text-emerald-800 mt-0.5 block">
                      {principalProfile?.name || 'H. Syafruddin, S.Pd., M.Pd.'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Alamat</span>
                    <span className="text-slate-700 mt-0.5 block">
                      {schoolProfile?.address || 'Jl. Pendidikan No. 18, Kecamatan Poleang, Kabupaten Bombana'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Telepon / Kontak</span>
                    <span className="text-slate-700 mt-0.5 block">
                      {schoolProfile?.phone || '+62 821-9988-7766'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Email & Website</span>
                    <span className="text-slate-700 mt-0.5 block">
                      {schoolProfile?.email || 'info@sman18bombana.sch.id'} • {schoolProfile?.website || 'sman18bombana.sch.id'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visi, Misi, & Sejarah */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Visi & Misi Sekolah</span>
                  </h4>
                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">Visi:</span>
                    <p className="text-xs sm:text-sm text-slate-700 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 font-medium">
                      {schoolProfile?.vision || 'Terwujudnya insan bertakwa, berprestasi, berkarakter mulia, dan berwawasan lingkungan hidup.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase block mb-1">Misi:</span>
                    <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {schoolProfile?.mission ||
                        '1. Melaksanakan pembelajaran dan bimbingan secara efektif.\n2. Menumbuhkan semangat keunggulan secara intensif.\n3. Mengembangkan perilaku peduli dan ramah lingkungan.'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Sejarah Sekolah</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {schoolProfile?.history ||
                      'SMA Negeri 18 Bombana didirikan sebagai wadah pendidikan menengah berkualitas di Kabupaten Bombana. Dengan komitmen kebersamaan antara dewan guru, komite, dan orang tua, sekolah terus berkembang menjadi salah satu sekolah rujukan berwawasan Adiwiyata hijau di wilayah Sulawesi Tenggara.'}
                  </p>
                </div>
              </div>

              {/* Fasilitas & Program Unggulan */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Fasilitas & Program Unggulan Sekolah</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {parsedFacilities.length > 0 ? (
                    parsedFacilities.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="font-bold text-xs text-slate-800">{f.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="font-bold text-xs text-slate-800">Laboratorium IPA & Komputer</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Dukungan praktikum sains dan literasi digital.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="font-bold text-xs text-slate-800">Perpustakaan Digital</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Koleksi buku kurikulum dan referensi ilmiah.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="font-bold text-xs text-slate-800">Taman Green & Adiwiyata</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Area konservasi tanaman dan green house.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Struktur Organisasi */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Bagan Struktur Organisasi Sekolah</span>
                </h4>
                <div className="p-6 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs max-w-xs w-full">
                    KEPALA SEKOLAH<br />
                    <span className="text-emerald-200 font-normal text-xs">{principalProfile?.name || user.name}</span>
                  </div>
                  <div className="w-0.5 h-4 bg-emerald-300" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                      <span className="font-bold text-slate-800 block">Wakasek Kurikulum</span>
                      <span className="text-[11px] text-slate-500">Akademik & KBM</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                      <span className="font-bold text-slate-800 block">Wakasek Kesiswaan</span>
                      <span className="text-[11px] text-slate-500">Bimbingan & Ekskul</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                      <span className="font-bold text-slate-800 block">Wakasek Sarpras</span>
                      <span className="text-[11px] text-slate-500">Fasilitas Sekolah</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                      <span className="font-bold text-slate-800 block">Wakasek Humas</span>
                      <span className="text-[11px] text-slate-500">Kemitraan & Publik</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GURU & TENAGA KEPENDIDIKAN (READ ONLY) */}
          {activeTab === 'guru' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-900">
                    Direktori Guru & Tenaga Kependidikan (GTK)
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    Supervisi data guru pengajar, wali kelas, dan tenaga kependidikan aktif (Read Only).
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-white rounded-full text-emerald-800 border border-emerald-200">
                  Read Only
                </span>
              </div>

              {/* Toolbar Pencarian */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama atau username guru..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-semibold">
                  Menampilkan {filteredTeachers.length} Tenaga Pendidik
                </div>
              </div>

              {/* Tabel Daftar Guru */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Nama Lengkap</th>
                        <th className="py-3.5 px-4">Username / Email</th>
                        <th className="py-3.5 px-4">Peran / Tugas</th>
                        <th className="py-3.5 px-4">Status Keaktifan</th>
                        <th className="py-3.5 px-4 text-right">Catatan Supervisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTeachers.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{t.name}</p>
                                <p className="text-[11px] text-slate-400">Pendidik Tetap</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-slate-700 font-medium">@{t.username}</p>
                            <p className="text-[11px] text-slate-400">{t.email}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Guru Pengajar
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>{t.is_active ? 'Aktif Mengajar' : 'Nonaktif'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-[11px] text-slate-500 italic">Terverifikasi</span>
                          </td>
                        </tr>
                      ))}
                      {filteredTeachers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                            Tidak ditemukan data dewan guru yang sesuai.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SISWA (READ ONLY) */}
          {activeTab === 'siswa' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-900">
                    Direktori & Rekap Peserta Didik
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    Monitoring jumlah dan data siswa aktif per tingkat kelas (Read Only).
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-white rounded-full text-emerald-800 border border-emerald-200">
                  Read Only
                </span>
              </div>

              {/* Rekap Per Tingkat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Tingkat Kelas X
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">Fase E</div>
                  <p className="text-xs text-slate-500 mt-0.5">Rombel X-1 dan X-2</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                    Tingkat Kelas XI
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">Fase F</div>
                  <p className="text-xs text-slate-500 mt-0.5">Rombel XI-1 dan XI-2</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                    Tingkat Kelas XII
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">Persiapan Kelulusan</div>
                  <p className="text-xs text-slate-500 mt-0.5">Rombel XII MIPA & IPS</p>
                </div>
              </div>

              {/* Search & Tabel Siswa */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama atau NISN siswa..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    Total Siswa Terdaftar: {students.length}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Nama Siswa</th>
                        <th className="py-3.5 px-4">NISN / Username</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Status Siswa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">
                                {s.name.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-800">{s.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">@{s.username}</td>
                          <td className="py-3.5 px-4 text-slate-500">{s.email}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>{s.is_active ? 'Aktif Belajar' : 'Nonaktif'}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                            Tidak ada siswa yang cocok dengan pencarian.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: KEGIATAN SEKOLAH */}
          {activeTab === 'kegiatan' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Agenda & Dokumentasi Kegiatan Sekolah
                </h3>
                <p className="text-xs text-slate-500">
                  Pemantauan aktivitas akademik, kesiswaan, dan pelestarian lingkungan Green School.
                </p>
              </div>

              {/* Dokumentasi Galeri Kegiatan (Album) */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dokumentasi Kegiatan Sekolah</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {galleryAlbums.map((album) => (
                    <div
                      key={album.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="h-44 bg-slate-100 relative">
                        {album.photos && album.photos[0] ? (
                          <SafeImage
                            src={album.photos[0].image}
                            alt={album.title}
                            className="w-full h-full object-cover"
                            fallback={
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                Tidak ada gambar
                              </div>
                            }
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            Dokumentasi foto kegiatan
                          </div>
                        )}
                        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                          {album.photos?.length || 0} Foto
                        </span>
                      </div>
                      <div className="p-4 space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          Kegiatan Sekolah
                        </span>
                        <h5 className="font-bold text-slate-800 text-sm line-clamp-1">{album.title}</h5>
                        <p className="text-xs text-slate-500 line-clamp-2">{album.description || 'Tidak ada keterangan.'}</p>
                      </div>
                    </div>
                  ))}
                  {galleryAlbums.length === 0 && (
                    <p className="col-span-3 py-8 text-center text-slate-400 text-xs">
                      Belum ada album dokumentasi kegiatan yang tersimpan.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PENGUMUMAN */}
          {activeTab === 'pengumuman' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Daftar Pengumuman & Berita Sekolah
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seluruh informasi publik dan agenda resmi yang diterbitkan untuk warga sekolah.
                  </p>
                </div>

                {/* Filter Kategori */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  {['semua', 'pengumuman', 'berita', 'agenda'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAnnouncementFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        announcementFilter === cat
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Pengumuman */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAnnouncement(item)}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.category}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(item.published_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-3 mt-1.5">{item.content}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                      <span>Baca Rincian</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
                {filteredAnnouncements.length === 0 && (
                  <p className="col-span-3 py-10 text-center text-slate-400 text-xs">
                    Tidak ada informasi pada kategori yang dipilih.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: LAPORAN (4 SUBMENU) */}
          {(activeTab === 'laporan-guru' ||
            activeTab === 'laporan-wali' ||
            activeTab === 'laporan-kegiatan' ||
            activeTab === 'laporan-rekap') && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {activeTab === 'laporan-guru' && 'Monitoring Laporan KBM & Guru Mapel'}
                    {activeTab === 'laporan-wali' && 'Monitoring Laporan Wali Kelas & Rombel'}
                    {activeTab === 'laporan-kegiatan' && 'Monitoring Laporan Kegiatan & Ekstrakurikuler'}
                    {activeTab === 'laporan-rekap' && 'Rekapitulasi Evaluasi Mutu Sekolah'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Struktur pemantauan pelaporan berkala dewan guru dan staf (Tahap awal monitoring).
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Semester Ganjil 2026/2027
                </span>
              </div>

              {/* Submenu Navigator Bar */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'laporan-guru', label: 'Laporan Guru' },
                  { id: 'laporan-wali', label: 'Laporan Wali Kelas' },
                  { id: 'laporan-kegiatan', label: 'Laporan Kegiatan' },
                  { id: 'laporan-rekap', label: 'Rekap Sekolah' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id as TabType)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      activeTab === sub.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Konten Laporan Guru */}
              {activeTab === 'laporan-guru' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Laporan Jurnal Mengajar & Presensi KBM</span>
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    {[
                      { mapel: 'Matematika Peminatan', guru: 'Drs. Muh. Ilham, M.Pd.', kelas: 'Kelas XII MIPA', status: 'Lengkap', tgl: '14 Sep 2026' },
                      { mapel: 'Bahasa Indonesia', guru: 'Siti Rahmawati, S.Pd.', kelas: 'Kelas X-1, X-2', status: 'Lengkap', tgl: '13 Sep 2026' },
                      { mapel: 'Fisika Dasar', guru: 'Hasanuddin, S.Si.', kelas: 'Kelas XI-1', status: 'Menunggu Review', tgl: '12 Sep 2026' },
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800">{item.mapel}</p>
                          <p className="text-xs text-slate-500">{item.guru} • {item.kelas}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {item.status}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">{item.tgl}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Konten Laporan Wali Kelas */}
              {activeTab === 'laporan-wali' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    <span>Laporan Bimbingan Kelas & Presensi Siswa</span>
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    {[
                      { rombel: 'Rombel X-1', wali: 'Siti Rahmawati, S.Pd.', kehadiran: '98.5%', catatan: 'Tidak ada kasus indisipliner' },
                      { rombel: 'Rombel X-2', wali: 'Drs. Muh. Ilham, M.Pd.', kehadiran: '97.2%', catatan: '1 siswa memerlukan tindak lanjut konseling' },
                      { rombel: 'Rombel XI-1', wali: 'Hasanuddin, S.Si.', kehadiran: '99.0%', catatan: 'Seluruh siswa aktif program peduli lingkungan' },
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800">{item.rombel}</p>
                          <p className="text-xs text-slate-500">Wali: {item.wali} • {item.catatan}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-emerald-700">{item.kehadiran}</span>
                          <p className="text-[11px] text-slate-400">Tingkat Hadir</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Konten Laporan Kegiatan */}
              {activeTab === 'laporan-kegiatan' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Laporan Pelaksanaan Kegiatan & Ekstrakurikuler</span>
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Latihan Gabungan Pramuka & Penjelajahan Alam</p>
                        <p className="text-xs text-slate-500">Gugus Depan SMAN 18 Bombana • Pelaksana: Pembina Pramuka</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                        Terlaksana
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Bakti Lingkungan Penanaman Bibit Pohon</p>
                        <p className="text-xs text-slate-500">Kelompok Kerja Adiwiyata & OSIS</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                        Terlaksana
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Konten Rekap Sekolah */}
              {activeTab === 'laporan-rekap' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Rekapitulasi Capaian & Evaluasi Sekolah</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <p className="font-bold text-emerald-900 text-sm">Capaian Kurikulum Merdeka</p>
                      <p className="text-slate-600 mt-1">
                        Ketercapaian modul ajar mencapai 94% sesuai alur tujuan pembelajaran (ATP).
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100">
                      <p className="font-bold text-teal-900 text-sm">Indeks Kepuasan Lingkungan Belajar</p>
                      <p className="text-slate-600 mt-1">
                        Kondisi kelas kondusif, sarana perpustakaan dan laboratorium beroperasi optimal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: PERSETUJUAN (ALUR SUPERVISI & REVIEW) */}
          {activeTab === 'persetujuan' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Bagan Alur Konsep */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Alur Supervisi & Persetujuan Kepala Sekolah</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Decision Workflow
                  </span>
                </div>

                {/* Diagram Konsep Sesuai User Request */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col sm:flex-row items-center justify-around gap-4 text-center text-xs font-semibold">
                  <div className="p-3 bg-white rounded-xl shadow-2xs border border-emerald-200 w-full sm:w-48">
                    <p className="text-emerald-800 font-bold">1. Kirim Laporan</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Guru / Wali Kelas / Staf</p>
                  </div>
                  <div className="text-emerald-500 font-bold text-lg hidden sm:block">➔</div>
                  <div className="p-3 bg-emerald-700 text-white rounded-xl shadow-xs border border-emerald-800 w-full sm:w-48">
                    <p className="font-bold">2. Review & Supervisi</p>
                    <p className="text-[11px] text-emerald-200 mt-0.5">Kepala Sekolah</p>
                  </div>
                  <div className="text-emerald-500 font-bold text-lg hidden sm:block">➔</div>
                  <div className="p-3 bg-white rounded-xl shadow-2xs border border-emerald-200 w-full sm:w-48">
                    <p className="text-slate-800 font-bold">3. Keputusan</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Disetujui / Dikembalikan</p>
                  </div>
                </div>
              </div>

              {/* Daftar Item Persetujuan */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">
                  Dokumen & Laporan Menunggu Keputusan ({approvals.length})
                </h4>

                <div className="space-y-4">
                  {approvals.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                item.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : item.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.status === 'pending'
                                ? 'Menunggu Persetujuan'
                                : item.status === 'approved'
                                ? 'Disetujui'
                                : 'Dikembalikan'}
                            </span>
                            <span className="text-[11px] text-slate-400">{item.date}</span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm sm:text-base mt-1.5">{item.title}</h5>
                          <p className="text-xs text-slate-500">
                            Pengirim: <strong>{item.submitter}</strong> ({item.role})
                          </p>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                          {item.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => {
                                  setApprovalModalItem(item);
                                  setApprovalFeedback('');
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                              >
                                Tinjau Detail
                              </button>
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors"
                              >
                                Kembalikan
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">
                              Keputusan telah tercatat
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {item.summary}
                      </p>

                      {item.feedback && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
                          <strong>Catatan Kepala Sekolah:</strong> {item.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Review Persetujuan */}
              {approvalModalItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-900 text-sm">Review Pengajuan Laporan</h4>
                      <button
                        onClick={() => setApprovalModalItem(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-slate-800 text-sm">{approvalModalItem.title}</p>
                      <p className="text-slate-500">
                        Pengirim: {approvalModalItem.submitter} ({approvalModalItem.role})
                      </p>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                        {approvalModalItem.summary}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Catatan / Rekomendasi Pimpinan (Opsional):
                        </label>
                        <textarea
                          rows={3}
                          value={approvalFeedback}
                          onChange={(e) => setApprovalFeedback(e.target.value)}
                          placeholder="Tuliskan arahan, instruksi tindak lanjut, atau catatan revisi..."
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleReject(approvalModalItem.id, approvalFeedback)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Kembalikan (Perlu Revisi)
                      </button>
                      <button
                        onClick={() => handleApprove(approvalModalItem.id, approvalFeedback)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                      >
                        Setujui Laporan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: NOTIFIKASI */}
          {activeTab === 'notifikasi' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Pusat Notifikasi Kepala Sekolah
                </h3>
                <p className="text-xs text-slate-500">
                  Pemberitahuan laporan baru, pengumuman yang tayang, agenda mendesak, dan atensi pimpinan.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">
                        Perhatian Khusus: Supervisi Pembelajaran Semester Ganjil
                      </span>
                      <span className="text-[11px] text-slate-400">Hari ini</span>
                    </div>
                    <p className="text-slate-600 mt-1">
                      Jadwal supervisi kelas X telah diagendakan pekan depan. Harap meninjau instrumen supervisi kurikulum.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">
                        Laporan Masuk: Presensi & Karakter Rombel X-1
                      </span>
                      <span className="text-[11px] text-slate-400">Kemarin</span>
                    </div>
                    <p className="text-slate-600 mt-1">
                      Wali Kelas X-1 telah mengirimkan rekap bulanan keaktifan dan bimbingan siswa untuk ditinjau.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700 shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">
                        Pengumuman Baru Telah Diterbitkan
                      </span>
                      <span className="text-[11px] text-slate-400">3 hari lalu</span>
                    </div>
                    <p className="text-slate-600 mt-1">
                      Informasi resmi terkait persiapan Asesmen Nasional telah tayang di portal publik sekolah.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: PENGATURAN AKUN */}
          {activeTab === 'pengaturan' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Pengaturan Akun Kepala Sekolah
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola informasi akun pimpinan dan perbarui kata sandi untuk keamanan akses.
                </p>
              </div>

              {/* Rincian Profil Akun */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Profil Akun Terdaftar</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Nama Pimpinan</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{principalProfile?.name || user.name}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Username</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">@{user.username}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Email</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{user.email}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Peran Akses</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">Kepala Sekolah (Executive)</span>
                  </div>
                </div>
              </div>

              {/* Form Ganti Password */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Ganti Password</span>
                </h4>

                {passMsg.text && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                      passMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {passMsg.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{passMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Password Lama (Opsional bila sebelumnya belum disetel):
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Password Baru (Minimal 6 Karakter):
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Konfirmasi Password Baru:
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1.5"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPass ? 'Sembunyikan' : 'Tampilkan'} Karakter</span>
                    </button>

                    <button
                      type="submit"
                      disabled={passLoading}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                    >
                      {passLoading ? 'Menyimpan...' : 'Perbarui Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Logout Box */}
              <div className="p-6 rounded-3xl bg-red-50/50 border border-red-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Keluar dari Sesi</h4>
                  <p className="text-xs text-red-700 mt-0.5">Akhiri sesi pimpinan dengan aman.</p>
                </div>
                <LogoutButton />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Detail Pengumuman */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedAnnouncement.category}
              </span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">{selectedAnnouncement.title}</h4>
            <p className="text-xs text-slate-400">
              Dipublikasikan pada:{' '}
              {new Date(selectedAnnouncement.published_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line">
              {selectedAnnouncement.content}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
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
