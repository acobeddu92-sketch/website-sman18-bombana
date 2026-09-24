'use client';

import React, { useState, useEffect, useMemo } from 'react';
import LogoutButton from './LogoutButton';
import { UserRole } from '@/lib/constants';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  Filter,
  Layers,
  GraduationCap,
  Sparkles,
  RefreshCw,
  FileText,
  Eye,
  ShieldCheck,
  Bell,
  Settings,
  Menu,
  X,
  Printer,
  ChevronRight,
  UserCheck,
  Building2,
  Key,
  FolderOpen,
  ClipboardList,
  Info,
  Check,
  Download,
  Plus,
  Trash2,
  Loader2,
  User,
  Pencil,
  ExternalLink,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
  };
}

type CurriculumTab =
  | 'dashboard'
  | 'kalender'
  | 'jadwal'
  | 'tugas-guru'
  | 'guru'
  | 'kelas'
  | 'perangkat'
  | 'monitoring'
  | 'rekap'
  | 'laporan'
  | 'notifikasi'
  | 'pengaturan';

export default function CurriculumView({ user }: Props) {
  const [activeTab, setActiveTab] = useState<CurriculumTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Global State & Notification Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Per-module Loading States
  const [loadingStates, setLoadingStates] = useState({
    dashboard: false,
    schedules: false,
    teachers: false,
    classes: false,
    materials: false,
    monitoring: false,
    statistics: false,
  });

  // Per-module Error States
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({
    dashboard: null,
    schedules: null,
    teachers: null,
    classes: null,
    materials: null,
    monitoring: null,
    statistics: null,
  });

  // Module Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [schedulesData, setSchedulesData] = useState<any>(null);
  const [teachersData, setTeachersData] = useState<any>(null);
  const [classesData, setClassesData] = useState<any>(null);
  const [materialsData, setMaterialsData] = useState<any>(null);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [statisticsData, setStatisticsData] = useState<any>(null);

  // Modals Data State
  const [selectedClassDetail, setSelectedClassDetail] = useState<any>(null);
  const [isLoadingClassDetail, setIsLoadingClassDetail] = useState(false);
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<any>(null);
  const [selectedClassScheduleModal, setSelectedClassScheduleModal] = useState<any | null>(null);

  // Schedule Filters & View Mode
  const [scheduleViewMode, setScheduleViewMode] = useState<'harian' | 'mingguan'>('harian');
  const [scheduleDayFilter, setScheduleDayFilter] = useState('all');
  const [scheduleTeacherFilter, setScheduleTeacherFilter] = useState('all');
  const [scheduleClassFilter, setScheduleClassFilter] = useState('all');
  const [scheduleGradeFilter, setScheduleGradeFilter] = useState('all');
  const [scheduleSearch, setScheduleSearch] = useState('');

  // Master Schedule Management (CRUD by Wakasek Kurikulum)
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<any | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    id: '',
    teacher_id: '',
    class_id: '',
    subject: '',
    day: 'Senin',
    start_time: '07:30',
    end_time: '09:00',
    room: '',
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);

  // Task Filter (Pembagian Tugas Guru: Guru, Mapel, Kelas, Tingkat, Cari)
  const [taskTeacherSearch, setTaskTeacherSearch] = useState('');
  const [taskTeacherFilter, setTaskTeacherFilter] = useState('all');
  const [taskSubjectFilter, setTaskSubjectFilter] = useState('all');
  const [taskClassFilter, setTaskClassFilter] = useState('all');
  const [taskGradeFilter, setTaskGradeFilter] = useState('all');

  // Teacher Filter
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherRoleFilter, setTeacherRoleFilter] = useState('all');

  // Materials Filter (Guru, Kelas, Periode, Cari)
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialTeacherFilter, setMaterialTeacherFilter] = useState('all');
  const [materialClassFilter, setMaterialClassFilter] = useState('all');
  const [materialPeriodFilter, setMaterialPeriodFilter] = useState('all');

  // Calendar Filter
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState('all');
  const [calendarSearch, setCalendarSearch] = useState('');

  // Notification Filter
  const [notificationCategoryFilter, setNotificationCategoryFilter] = useState('all');
  const [notificationSearch, setNotificationSearch] = useState('');

  // Monitoring Filter
  const [monitoringStatusFilter, setMonitoringStatusFilter] = useState('all');
  const [monitoringTeacherFilter, setMonitoringTeacherFilter] = useState('all');
  const [monitoringSearch, setMonitoringSearch] = useState('');

  // Report Section Selector
  const [reportSection, setReportSection] = useState<
    'eksekutif' | 'jadwal' | 'tugas' | 'kelas' | 'perangkat' | 'monitoring'
  >('eksekutif');

  // Password Change Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch Dashboard Summary
  const fetchDashboardData = async () => {
    setLoadingStates((prev) => ({ ...prev, dashboard: true }));
    setErrorStates((prev) => ({ ...prev, dashboard: null }));
    try {
      const res = await fetch('/api/curriculum/dashboard');
      const json = await res.json();
      if (res.ok && json.success) {
        setDashboardData(json);
      } else {
        const msg = json.error || 'Gagal memuat ringkasan dashboard.';
        setErrorStates((prev) => ({ ...prev, dashboard: msg }));
        setErrorMsg(msg);
      }
    } catch (e) {
      const msg = 'Gagal terhubung ke server.';
      setErrorStates((prev) => ({ ...prev, dashboard: msg }));
      setErrorMsg(msg);
    } finally {
      setLoadingStates((prev) => ({ ...prev, dashboard: false }));
    }
  };

  // Fetch Schedules
  const fetchSchedules = async () => {
    setLoadingStates((prev) => ({ ...prev, schedules: true }));
    setErrorStates((prev) => ({ ...prev, schedules: null }));
    try {
      const res = await fetch('/api/curriculum/schedules');
      const json = await res.json();
      if (res.ok && json.success) {
        setSchedulesData(json);
      } else {
        const msg = json.error || 'Gagal memuat jadwal pelajaran.';
        setErrorStates((prev) => ({ ...prev, schedules: msg }));
      }
    } catch (e) {
      setErrorStates((prev) => ({ ...prev, schedules: 'Gagal terhubung ke server.' }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, schedules: false }));
    }
  };

  // Fetch Teachers
  const fetchTeachers = async () => {
    setLoadingStates((prev) => ({ ...prev, teachers: true }));
    setErrorStates((prev) => ({ ...prev, teachers: null }));
    try {
      const res = await fetch('/api/curriculum/teachers');
      const json = await res.json();
      if (res.ok && json.success) {
        setTeachersData(json);
      } else {
        const msg = json.error || 'Gagal memuat data guru.';
        setErrorStates((prev) => ({ ...prev, teachers: msg }));
      }
    } catch (e) {
      setErrorStates((prev) => ({ ...prev, teachers: 'Gagal terhubung ke server.' }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, teachers: false }));
    }
  };

  // Fetch Classes
  const fetchClasses = async () => {
    setLoadingStates((prev) => ({ ...prev, classes: true }));
    setErrorStates((prev) => ({ ...prev, classes: null }));
    try {
      const res = await fetch('/api/curriculum/classes');
      const json = await res.json();
      if (res.ok && json.success) {
        setClassesData(json);
      } else {
        const msg = json.error || 'Gagal memuat data kelas.';
        setErrorStates((prev) => ({ ...prev, classes: msg }));
      }
    } catch (e) {
      setErrorStates((prev) => ({ ...prev, classes: 'Gagal terhubung ke server.' }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, classes: false }));
    }
  };

  // Fetch Materials
  const fetchMaterials = async () => {
    setLoadingStates((prev) => ({ ...prev, materials: true }));
    setErrorStates((prev) => ({ ...prev, materials: null }));
    try {
      const res = await fetch('/api/curriculum/materials');
      const json = await res.json();
      if (res.ok && json.success) {
        setMaterialsData(json);
      } else {
        const msg = json.error || 'Gagal memuat perangkat pembelajaran.';
        setErrorStates((prev) => ({ ...prev, materials: msg }));
      }
    } catch (e) {
      setErrorStates((prev) => ({ ...prev, materials: 'Gagal terhubung ke server.' }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, materials: false }));
    }
  };

  // Fetch Monitoring Matrix
  const fetchMonitoring = async () => {
    setLoadingStates((prev) => ({ ...prev, monitoring: true }));
    setErrorStates((prev) => ({ ...prev, monitoring: null }));
    try {
      const res = await fetch('/api/curriculum/monitoring');
      const json = await res.json();
      if (res.ok && json.success) {
        setMonitoringData(json);
      } else {
        const msg = json.error || 'Gagal memuat matriks monitoring.';
        setErrorStates((prev) => ({ ...prev, monitoring: msg }));
      }
    } catch (e) {
      setErrorStates((prev) => ({ ...prev, monitoring: 'Gagal terhubung ke server.' }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, monitoring: false }));
    }
  };

  // Fetch Statistics
  const fetchStatistics = async () => {
    setLoadingStates((prev) => ({ ...prev, statistics: true }));
    setErrorStates((prev) => ({ ...prev, statistics: null }));
    try {
      const res = await fetch('/api/curriculum/statistics');
      const json = await res.json();
      if (res.ok && json.success) {
        setStatisticsData(json);
      } else {
        const msg = json.error || 'Gagal memuat rekapitulasi data.';
        setErrorStates((prev) => ({ ...prev, statistics: msg }));
      }
    } catch (e) {
      setErrorStates((prev) => ({ ...prev, statistics: 'Gagal terhubung ke server.' }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, statistics: false }));
    }
  };

  // Load All Initial Data
  const loadAllData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    await Promise.all([
      fetchDashboardData(),
      fetchSchedules(),
      fetchTeachers(),
      fetchClasses(),
      fetchMaterials(),
      fetchMonitoring(),
      fetchStatistics(),
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch Detail Kelas (Termasuk Siswa Aktif dari Master Data Siswa)
  const handleOpenClassDetail = async (clsId: string) => {
    setIsLoadingClassDetail(true);
    setSelectedClassDetail(null);
    try {
      const res = await fetch(`/api/curriculum/classes?class_id=${clsId}`);
      const json = await res.json();
      if (res.ok) {
        setSelectedClassDetail(json.class);
      } else {
        alert(json.error || 'Gagal memuat detail kelas.');
      }
    } catch (e) {
      alert('Terjadi kesalahan saat memuat data siswa.');
    } finally {
      setIsLoadingClassDetail(false);
    }
  };

  // Schedule Management Handlers (Wakasek Kurikulum - Master Data Jadwal)
  const handleOpenAddScheduleModal = () => {
    const defaultTeacherId =
      schedulesData?.filterOptions?.teachers?.[0]?.id ||
      teachersData?.teachers?.[0]?.id ||
      '';
    const defaultClassId =
      schedulesData?.filterOptions?.classes?.[0]?.id ||
      classesData?.classes?.[0]?.id ||
      '';
    setScheduleForm({
      id: '',
      teacher_id: defaultTeacherId,
      class_id: defaultClassId,
      subject: '',
      day: 'Senin',
      start_time: '07:30',
      end_time: '09:00',
      room: '',
    });
    setIsAddScheduleModalOpen(true);
  };

  const handleOpenEditScheduleModal = (item: any) => {
    setScheduleForm({
      id: item.id,
      teacher_id: item.teacher_id || item.teacher?.id || '',
      class_id: item.class_id || item.class?.id || '',
      subject: item.subject || '',
      day: item.day || 'Senin',
      start_time: item.start_time || '07:30',
      end_time: item.end_time || '09:00',
      room: item.room || '',
    });
    setIsEditScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !scheduleForm.teacher_id ||
      !scheduleForm.class_id ||
      !scheduleForm.subject ||
      !scheduleForm.day ||
      !scheduleForm.start_time ||
      !scheduleForm.end_time
    ) {
      alert('Mohon lengkapi semua kolom wajib jadwal pelajaran.');
      return;
    }

    // Validasi jam di tingkat UI
    if (scheduleForm.start_time >= scheduleForm.end_time) {
      alert(`Jam mulai (${scheduleForm.start_time}) harus lebih awal dari jam selesai (${scheduleForm.end_time}).`);
      return;
    }

    setIsSavingSchedule(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const isEditing = Boolean(scheduleForm.id);
      const res = await fetch('/api/curriculum/schedules', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Jadwal pelajaran berhasil disimpan ke Master Data.');
        setIsAddScheduleModalOpen(false);
        setIsEditScheduleModalOpen(false);
        loadAllData();
      } else {
        alert(data.error || 'Gagal menyimpan jadwal pelajaran.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem saat menyimpan jadwal.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setIsDeletingSchedule(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/curriculum/schedules?id=${scheduleToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Jadwal pelajaran berhasil dihapus dari Master Data.');
        setScheduleToDelete(null);
        loadAllData();
      } else {
        alert(data.error || 'Gagal menghapus jadwal pelajaran.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem saat menghapus jadwal.');
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  const handleOpenClassSchedule = (cls: any) => {
    setSelectedClassScheduleModal(cls);
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = await res.json();
      if (res.ok) {
        setPasswordSuccess('Password akun berhasil diperbarui.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(json.error || 'Gagal memperbarui password.');
      }
    } catch (e) {
      setPasswordError('Gagal terhubung ke server.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Navigasi Menu (12 Modul Kurikulum + Logout di Footer)
  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'kalender', label: 'Kalender Akademik', icon: Calendar },
    { id: 'jadwal', label: 'Jadwal Pelajaran', icon: Clock },
    { id: 'tugas-guru', label: 'Pembagian Tugas Guru', icon: ClipboardList },
    { id: 'guru', label: 'Data Guru', icon: Users },
    { id: 'kelas', label: 'Kelas & Rombel', icon: Building2 },
    { id: 'perangkat', label: 'Perangkat Pembelajaran', icon: FolderOpen },
    { id: 'monitoring', label: 'Monitoring Pembelajaran', icon: CheckCircle2 },
    { id: 'rekap', label: 'Rekap Akademik', icon: Layers },
    { id: 'laporan', label: 'Laporan Kurikulum', icon: FileText },
    { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
    { id: 'pengaturan', label: 'Pengaturan Akun', icon: Settings },
  ];

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    if (!schedulesData?.schedules) return [];
    return schedulesData.schedules.filter((s: any) => {
      const matchDay = scheduleDayFilter === 'all' || s.day === scheduleDayFilter;
      const matchTeacher = scheduleTeacherFilter === 'all' || s.teacher_id === scheduleTeacherFilter;
      const matchClass = scheduleClassFilter === 'all' || s.class_id === scheduleClassFilter;
      const matchGrade = scheduleGradeFilter === 'all' || s.class?.grade === scheduleGradeFilter;
      const matchSearch =
        !scheduleSearch ||
        s.subject.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
        s.teacher?.name.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
        s.class?.name.toLowerCase().includes(scheduleSearch.toLowerCase());
      return matchDay && matchTeacher && matchClass && matchGrade && matchSearch;
    });
  }, [
    schedulesData,
    scheduleDayFilter,
    scheduleTeacherFilter,
    scheduleClassFilter,
    scheduleGradeFilter,
    scheduleSearch,
  ]);

  // Unique Subjects for filter dropdown
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    schedulesData?.schedules?.forEach((s: any) => {
      if (s.subject) set.add(s.subject);
    });
    return Array.from(set).sort();
  }, [schedulesData]);

  // Filtered Tasks for Pembagian Tugas Guru (Filter: Guru, Mapel, Kelas, Tingkat, Cari)
  const filteredTasks = useMemo(() => {
    if (!teachersData?.teachers) return [];
    return teachersData.teachers.filter((teacher: any) => {
      const matchTeacher = taskTeacherFilter === 'all' || teacher.id === taskTeacherFilter;
      const matchSubject =
        taskSubjectFilter === 'all' ||
        teacher.teaching_schedules?.some(
          (s: any) => s.subject.toLowerCase() === taskSubjectFilter.toLowerCase()
        );
      const matchClass =
        taskClassFilter === 'all' ||
        teacher.teaching_schedules?.some((s: any) => s.class_id === taskClassFilter);
      const matchGrade =
        taskGradeFilter === 'all' ||
        teacher.teaching_schedules?.some((s: any) => s.class?.grade === taskGradeFilter);
      const matchSearch =
        !taskTeacherSearch ||
        teacher.name.toLowerCase().includes(taskTeacherSearch.toLowerCase()) ||
        teacher.username.toLowerCase().includes(taskTeacherSearch.toLowerCase()) ||
        teacher.teaching_schedules?.some((s: any) =>
          s.subject.toLowerCase().includes(taskTeacherSearch.toLowerCase())
        );
      return matchTeacher && matchSubject && matchClass && matchGrade && matchSearch;
    });
  }, [
    teachersData,
    taskTeacherFilter,
    taskSubjectFilter,
    taskClassFilter,
    taskGradeFilter,
    taskTeacherSearch,
  ]);

  // Filtered Teachers for Teacher Directory
  const filteredTeachers = useMemo(() => {
    if (!teachersData?.teachers) return [];
    return teachersData.teachers.filter((t: any) => {
      const matchRole = teacherRoleFilter === 'all' || t.role === teacherRoleFilter;
      const matchSearch =
        !teacherSearch ||
        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.username.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearch.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [teachersData, teacherRoleFilter, teacherSearch]);

  // Filtered Materials (Filter: Guru, Kelas, Periode, Cari)
  const filteredMaterials = useMemo(() => {
    if (!materialsData?.materials) return [];
    return materialsData.materials.filter((m: any) => {
      const matchTeacher =
        materialTeacherFilter === 'all' || m.teacher_id === materialTeacherFilter;
      const matchClass =
        materialClassFilter === 'all' || m.class_id === materialClassFilter;
      const matchSearch =
        !materialSearch ||
        m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
        m.subject.toLowerCase().includes(materialSearch.toLowerCase()) ||
        m.teacher?.name.toLowerCase().includes(materialSearch.toLowerCase());

      let matchPeriod = true;
      if (materialPeriodFilter !== 'all') {
        const matDate = new Date(m.created_at).getTime();
        const now = Date.now();
        if (materialPeriodFilter === '7d') {
          matchPeriod = now - matDate <= 7 * 24 * 60 * 60 * 1000;
        } else if (materialPeriodFilter === '30d') {
          matchPeriod = now - matDate <= 30 * 24 * 60 * 60 * 1000;
        } else if (materialPeriodFilter === '90d') {
          matchPeriod = now - matDate <= 90 * 24 * 60 * 60 * 1000;
        }
      }
      return matchTeacher && matchClass && matchPeriod && matchSearch;
    });
  }, [materialsData, materialTeacherFilter, materialClassFilter, materialPeriodFilter, materialSearch]);

  // Filtered Calendar Announcements
  const filteredCalendarItems = useMemo(() => {
    if (!dashboardData?.recentAnnouncements) return [];
    return dashboardData.recentAnnouncements.filter((item: any) => {
      const matchCategory =
        calendarCategoryFilter === 'all' || item.category === calendarCategoryFilter;
      const matchSearch =
        !calendarSearch ||
        item.title.toLowerCase().includes(calendarSearch.toLowerCase()) ||
        item.content.toLowerCase().includes(calendarSearch.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [dashboardData, calendarCategoryFilter, calendarSearch]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    if (!dashboardData?.recentAnnouncements) return [];
    return dashboardData.recentAnnouncements.filter((item: any) => {
      const matchCategory =
        notificationCategoryFilter === 'all' || item.category === notificationCategoryFilter;
      const matchSearch =
        !notificationSearch ||
        item.title.toLowerCase().includes(notificationSearch.toLowerCase()) ||
        item.content.toLowerCase().includes(notificationSearch.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [dashboardData, notificationCategoryFilter, notificationSearch]);

  // Filtered Monitoring Matrix
  const filteredMonitoringItems = useMemo(() => {
    if (!monitoringData?.items) return [];
    return monitoringData.items.filter((item: any) => {
      const matchTeacher =
        monitoringTeacherFilter === 'all' || item.teacherId === monitoringTeacherFilter;
      const matchStatus =
        monitoringStatusFilter === 'all' || item.status === monitoringStatusFilter;
      const matchSearch =
        !monitoringSearch ||
        item.teacherName.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
        item.subject.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
        item.className.toLowerCase().includes(monitoringSearch.toLowerCase());
      return matchTeacher && matchStatus && matchSearch;
    });
  }, [monitoringData, monitoringTeacherFilter, monitoringStatusFilter, monitoringSearch]);

  // Helper Badge Status Quick Monitoring
  const getQuickStatusBadge = (status: string) => {
    switch (status) {
      case 'Normal':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Normal</span>
          </span>
        );
      case 'Perlu Perhatian':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Perlu Perhatian</span>
          </span>
        );
      case 'Belum Lengkap':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Belum Lengkap</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Belum Tersedia</span>
          </span>
        );
    }
  };

  // Helper Badge Status Matriks Monitoring
  const getMatrixStatusBadge = (status: string) => {
    switch (status) {
      case 'Lengkap':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>✓ Lengkap</span>
          </span>
        );
      case 'Perlu Perhatian':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>⚠ Perlu Perhatian</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
            <span>— Belum Ada Data</span>
          </span>
        );
    }
  };

  // Reusable Component: State Loading
  const ModuleLoadingState = ({ label }: { label: string }) => (
    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center py-16 space-y-3">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      <p className="text-sm font-bold text-slate-700">Memuat {label}...</p>
      <p className="text-xs text-slate-400">Sinkronisasi data langsung dengan PostgreSQL</p>
    </div>
  );

  // Reusable Component: State Error
  const ModuleErrorState = ({
    title,
    message,
    onRetry,
  }: {
    title: string;
    message: string;
    onRetry: () => void;
  }) => (
    <div className="bg-rose-50/70 rounded-3xl p-6 sm:p-8 border border-rose-200 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-base font-bold text-rose-900">Gagal Memuat {title}</h4>
        <p className="text-xs sm:text-sm text-rose-700 mt-1 max-w-md mx-auto">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Coba Lagi</span>
      </button>
    </div>
  );

  // Reusable Component: State Empty
  const ModuleEmptyState = ({
    icon: Icon = Info,
    title,
    description,
  }: {
    icon?: any;
    title: string;
    description: string;
  }) => (
    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center py-14 space-y-2">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigasi Desktop & Tablet */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r border-slate-200/80 flex-col shrink-0 sticky top-0 h-screen z-20 shadow-xs print:hidden">
        {/* Header Identitas Modul Kurikulum */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 leading-none">
              Pusat Kurikulum
            </span>
            <span className="block text-sm font-extrabold text-slate-900 truncate mt-0.5">
              Wakasek Kurikulum
            </span>
            <span className="block text-[11px] text-slate-400 truncate">
              SMAN 18 Bombana
            </span>
          </div>
        </div>

        {/* User Info Bar */}
        <div className="px-5 py-3 bg-emerald-50/50 border-b border-emerald-100/60 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
          </div>
          <Link
            href="/dashboard/profile"
            className="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors shadow-2xs shrink-0"
            title="Profil Saya"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>

        {/* Daftar Menu Navigasi (12 Modul Kurikulum) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as CurriculumTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: Menu 13 Logout & Link Website */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <span>Lihat Website</span>
          </a>
          <LogoutButton className="w-full justify-center" />
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase text-emerald-700 leading-none">
              Pusat Kurikulum
            </h2>
            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
          aria-label="Toggle menu"
        >
          {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end print:hidden">
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Navigasi Kurikulum
              </span>
              <button onClick={() => setIsMobileNavOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-1">
              {navMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as CurriculumTab);
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <LogoutButton className="w-full justify-center" />
            </div>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 print:p-0 print:max-w-none print:m-0 print:border-none">
        
        {/* Banner Notifikasi Error / Sukses */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between animate-fadeIn print:hidden">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-fadeIn print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD UTAMA (PUSAT KURIKULUM) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Selamat Datang */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-green-800 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10 relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pusat Kendali Akademik &amp; Pembelajaran</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Pusat Kurikulum
                </h1>
                <p className="text-sm sm:text-base text-emerald-100/90 mt-2 leading-relaxed font-medium">
                  Monitoring dan Pengelolaan Akademik Sekolah
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('jadwal')}
                    className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    Lihat Seluruh Jadwal
                  </button>
                  <button
                    onClick={() => setActiveTab('monitoring')}
                    className="px-4 py-2 rounded-xl bg-emerald-700/80 text-white font-bold text-xs border border-emerald-600/60 hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Buka Matriks Monitoring
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            </div>

            {/* Error State Khusus Dashboard jika terjadi API failure */}
            {errorStates.dashboard && (
              <ModuleErrorState
                title="Ringkasan Kurikulum"
                message={errorStates.dashboard}
                onRetry={fetchDashboardData}
              />
            )}

            {/* 7 Kartu Indikator Real-Time dari PostgreSQL */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>Indikator Utama Kurikulum</span>
                </h2>
                <button
                  onClick={loadAllData}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Data</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Guru */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Guru</span>
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700"><Users className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {errorStates.dashboard ? (
                      <span className="text-rose-600 font-extrabold text-xl">ERROR</span>
                    ) : loadingStates.dashboard ? (
                      <span className="text-slate-400 font-bold text-sm animate-pulse">Memuat...</span>
                    ) : (
                      dashboardData ? dashboardData.stats.totalTeachers : 0
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Tenaga pendidik terdaftar aktif</p>
                </div>

                {/* 2. Total Rombel */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Rombel</span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700"><Building2 className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {errorStates.dashboard ? (
                      <span className="text-rose-600 font-extrabold text-xl">ERROR</span>
                    ) : loadingStates.dashboard ? (
                      <span className="text-slate-400 font-bold text-sm animate-pulse">Memuat...</span>
                    ) : (
                      dashboardData ? dashboardData.stats.totalClasses : 0
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Kelas aktif (X, XI, XII)</p>
                </div>

                {/* 3. Jadwal Pelajaran Aktif */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Jadwal Aktif</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><Clock className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {errorStates.dashboard ? (
                      <span className="text-rose-600 font-extrabold text-xl">ERROR</span>
                    ) : loadingStates.dashboard ? (
                      <span className="text-slate-400 font-bold text-sm animate-pulse">Memuat...</span>
                    ) : (
                      dashboardData ? dashboardData.stats.totalActiveSchedules : 0
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Slot jadwal pelajaran terdata</p>
                </div>

                {/* 4. Guru Belum Memiliki Jadwal */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Guru Tanpa Jadwal</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700"><AlertTriangle className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {errorStates.dashboard ? (
                      <span className="text-rose-600 font-extrabold text-xl">ERROR</span>
                    ) : loadingStates.dashboard ? (
                      <span className="text-slate-400 font-bold text-sm animate-pulse">Memuat...</span>
                    ) : (
                      dashboardData ? dashboardData.stats.teachersWithoutSchedule : 0
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Perlu penetapan penugasan</p>
                </div>

                {/* 5. Kelas Belum Terjadwal Lengkap */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rombel Tanpa Jadwal</span>
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-700"><AlertCircle className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {errorStates.dashboard ? (
                      <span className="text-rose-600 font-extrabold text-xl">ERROR</span>
                    ) : loadingStates.dashboard ? (
                      <span className="text-slate-400 font-bold text-sm animate-pulse">Memuat...</span>
                    ) : (
                      dashboardData ? dashboardData.stats.classesWithoutSchedule : 0
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Kelas belum memiliki jadwal</p>
                </div>

                {/* 6. Kelengkapan Perangkat Pembelajaran */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Perangkat Ajar</span>
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700"><FolderOpen className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {errorStates.dashboard ? (
                      <span className="text-rose-600 font-extrabold text-xl">ERROR</span>
                    ) : loadingStates.dashboard ? (
                      <span className="text-slate-400 font-bold text-sm animate-pulse">Memuat...</span>
                    ) : (
                      dashboardData ? `${dashboardData.stats.materialsPercentage}%` : '0%'
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {dashboardData ? `${dashboardData.stats.teachersWithMaterialCount} guru telah unggah materi` : 'Menghitung...'}
                  </p>
                </div>

                {/* 7. Masalah Akademik Perlu Tindak Lanjut */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Masalah Perlu Tindak Lanjut</span>
                    <div className="p-2 rounded-xl bg-orange-50 text-orange-700"><ShieldCheck className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {errorStates.dashboard ? (
                      <span className="text-rose-600 font-extrabold text-xl">ERROR</span>
                    ) : loadingStates.dashboard ? (
                      <span className="text-slate-400 font-bold text-sm animate-pulse">Memuat...</span>
                    ) : (
                      dashboardData ? dashboardData.stats.academicIssuesCount : 0
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Kombinasi guru tanpa jadwal (${dashboardData?.stats?.teachersWithoutSchedule || 0}), rombel tanpa jadwal (${dashboardData?.stats?.classesWithoutSchedule || 0}), dan rombel tanpa wali kelas (${dashboardData?.stats?.classesWithoutHomeroom || 0})
                  </p>
                </div>
              </div>
            </div>

            {/* Panel MONITORING AKADEMIK */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-wide uppercase">MONITORING AKADEMIK</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status kelengkapan dan kesehatan operasional kurikulum sekolah
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-400">Evaluasi Otomatis</span>
              </div>

              {loadingStates.dashboard ? (
                <div className="text-center py-6 text-slate-400 text-xs animate-pulse">
                  Memuat matriks evaluasi akademik...
                </div>
              ) : dashboardData?.quickMonitoring ? (
                <div className="divide-y divide-slate-100">
                  {Object.entries(dashboardData.quickMonitoring).map(([key, val]: any) => (
                    <div key={key} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{val.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{val.detail}</p>
                      </div>
                      <div className="shrink-0">{getQuickStatusBadge(val.status)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">Data monitoring belum tersedia.</div>
              )}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: KALENDER AKADEMIK */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'kalender' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Calendar className="w-7 h-7 text-emerald-600" />
                  <span>Kalender Akademik Sekolah</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Agenda resmi kegiatan akademik semester dan tahun ajaran aktif SMAN 18 Bombana.
                </p>
              </div>
            </div>

            {/* Filter Bar Kalender */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={calendarSearch}
                  onChange={(e) => setCalendarSearch(e.target.value)}
                  placeholder="Cari agenda akademik..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <select
                value={calendarCategoryFilter}
                onChange={(e) => setCalendarCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="agenda">Agenda Khusus</option>
                <option value="pengumuman">Pengumuman</option>
                <option value="berita">Berita</option>
              </select>
            </div>

            {/* Error State */}
            {errorStates.dashboard && (
              <ModuleErrorState
                title="Agenda Akademik"
                message={errorStates.dashboard}
                onRetry={fetchDashboardData}
              />
            )}

            {/* Loading State */}
            {loadingStates.dashboard && <ModuleLoadingState label="Agenda Akademik" />}

            {/* Konten Agenda */}
            {!loadingStates.dashboard && !errorStates.dashboard && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                {filteredCalendarItems.length > 0 ? (
                  <div className="space-y-3">
                    {filteredCalendarItems.map((item: any) => (
                      <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                              {item.category}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(item.published_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ModuleEmptyState
                    icon={Calendar}
                    title="Belum ada agenda akademik."
                    description="Agenda akademik resmi yang diterbitkan sekolah akan secara otomatis muncul pada kalender ini."
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: JADWAL PELAJARAN (MONITORING & KELOLA MASTER JADWAL) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Clock className="w-7 h-7 text-emerald-600" />
                  <span>Master Jadwal Pelajaran Sekolah</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Atur, tambahkan, dan pantau seluruh distribusi jadwal mata pelajaran, alokasi jam, dan ruang kelas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleOpenAddScheduleModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Jadwal Baru</span>
                </button>

                {/* Toggle Harian / Mingguan */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setScheduleViewMode('harian')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      scheduleViewMode === 'harian' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Tampilan Tabel
                  </button>
                  <button
                    onClick={() => setScheduleViewMode('mingguan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      scheduleViewMode === 'mingguan' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Tampilan Per Hari
                  </button>
                </div>
              </div>
            </div>

            {/* Error State */}
            {errorStates.schedules && (
              <ModuleErrorState
                title="Jadwal Pelajaran"
                message={errorStates.schedules}
                onRetry={fetchSchedules}
              />
            )}

            {/* Filter Bar Jadwal */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  placeholder="Cari mapel, guru, kelas..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={scheduleDayFilter}
                  onChange={(e) => setScheduleDayFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Hari</option>
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>

                <select
                  value={scheduleTeacherFilter}
                  onChange={(e) => setScheduleTeacherFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-[180px]"
                >
                  <option value="all">Semua Guru</option>
                  {schedulesData?.filterOptions?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={scheduleClassFilter}
                  onChange={(e) => setScheduleClassFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Kelas</option>
                  {schedulesData?.filterOptions?.classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={scheduleGradeFilter}
                  onChange={(e) => setScheduleGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Tingkat</option>
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loadingStates.schedules && <ModuleLoadingState label="Jadwal Pelajaran" />}

            {/* Tabel / Grid Jadwal */}
            {!loadingStates.schedules && !errorStates.schedules && (
              scheduleViewMode === 'harian' ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Hari &amp; Jam</th>
                          <th className="py-3.5 px-6">Mata Pelajaran</th>
                          <th className="py-3.5 px-6">Guru Pengajar</th>
                          <th className="py-3.5 px-6">Kelas &amp; Ruang</th>
                          <th className="py-3.5 px-6 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {filteredSchedules.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400">
                              Tidak ada jadwal yang sesuai dengan filter atau belum terdaftar.
                            </td>
                          </tr>
                        ) : (
                          filteredSchedules.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-6">
                                <span className="font-bold text-slate-800">{item.day}</span>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {item.start_time} - {item.end_time} WITA
                                </div>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="font-bold text-emerald-800">{item.subject}</span>
                              </td>
                              <td className="py-3.5 px-6">
                                <div className="font-medium text-slate-800">{item.teacher?.name || '—'}</div>
                                <div className="text-xs text-slate-400">@{item.teacher?.username}</div>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                  {item.class?.name || '—'}
                                </span>
                                {item.room && (
                                  <span className="ml-2 text-xs text-slate-400">({item.room})</span>
                                )}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditScheduleModal(item)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                                    title="Edit Jadwal"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setScheduleToDelete(item)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Hapus Jadwal"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Tampilan Per Hari */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((dayName) => {
                    const daySchedules = filteredSchedules.filter((s: any) => s.day === dayName);
                    return (
                      <div key={dayName} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>{dayName}</span>
                          </h4>
                          <span className="text-[11px] font-bold text-slate-400">
                            {daySchedules.length} Sesi
                          </span>
                        </div>
                        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-96">
                          {daySchedules.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-400">
                              Tidak ada jadwal pada hari {dayName}
                            </div>
                          ) : (
                            daySchedules.map((s: any) => (
                              <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100/80 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-800">{s.subject}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    {s.class?.name}
                                  </span>
                                </div>
                                <div className="text-slate-600 font-medium">{s.teacher?.name}</div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                                  <div className="text-[11px] text-slate-400">
                                    {s.start_time} - {s.end_time} WITA {s.room ? `• ${s.room}` : ''}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleOpenEditScheduleModal(s)}
                                      className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-white transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setScheduleToDelete(s)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: PEMBAGIAN TUGAS GURU */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'tugas-guru' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <ClipboardList className="w-7 h-7 text-emerald-600" />
                  <span>Pembagian Tugas Mengajar Guru</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pemantauan distribusi mata pelajaran, rombel binaan, dan beban jam mengajar tenaga pendidik.
                </p>
              </div>
            </div>

            {/* Error State */}
            {errorStates.teachers && (
              <ModuleErrorState
                title="Pembagian Tugas Guru"
                message={errorStates.teachers}
                onRetry={fetchTeachers}
              />
            )}

            {/* Ringkasan Beban Mengajar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-400">Guru Bertugas</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {loadingStates.teachers ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    teachersData?.teachersWithTasksCount ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Guru yang telah dialokasikan jadwal</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-400">Guru Belum Ada Tugas</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {loadingStates.teachers ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    teachersData?.teachersWithoutTasksCount ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Perlu koordinasi penugasan mata pelajaran</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-400">Total Slot Sesi Terjadwal</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {loadingStates.teachers ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    teachersData?.totalScheduleSlots ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Total alokasi sesi pertemuan terjadwal</p>
              </div>
            </div>

            {/* Filter Bar Lengkap (Guru, Mapel, Kelas, Tingkat, Cari) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={taskTeacherSearch}
                  onChange={(e) => setTaskTeacherSearch(e.target.value)}
                  placeholder="Cari guru, mapel..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={taskTeacherFilter}
                  onChange={(e) => setTaskTeacherFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-[170px]"
                >
                  <option value="all">Semua Guru</option>
                  {teachersData?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={taskSubjectFilter}
                  onChange={(e) => setTaskSubjectFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-[160px]"
                >
                  <option value="all">Semua Mapel</option>
                  {allSubjects.map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>

                <select
                  value={taskClassFilter}
                  onChange={(e) => setTaskClassFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Kelas</option>
                  {classesData?.classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={taskGradeFilter}
                  onChange={(e) => setTaskGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Tingkat</option>
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loadingStates.teachers && <ModuleLoadingState label="Pembagian Tugas Guru" />}

            {/* Tabel Penugasan Guru */}
            {!loadingStates.teachers && !errorStates.teachers && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Guru</th>
                        <th className="py-3.5 px-6">Mata Pelajaran</th>
                        <th className="py-3.5 px-6">Kelas / Rombel</th>
                        <th className="py-3.5 px-6">Jam / Alokasi Sesi</th>
                        <th className="py-3.5 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            Tidak ada data pembagian tugas guru yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map((teacher: any) => {
                          const hasTasks = teacher.teaching_schedules.length > 0;
                          const subjectsTaught = Array.from(
                            new Set(teacher.teaching_schedules.map((s: any) => s.subject))
                          );
                          const classesTaught = Array.from(
                            new Set(teacher.teaching_schedules.map((s: any) => s.class?.name).filter(Boolean))
                          );

                          return (
                            <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 px-6">
                                <div className="font-bold text-slate-800">{teacher.name}</div>
                                <div className="text-xs text-slate-400">@{teacher.username}</div>
                                {teacher.homeroom_classes?.length > 0 && (
                                  <span className="inline-block mt-1 text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                                    Wali Kelas {teacher.homeroom_classes[0].name}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                {hasTasks ? (
                                  <span className="font-semibold text-emerald-800">
                                    {subjectsTaught.join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Belum ditentukan</span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                {hasTasks ? (
                                  <span className="text-slate-700 font-medium">
                                    {classesTaught.join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">—</span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                {hasTasks ? (
                                  <div>
                                    <span className="font-bold text-slate-900">
                                      {teacher.teaching_schedules.length} Sesi Terjadwal
                                    </span>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      {teacher.teaching_schedules[0]?.day} ({teacher.teaching_schedules[0]?.start_time} - {teacher.teaching_schedules[0]?.end_time})
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">0 Sesi</span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                {hasTasks ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Aktif Bertugas
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Belum Ada Tugas
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: DATA GURU (READ-ONLY DIREKTORI) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'guru' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Users className="w-7 h-7 text-emerald-600" />
                  <span>Direktori Tenaga Pendidik</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Data tenaga pendidik kurikulum (Guru Mapel, Wali Kelas, Guru BK) secara terintegrasi.
                </p>
              </div>
            </div>

            {/* Error State */}
            {errorStates.teachers && (
              <ModuleErrorState
                title="Data Guru"
                message={errorStates.teachers}
                onRetry={fetchTeachers}
              />
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Cari nama, email, username..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <select
                value={teacherRoleFilter}
                onChange={(e) => setTeacherRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">Semua Role Guru</option>
                <option value="guru_mapel">Guru Mapel</option>
                <option value="wali_kelas">Wali Kelas</option>
                <option value="guru_bk">Guru BK</option>
                <option value="guru">Guru (Legacy)</option>
              </select>
            </div>

            {/* Loading State */}
            {loadingStates.teachers && <ModuleLoadingState label="Data Guru" />}

            {/* Tabel Direktori Guru */}
            {!loadingStates.teachers && !errorStates.teachers && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Nama Guru</th>
                        <th className="py-3.5 px-6">Peran / Jabatan</th>
                        <th className="py-3.5 px-6">Status Akun</th>
                        <th className="py-3.5 px-6">Sesi Jadwal</th>
                        <th className="py-3.5 px-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            Tidak ada data guru yang sesuai.
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((teacher: any) => (
                          <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-800">{teacher.name}</div>
                              <div className="text-xs text-slate-400">
                                @{teacher.username} • {teacher.email}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {teacher.role}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {teacher.is_active ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Nonaktif</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-800">
                                {teacher.teaching_schedules?.length || 0} Sesi
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => setSelectedTeacherDetail(teacher)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: KELAS & ROMBEL (TERINTEGRASI DENGAN MASTER DATA SISWA) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'kelas' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Building2 className="w-7 h-7 text-emerald-600" />
                  <span>Monitoring Kelas &amp; Rombongan Belajar</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Data kelas terintegrasi dengan Master Data Siswa resmi SMAN 18 Bombana.
                </p>
              </div>
            </div>

            {/* Error State */}
            {errorStates.classes && (
              <ModuleErrorState
                title="Kelas & Rombel"
                message={errorStates.classes}
                onRetry={fetchClasses}
              />
            )}

            {/* Loading State */}
            {loadingStates.classes && <ModuleLoadingState label="Kelas & Rombel" />}

            {/* Cards Grid Kelas */}
            {!loadingStates.classes && !errorStates.classes && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classesData?.classes?.map((cls: any) => (
                  <div
                    key={cls.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Tingkat {cls.grade}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          TA {cls.academic_year}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        Kelas {cls.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Wali Kelas: <strong>{cls.homeroom_teacher?.name || 'Belum Ditugaskan'}</strong>
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Jumlah Siswa Aktif:</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {cls._count?.students || 0} Siswa
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Jadwal Terdaftar:</span>
                        <span className="font-bold text-emerald-700">
                          {cls._count?.schedules || 0} Sesi
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenClassSchedule(cls)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Jadwal Kelas</span>
                      </button>
                      <button
                        onClick={() => handleOpenClassDetail(cls.id)}
                        className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Daftar Siswa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: PERANGKAT PEMBELAJARAN */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'perangkat' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <FolderOpen className="w-7 h-7 text-emerald-600" />
                  <span>Monitoring Perangkat Pembelajaran</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pantau modul ajar, materi, dan kelengkapan administrasi guru mata pelajaran.
                </p>
              </div>
            </div>

            {/* Error State */}
            {errorStates.materials && (
              <ModuleErrorState
                title="Perangkat Pembelajaran"
                message={errorStates.materials}
                onRetry={fetchMaterials}
              />
            )}

            {/* Indikator Kelengkapan Materi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-400">Total Perangkat Ajar</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {loadingStates.materials ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    materialsData?.summary?.totalMaterials ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Modul &amp; materi terunggah di database</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-400">Guru Sudah Memiliki Materi</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {loadingStates.materials ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    materialsData?.summary?.teachersWithMaterialsCount ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Telah mengunggah minimal 1 perangkat</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-400">Guru Belum Memiliki Materi</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {loadingStates.materials ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    materialsData?.summary?.teachersWithoutMaterialsCount ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Perlu dorongan kelengkapan modul</p>
              </div>
            </div>

            {/* Filter Bar (Guru, Kelas, Periode, Cari) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  placeholder="Cari judul materi, mapel..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={materialTeacherFilter}
                  onChange={(e) => setMaterialTeacherFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-[180px]"
                >
                  <option value="all">Semua Guru</option>
                  {materialsData?.filterOptions?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={materialClassFilter}
                  onChange={(e) => setMaterialClassFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Kelas</option>
                  {materialsData?.filterOptions?.classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={materialPeriodFilter}
                  onChange={(e) => setMaterialPeriodFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Periode</option>
                  <option value="7d">7 Hari Terakhir</option>
                  <option value="30d">30 Hari Terakhir</option>
                  <option value="90d">3 Bulan Terakhir</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loadingStates.materials && <ModuleLoadingState label="Perangkat Pembelajaran" />}

            {/* Tabel Perangkat Ajar */}
            {!loadingStates.materials && !errorStates.materials && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Judul Materi</th>
                        <th className="py-3.5 px-6">Guru Pengunggah</th>
                        <th className="py-3.5 px-6">Mata Pelajaran</th>
                        <th className="py-3.5 px-6">Kelas Sasaran</th>
                        <th className="py-3.5 px-6">Tanggal Unggah</th>
                        <th className="py-3.5 px-6">Jenis</th>
                        <th className="py-3.5 px-6 text-center">File / Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {filteredMaterials.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Tidak ada perangkat pembelajaran yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredMaterials.map((mat: any) => (
                          <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-800">{mat.title}</div>
                              {mat.description && (
                                <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{mat.description}</div>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-medium text-slate-800">{mat.teacher?.name}</div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-emerald-800">{mat.subject}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                                {mat.class?.name || 'Umum'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-500">
                              {new Date(mat.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-4 px-6">
                              {mat.file_url ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  Dokumen
                                </span>
                              ) : mat.link_url ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  Tautan
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                  Materi Teks
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              {mat.file_url ? (
                                <a
                                  href={mat.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Unduh</span>
                                </a>
                              ) : mat.link_url ? (
                                <a
                                  href={mat.link_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs border border-blue-200 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Buka</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: MONITORING PEMBELAJARAN (MATRIKS LENGKAP / PERHATIAN) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  <span>Matriks Monitoring Ketercapaian Pembelajaran</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Evaluasi korelasi jadwal mengajar aktif vs ketersediaan modul perangkat ajar per guru.
                </p>
              </div>
            </div>

            {/* Error State */}
            {errorStates.monitoring && (
              <ModuleErrorState
                title="Matriks Monitoring"
                message={errorStates.monitoring}
                onRetry={fetchMonitoring}
              />
            )}

            {/* Ringkasan Status Matriks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-emerald-800">✓ Lengkap</span>
                <div className="text-2xl font-extrabold text-emerald-900 mt-1">
                  {loadingStates.monitoring ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    monitoringData?.summary?.completeCount ?? 0
                  )}
                </div>
                <p className="text-xs text-emerald-700 mt-0.5">Jadwal dan perangkat ajar terpenuhi</p>
              </div>
              <div className="p-5 rounded-3xl bg-amber-50/60 border border-amber-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-amber-800">⚠ Perlu Perhatian</span>
                <div className="text-2xl font-extrabold text-amber-900 mt-1">
                  {loadingStates.monitoring ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    monitoringData?.summary?.attentionCount ?? 0
                  )}
                </div>
                <p className="text-xs text-amber-700 mt-0.5">Jadwal aktif namun modul belum diunggah</p>
              </div>
              <div className="p-5 rounded-3xl bg-slate-100/70 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-600">— Belum Ada Data</span>
                <div className="text-2xl font-extrabold text-slate-800 mt-1">
                  {loadingStates.monitoring ? (
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Memuat...</span>
                  ) : (
                    monitoringData?.summary?.emptyCount ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Belum dialokasikan jadwal maupun materi</p>
              </div>
            </div>

            {/* Filter Matriks */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={monitoringSearch}
                  onChange={(e) => setMonitoringSearch(e.target.value)}
                  placeholder="Cari guru, mapel, kelas..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={monitoringStatusFilter}
                  onChange={(e) => setMonitoringStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="Lengkap">✓ Lengkap</option>
                  <option value="Perlu Perhatian">⚠ Perlu Perhatian</option>
                  <option value="Belum Ada Data">— Belum Ada Data</option>
                </select>

                <select
                  value={monitoringTeacherFilter}
                  onChange={(e) => setMonitoringTeacherFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-[200px]"
                >
                  <option value="all">Semua Guru</option>
                  {monitoringData?.filterOptions?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loadingStates.monitoring && <ModuleLoadingState label="Matriks Monitoring" />}

            {/* Tabel Matriks Monitoring */}
            {!loadingStates.monitoring && !errorStates.monitoring && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Guru Pengajar</th>
                        <th className="py-3.5 px-6">Kelas &amp; Mapel</th>
                        <th className="py-3.5 px-6">Sesi Jadwal</th>
                        <th className="py-3.5 px-6">Perangkat Ajar</th>
                        <th className="py-3.5 px-6">Status Monitoring</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {filteredMonitoringItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            Tidak ada item monitoring yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredMonitoringItems.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-800">{item.teacherName}</div>
                              <div className="text-xs text-slate-400">{item.teacherRole}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-emerald-800">{item.subject}</div>
                              <div className="text-xs text-slate-500 mt-0.5">Rombel: {item.className}</div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-800">{item.scheduleCount} Sesi</span>
                              {item.scheduleDetails?.length > 0 && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {item.scheduleDetails[0]}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-800">{item.materialCount} Berkas</span>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                {getMatrixStatusBadge(item.status)}
                                <div className="text-[10px] text-slate-400 mt-1 max-w-xs leading-tight">
                                  {item.statusReason}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 9: REKAP AKADEMIK */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'rekap' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Layers className="w-7 h-7 text-emerald-600" />
                  <span>Rekapitulasi Data Akademik Sekolah</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Agregasi distribusi jadwal, beban ajar guru, rombel, dan rekap tugas dari basis data PostgreSQL.
                </p>
              </div>
            </div>

            {/* Error State */}
            {errorStates.statistics && (
              <ModuleErrorState
                title="Rekapitulasi Akademik"
                message={errorStates.statistics}
                onRetry={fetchStatistics}
              />
            )}

            {/* Loading State */}
            {loadingStates.statistics && <ModuleLoadingState label="Rekapitulasi Akademik" />}

            {!loadingStates.statistics && !errorStates.statistics && (
              <>
                {/* 1. Global Totals */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Guru</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{statisticsData?.totals?.totalTeachers ?? 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Rombel</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{statisticsData?.totals?.totalClasses ?? 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Siswa</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{statisticsData?.totals?.totalStudents ?? 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Jadwal</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{statisticsData?.totals?.totalSchedules ?? 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Perangkat Ajar</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{statisticsData?.totals?.totalMaterials ?? 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Tugas</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{statisticsData?.totals?.totalAssignments ?? 0}</div>
                  </div>
                </div>

                {/* 2. Rekap Guru */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Rekapitulasi Beban Mengajar Tenaga Pendidik</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px]">
                          <th className="py-2.5 px-4">Nama Guru</th>
                          <th className="py-2.5 px-4">Role</th>
                          <th className="py-2.5 px-4 text-center">Sesi Jadwal</th>
                          <th className="py-2.5 px-4 text-center">Perangkat Ajar</th>
                          <th className="py-2.5 px-4 text-center">Tugas Aktif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statisticsData?.teacherBreakdown?.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{t.name}</td>
                            <td className="py-2.5 px-4 text-slate-500">{t.role}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-slate-900">{t.scheduleCount} Sesi</td>
                            <td className="py-2.5 px-4 text-center">{t.materialCount} Berkas</td>
                            <td className="py-2.5 px-4 text-center">{t.assignmentCount} Tugas</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Rekap Rombel */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Rekapitulasi Kelas &amp; Rombongan Belajar</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px]">
                          <th className="py-2.5 px-4">Nama Kelas</th>
                          <th className="py-2.5 px-4">Tingkat</th>
                          <th className="py-2.5 px-4">Wali Kelas</th>
                          <th className="py-2.5 px-4 text-center">Siswa Aktif</th>
                          <th className="py-2.5 px-4 text-center">Jadwal Sesi</th>
                          <th className="py-2.5 px-4 text-center">Perangkat Ajar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statisticsData?.classBreakdown?.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-bold text-slate-800">Kelas {c.name}</td>
                            <td className="py-2.5 px-4 text-slate-500">Tingkat {c.grade}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-700">{c.homeroomTeacher}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-slate-900">{c.studentCount} Siswa</td>
                            <td className="py-2.5 px-4 text-center font-semibold text-emerald-700">{c.scheduleCount} Sesi</td>
                            <td className="py-2.5 px-4 text-center">{c.materialCount} Berkas</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Rekap Jadwal: Distribusi Hari & Mapel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Distribusi Alokasi Jadwal Berdasarkan Hari</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {statisticsData?.dayDistribution &&
                        Object.entries(statisticsData.dayDistribution).map(([day, count]: any) => (
                          <div key={day} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-xs font-bold text-slate-600">{day}</span>
                            <div className="text-lg font-extrabold text-emerald-800 mt-1">{count} Sesi</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Mata Pelajaran dengan Alokasi Sesi Terbanyak</span>
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {statisticsData?.topSubjects?.map((item: any) => (
                        <div key={item.subject} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                          <span className="font-bold text-slate-800">{item.subject}</span>
                          <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                            {item.count} Sesi Jadwal
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Aktivitas Akademik */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Aktivitas &amp; Pengumuman Akademik Terkini</span>
                  </h3>
                  {dashboardData?.recentAnnouncements && dashboardData.recentAnnouncements.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {dashboardData.recentAnnouncements.slice(0, 5).map((a: any) => (
                        <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{a.title}</span>
                            <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              {a.category}
                            </span>
                          </div>
                          <span className="text-slate-400">
                            {new Date(a.published_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada catatan aktivitas akademik terbaru.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 10: LAPORAN KURIKULUM */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'laporan' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <FileText className="w-7 h-7 text-emerald-600" />
                  <span>Pusat Laporan Eksekutif Kurikulum</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Kompilasi ringkasan data resmi kurikulum sekolah siap cetak untuk laporan berkala.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Laporan</span>
              </button>
            </div>

            {/* Sub-report Selector */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2 print:hidden">
              <button
                onClick={() => setReportSection('eksekutif')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reportSection === 'eksekutif' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Laporan Lengkap
              </button>
              <button
                onClick={() => setReportSection('jadwal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reportSection === 'jadwal' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Laporan Jadwal
              </button>
              <button
                onClick={() => setReportSection('tugas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reportSection === 'tugas' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rekap Pembagian Tugas
              </button>
              <button
                onClick={() => setReportSection('kelas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reportSection === 'kelas' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rekap Kelas &amp; Rombel
              </button>
              <button
                onClick={() => setReportSection('perangkat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reportSection === 'perangkat' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rekap Perangkat Ajar
              </button>
              <button
                onClick={() => setReportSection('monitoring')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reportSection === 'monitoring' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rekap Monitoring Akademik
              </button>
            </div>

            {/* Lembar Cetak Laporan Resmi */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6 print:border-none print:shadow-none">
              {/* Kop Surat Resmi */}
              <div className="text-center pb-6 border-b border-slate-200">
                <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                  PEMERINTAH PROVINSI SULAWESI TENGGARA • DINAS PENDIDIKAN DAN KEBUDAYAAN
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase">
                  SMA NEGERI 18 BOMBANA
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laporan Resmi Monitoring dan Evaluasi Kurikulum Semester • Tahun Ajaran 2026/2027
                </p>
              </div>

              {/* Bagian 1: Ringkasan Eksekutif */}
              {(reportSection === 'eksekutif' || reportSection === 'monitoring') && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1">
                    I. Ringkasan Eksekutif Akademik
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block">Total Tenaga Pendidik</span>
                      <strong className="text-slate-800 text-sm">{dashboardData?.stats?.totalTeachers || 0} Orang</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block">Total Rombel Siswa</span>
                      <strong className="text-slate-800 text-sm">{dashboardData?.stats?.totalClasses || 0} Kelas</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block">Alokasi Sesi Jadwal</span>
                      <strong className="text-slate-800 text-sm">{dashboardData?.stats?.totalActiveSchedules || 0} Sesi</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block">Kelengkapan Perangkat</span>
                      <strong className="text-slate-800 text-sm">{dashboardData?.stats?.materialsPercentage || 0}% Terpenuhi</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Bagian 2: Rekapitulasi Beban Kerja Mengajar */}
              {(reportSection === 'eksekutif' || reportSection === 'tugas') && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1">
                    II. Rekapitulasi Pembagian Tugas &amp; Beban Kerja Mengajar Guru
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                          <th className="py-2 px-4">Nama Guru</th>
                          <th className="py-2 px-4">Peran</th>
                          <th className="py-2 px-4 text-center">Jumlah Sesi Jadwal</th>
                          <th className="py-2 px-4 text-center">Perangkat Ajar</th>
                          <th className="py-2 px-4 text-center">Tugas Diberikan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statisticsData?.teacherBreakdown?.map((t: any) => (
                          <tr key={t.id}>
                            <td className="py-2 px-4 font-semibold text-slate-800">{t.name}</td>
                            <td className="py-2 px-4 text-slate-500">{t.role}</td>
                            <td className="py-2 px-4 text-center font-bold">{t.scheduleCount} Sesi</td>
                            <td className="py-2 px-4 text-center">{t.materialCount} Berkas</td>
                            <td className="py-2 px-4 text-center">{t.assignmentCount} Tugas</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bagian 3: Rekapitulasi Rombel */}
              {(reportSection === 'eksekutif' || reportSection === 'kelas') && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1">
                    III. Rekapitulasi Kondisi Kelas &amp; Rombel Siswa
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                          <th className="py-2 px-4">Kelas</th>
                          <th className="py-2 px-4">Tingkat</th>
                          <th className="py-2 px-4">Wali Kelas</th>
                          <th className="py-2 px-4 text-center">Jumlah Siswa</th>
                          <th className="py-2 px-4 text-center">Sesi Terjadwal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statisticsData?.classBreakdown?.map((c: any) => (
                          <tr key={c.id}>
                            <td className="py-2 px-4 font-bold text-slate-800">Kelas {c.name}</td>
                            <td className="py-2 px-4 text-slate-500">Tingkat {c.grade}</td>
                            <td className="py-2 px-4 text-slate-700">{c.homeroomTeacher}</td>
                            <td className="py-2 px-4 text-center font-bold">{c.studentCount} Siswa</td>
                            <td className="py-2 px-4 text-center">{c.scheduleCount} Sesi</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bagian 4: Laporan Jadwal */}
              {(reportSection === 'eksekutif' || reportSection === 'jadwal') && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1">
                    IV. Laporan Master Jadwal Pelajaran Sekolah
                  </h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                          <th className="py-2 px-4">Hari &amp; Jam</th>
                          <th className="py-2 px-4">Mata Pelajaran</th>
                          <th className="py-2 px-4">Guru Pengajar</th>
                          <th className="py-2 px-4">Kelas &amp; Ruang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(schedulesData?.schedules || []).slice(0, 30).map((s: any) => (
                          <tr key={s.id}>
                            <td className="py-2 px-4 font-medium text-slate-800">{s.day}, {s.start_time} - {s.end_time} WITA</td>
                            <td className="py-2 px-4 font-bold text-emerald-800">{s.subject}</td>
                            <td className="py-2 px-4 text-slate-700">{s.teacher?.name}</td>
                            <td className="py-2 px-4 text-slate-600">{s.class?.name} {s.room ? `(${s.room})` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bagian 5: Rekap Perangkat Pembelajaran */}
              {(reportSection === 'eksekutif' || reportSection === 'perangkat') && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1">
                    V. Rekapitulasi Perangkat Pembelajaran Terdata
                  </h3>
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                          <th className="py-2 px-4">Judul Perangkat</th>
                          <th className="py-2 px-4">Mata Pelajaran</th>
                          <th className="py-2 px-4">Guru</th>
                          <th className="py-2 px-4">Kelas</th>
                          <th className="py-2 px-4">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(materialsData?.materials || []).slice(0, 20).map((m: any) => (
                          <tr key={m.id}>
                            <td className="py-2 px-4 font-bold text-slate-800">{m.title}</td>
                            <td className="py-2 px-4 text-emerald-800">{m.subject}</td>
                            <td className="py-2 px-4 text-slate-700">{m.teacher?.name}</td>
                            <td className="py-2 px-4 text-slate-600">{m.class?.name || 'Umum'}</td>
                            <td className="py-2 px-4 text-slate-500">
                              {new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tanda Tangan */}
              <div className="pt-8 flex justify-between text-xs text-slate-700 break-inside-avoid">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">{dashboardData?.principal?.position || 'Kepala Sekolah'}</p>
                  <div className="h-16" />
                  <p className="font-extrabold underline">{dashboardData?.principal?.name || 'Belum ditetapkan'}</p>
                  <p className="text-slate-500">{dashboardData?.principal?.nip || 'NIP. -'}</p>
                </div>
                <div className="text-right">
                  <p>Poleang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold">Wakasek Bidang Kurikulum</p>
                  <div className="h-16" />
                  <p className="font-extrabold underline">{user.name}</p>
                  <p className="text-slate-500">Akun: @{user.username}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 11: NOTIFIKASI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'notifikasi' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Bell className="w-7 h-7 text-emerald-600" />
                  <span>Pemberitahuan &amp; Informasi Kurikulum</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pengumuman resmi dan siaran akademik internal SMAN 18 Bombana.
                </p>
              </div>
            </div>

            {/* Filter Bar Notifikasi */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={notificationSearch}
                  onChange={(e) => setNotificationSearch(e.target.value)}
                  placeholder="Cari notifikasi / pengumuman..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <select
                value={notificationCategoryFilter}
                onChange={(e) => setNotificationCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="pengumuman">Pengumuman</option>
                <option value="agenda">Agenda</option>
                <option value="berita">Berita</option>
              </select>
            </div>

            {/* Error State */}
            {errorStates.dashboard && (
              <ModuleErrorState
                title="Pemberitahuan & Pengumuman"
                message={errorStates.dashboard}
                onRetry={fetchDashboardData}
              />
            )}

            {/* Loading State */}
            {loadingStates.dashboard && <ModuleLoadingState label="Pemberitahuan Kurikulum" />}

            {/* Daftar Notifikasi */}
            {!loadingStates.dashboard && !errorStates.dashboard && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                {filteredNotifications.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {filteredNotifications.map((item: any) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                            {item.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.published_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ModuleEmptyState
                    icon={Bell}
                    title="Belum ada notifikasi atau pengumuman baru."
                    description="Seluruh pengumuman resmi dan informasi kurikulum akan ditampilkan di panel ini."
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 12: PENGATURAN AKUN */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'pengaturan' && (
          <div className="space-y-6 animate-fadeIn max-w-xl">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Settings className="w-7 h-7 text-emerald-600" />
                <span>Pengaturan Akun</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kelola keamanan akun Wakasek Kurikulum Anda melalui sistem otentikasi resmi.
              </p>
            </div>

            {passwordError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Ganti Password Akun</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Pastikan Anda menggunakan password yang kuat dan mudah diingat.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Lama
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isChangingPassword ? 'Memproses...' : 'Simpan Password Baru'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DETAIL KELAS: MENAMPILKAN SISWA AKTIF DARI MASTER DATA SISWA */}
      {/* ------------------------------------------------------------- */}
      {selectedClassDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  Tingkat {selectedClassDetail.grade}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Detail Rombel Kelas {selectedClassDetail.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Wali Kelas: <strong>{selectedClassDetail.homeroom_teacher?.name || 'Belum Ada'}</strong> • TA {selectedClassDetail.academic_year}
                </p>
              </div>
              <button
                onClick={() => setSelectedClassDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Siswa Aktif ({selectedClassDetail.students?.length || 0} Siswa)</span>
                </h4>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  Master Data Siswa
                </span>
              </div>

              {selectedClassDetail.students?.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada data siswa aktif yang terdaftar di kelas ini.
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                        <th className="py-2.5 px-4">No</th>
                        <th className="py-2.5 px-4">Nama Siswa</th>
                        <th className="py-2.5 px-4">NIS / NISN</th>
                        <th className="py-2.5 px-4">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClassDetail.students.map((st: any, idx: number) => (
                        <tr key={st.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{st.name}</td>
                          <td className="py-2.5 px-4 text-slate-500">{st.nis || '—'} / {st.nisn || '—'}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              {st.gender === 'L' ? 'Laki-laki' : st.gender === 'P' ? 'Perempuan' : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedClassDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL DETAIL GURU */}
      {/* ------------------------------------------------------------- */}
      {selectedTeacherDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedTeacherDetail.name}
                </h3>
                <p className="text-xs text-slate-500">
                  @{selectedTeacherDetail.username} • {selectedTeacherDetail.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeacherDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p><strong>Role:</strong> {selectedTeacherDetail.role}</p>
                <p><strong>Status:</strong> {selectedTeacherDetail.is_active ? 'Aktif' : 'Nonaktif'}</p>
                <p><strong>Jumlah Sesi Jadwal:</strong> {selectedTeacherDetail.teaching_schedules?.length || 0} Sesi</p>
                <p><strong>Jumlah Perangkat Ajar:</strong> {selectedTeacherDetail.learning_materials?.length || 0} Berkas</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Jadwal Mengajar Terdaftar:</h4>
                {selectedTeacherDetail.teaching_schedules?.length === 0 ? (
                  <p className="text-slate-400 italic">Belum memiliki jadwal mengajar.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedTeacherDetail.teaching_schedules.map((s: any) => (
                      <div key={s.id} className="p-2 bg-emerald-50/60 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-emerald-800">{s.subject}</span>
                          <span className="text-slate-500 ml-1">({s.class?.name})</span>
                        </div>
                        <span className="text-slate-500 text-[11px]">{s.day}, {s.start_time}-{s.end_time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedTeacherDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: FORM TAMBAH / EDIT JADWAL PELAJARAN (MASTER DATA) */}
      {/* ------------------------------------------------------------- */}
      {(isAddScheduleModalOpen || isEditScheduleModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>{isEditScheduleModalOpen ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran Baru'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Master Data Jadwal Sekolah • Ditetapkan oleh Wakasek Kurikulum
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddScheduleModalOpen(false);
                  setIsEditScheduleModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {/* Guru Pengajar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Guru Pengajar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={scheduleForm.teacher_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, teacher_id: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="" disabled>Pilih Guru Pengajar</option>
                  {(schedulesData?.filterOptions?.teachers || teachersData?.teachers || []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.role ? `(${t.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kelas / Rombel */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kelas / Rombongan Belajar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={scheduleForm.class_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, class_id: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="" disabled>Pilih Kelas</option>
                  {(schedulesData?.filterOptions?.classes || classesData?.classes || []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.grade ? `(Kelas ${c.grade})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={scheduleForm.subject}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                  placeholder="Contoh: Matematika Wajib, Bahasa Indonesia..."
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Hari & Ruang */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hari <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={scheduleForm.day}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ruang / Tempat (Opsional)
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.room}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    placeholder="Contoh: R. LAB 1, R. X-A"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jam Mulai & Jam Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jam Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jam Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-start gap-2 text-emerald-800 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  Jadwal ini akan otomatis menjadi <strong>Master Jadwal</strong> yang tampil di jadwal guru pengajar yang bersangkutan serta jadwal pelajaran kelas bagi siswa dan wali kelas.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddScheduleModalOpen(false);
                    setIsEditScheduleModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer"
                >
                  {isSavingSchedule ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{isEditScheduleModalOpen ? 'Simpan Perubahan' : 'Tambah Jadwal'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: DIALOG KONFIRMASI HAPUS JADWAL */}
      {/* ------------------------------------------------------------- */}
      {scheduleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Hapus Jadwal Pelajaran?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Jadwal yang dihapus dari Master Data tidak akan tampil lagi di jadwal guru pengajar maupun jadwal pelajaran kelas siswa.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div><strong>Mata Pelajaran:</strong> {scheduleToDelete.subject}</div>
              <div><strong>Guru:</strong> {scheduleToDelete.teacher?.name || '—'}</div>
              <div><strong>Kelas:</strong> {scheduleToDelete.class?.name || '—'}</div>
              <div><strong>Waktu:</strong> {scheduleToDelete.day}, {scheduleToDelete.start_time} - {scheduleToDelete.end_time} WITA</div>
              {scheduleToDelete.room && <div><strong>Ruang:</strong> {scheduleToDelete.room}</div>}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setScheduleToDelete(null)}
                disabled={isDeletingSchedule}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSchedule}
                disabled={isDeletingSchedule}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm shadow-rose-600/30 cursor-pointer"
              >
                {isDeletingSchedule ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Hapus Jadwal</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: JADWAL PELAJARAN KELAS (BERDASARKAN CLASS_ID DARI MASTER DATA) */}
      {/* ------------------------------------------------------------- */}
      {selectedClassScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>Jadwal Pelajaran Kelas {selectedClassScheduleModal.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tingkat {selectedClassScheduleModal.grade} • Tahun Ajaran {selectedClassScheduleModal.academic_year || 'Aktif'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClassScheduleModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 my-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-start gap-2 text-emerald-800 text-[11px] leading-relaxed shrink-0">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>
                Jadwal ini bersumber langsung dari <strong>Master Jadwal TeachingSchedule</strong> yang ditetapkan oleh Wakasek Kurikulum. Tampilan ini identik dengan jadwal yang dilihat oleh Siswa dan Wali Kelas di rombel ini.
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-4">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((dayName) => {
                const classDaySchedules = (schedulesData?.schedules || []).filter(
                  (s: any) => s.class_id === selectedClassScheduleModal.id && s.day === dayName
                );
                return (
                  <div key={dayName} className="rounded-2xl border border-slate-200/80 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{dayName}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {classDaySchedules.length} Sesi
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {classDaySchedules.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400 italic">
                          Tidak ada kegiatan belajar mengajar pada hari {dayName}.
                        </div>
                      ) : (
                        classDaySchedules.map((s: any) => (
                          <div key={s.id} className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span className="text-emerald-700">{s.subject}</span>
                                {s.room && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {s.room}
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px]">
                                Pengajar: <span className="font-medium text-slate-700">{s.teacher?.name || '—'}</span>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                {s.start_time} - {s.end_time} WITA
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    handleOpenEditScheduleModal(s);
                                  }}
                                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setScheduleToDelete(s);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setScheduleForm({
                    id: '',
                    teacher_id: schedulesData?.filterOptions?.teachers?.[0]?.id || '',
                    class_id: selectedClassScheduleModal.id,
                    subject: '',
                    day: 'Senin',
                    start_time: '07:30',
                    end_time: '09:00',
                    room: '',
                  });
                  setIsAddScheduleModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Jadwal di Kelas Ini</span>
              </button>

              <button
                onClick={() => setSelectedClassScheduleModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
