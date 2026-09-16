'use client';

import React, { useState, useEffect, useMemo } from 'react';
import LogoutButton from './LogoutButton';
import { UserRole } from '@/lib/constants';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CheckSquare,
  BookOpen,
  ClipboardList,
  ShieldAlert,
  Bell,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Upload,
  X,
  ChevronRight,
  Eye,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Send,
  Save,
  Menu,
  FileSpreadsheet,
  Lock,
  UserCheck,
  MapPin,
  Trash2,
  Info,
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

type TeacherTab =
  | 'dashboard'
  | 'jadwal'
  | 'kelas'
  | 'absen'
  | 'materi'
  | 'tugas'
  | 'piket'
  | 'notifikasi'
  | 'pengaturan';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function TeacherView({ user }: Props) {
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Global & Dashboard Data
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    schedulesToday: any[];
    activeAssignments: any[];
    latestAttendances: any[];
    announcements: any[];
    todayPicket: any | null;
    subjects: string[];
    classesTaughtCount: number;
    currentDay: string;
  }>({
    schedulesToday: [],
    activeAssignments: [],
    latestAttendances: [],
    announcements: [],
    todayPicket: null,
    subjects: [],
    classesTaughtCount: 0,
    currentDay: 'Senin',
  });

  // Classes & Students
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [selectedClassRoster, setSelectedClassRoster] = useState<any | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');

  // Schedules
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<'today' | 'weekly'>('weekly');
  const [scheduleDayFilter, setScheduleDayFilter] = useState('all');
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    class_id: '',
    subject: '',
    day: 'Senin',
    start_time: '07:30',
    end_time: '09:00',
    room: '',
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Rekap Absen Bulanan
  const [attendancesHistory, setAttendancesHistory] = useState<any[]>([]);
  const [isLoadingAttendanceHistory, setIsLoadingAttendanceHistory] = useState(false);
  const [absenYear, setAbsenYear] = useState<number>(new Date().getFullYear());
  const [absenMonth, setAbsenMonth] = useState<number>(new Date().getMonth() + 1);
  const [absenClassId, setAbsenClassId] = useState<string>('');
  const [absenSubject, setAbsenSubject] = useState<string>('');
  const [attendanceSheet, setAttendanceSheet] = useState<any[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<string>('Draft');
  const [attendanceNotes, setAttendanceNotes] = useState<string>('');
  const [attendanceExistingId, setAttendanceExistingId] = useState<string | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceAlert, setAttendanceAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Materi & Modul
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialClassFilter, setMaterialClassFilter] = useState('all');
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    subject: '',
    class_id: '',
    description: '',
    file_url: '',
    link_url: '',
  });
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  // Tugas
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'active' | 'past'>('all');
  const [isAddAssignmentModalOpen, setIsAddAssignmentModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    subject: '',
    class_id: '',
    description: '',
    deadline: '',
    attachment_url: '',
  });
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  // Piket
  const [picketHistory, setPicketHistory] = useState<any[]>([]);
  const [isLoadingPicket, setIsLoadingPicket] = useState(false);
  const [allStudentsForPicket, setAllStudentsForPicket] = useState<any[]>([]);
  const [picketDate, setPicketDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [picketConditionSummary, setPicketConditionSummary] = useState<string>('');
  const [picketGeneralNotes, setPicketGeneralNotes] = useState<string>('');
  const [picketViolations, setPicketViolations] = useState<
    Array<{
      student_id: string;
      violation_type: string;
      location: string;
      time: string;
      description: string;
      initial_action: string;
    }>
  >([]);
  const [isSavingPicket, setIsSavingPicket] = useState(false);
  const [picketAlert, setPicketAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pengaturan Akun (Ubah Password)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --------------------------------------------------------------------------
  // INITIAL FETCHERS
  // --------------------------------------------------------------------------

  const fetchDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch('/api/teacher/dashboard');
      const data = await res.json();
      if (res.ok && data.success) {
        setDashboardData(data);
        if (data.subjects && data.subjects.length > 0 && !absenSubject) {
          setAbsenSubject(data.subjects[0]);
          setMaterialForm((prev) => ({ ...prev, subject: data.subjects[0] }));
          setAssignmentForm((prev) => ({ ...prev, subject: data.subjects[0] }));
          setScheduleForm((prev) => ({ ...prev, subject: data.subjects[0] }));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const res = await fetch('/api/teacher/classes');
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes || []);
        if (data.classes.length > 0 && !absenClassId) {
          setAbsenClassId(data.classes[0].id);
          setScheduleForm((prev) => ({ ...prev, class_id: data.classes[0].id }));
          setMaterialForm((prev) => ({ ...prev, class_id: data.classes[0].id }));
          setAssignmentForm((prev) => ({ ...prev, class_id: data.classes[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const res = await fetch('/api/teacher/schedules');
      const data = await res.json();
      if (res.ok && data.success) {
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    setIsLoadingAttendanceHistory(true);
    try {
      const res = await fetch('/api/teacher/attendance');
      const data = await res.json();
      if (res.ok && data.success) {
        setAttendancesHistory(data.attendances || []);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setIsLoadingAttendanceHistory(false);
    }
  };

  const fetchMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const res = await fetch('/api/teacher/materials');
      const data = await res.json();
      if (res.ok && data.success) {
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const res = await fetch('/api/teacher/assignments');
      const data = await res.json();
      if (res.ok && data.success) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const fetchPicketData = async () => {
    setIsLoadingPicket(true);
    try {
      const [resReports, resStudents] = await Promise.all([
        fetch('/api/teacher/picket'),
        fetch('/api/bk/students'),
      ]);
      const dataReports = await resReports.json();
      const dataStudents = await resStudents.json();

      if (resReports.ok && dataReports.success) {
        setPicketHistory(dataReports.reports || []);
      }
      if (resStudents.ok && dataStudents.students) {
        setAllStudentsForPicket(dataStudents.students);
      }
    } catch (error) {
      console.error('Error fetching picket data:', error);
    } finally {
      setIsLoadingPicket(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'jadwal') {
      fetchSchedules();
    } else if (activeTab === 'kelas') {
      fetchClasses();
    } else if (activeTab === 'absen') {
      fetchAttendanceHistory();
    } else if (activeTab === 'materi') {
      fetchMaterials();
    } else if (activeTab === 'tugas') {
      fetchAssignments();
    } else if (activeTab === 'piket') {
      fetchPicketData();
    }
  }, [activeTab]);

  // --------------------------------------------------------------------------
  // HANDLERS: JADWAL MENGAJAR
  // --------------------------------------------------------------------------

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.class_id || !scheduleForm.subject || !scheduleForm.day || !scheduleForm.start_time || !scheduleForm.end_time) {
      alert('Mohon lengkapi semua kolom wajib jadwal mengajar.');
      return;
    }

    setIsSavingSchedule(true);
    try {
      const res = await fetch('/api/teacher/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddScheduleModalOpen(false);
        fetchSchedules();
        fetchDashboardData();
      } else {
        alert(data.error || 'Gagal menambahkan jadwal mengajar.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: REKAP ABSEN BULANAN
  // --------------------------------------------------------------------------

  const handleLoadAttendanceSheet = async () => {
    if (!absenClassId || !absenSubject) {
      alert('Silakan pilih kelas dan isi mata pelajaran terlebih dahulu.');
      return;
    }

    setIsLoadingSheet(true);
    setAttendanceAlert(null);

    try {
      // 1. Ambil data siswa kelas tersebut
      const targetClass = classes.find((c) => c.id === absenClassId);
      const classStudents = targetClass?.students || [];

      // 2. Cek apakah rekap untuk bulan, tahun, kelas, dan mapel ini sudah ada
      const res = await fetch(
        `/api/teacher/attendance?year=${absenYear}&month=${absenMonth}&class_id=${absenClassId}`
      );
      const data = await res.json();

      let existing = null;
      if (res.ok && data.attendances && data.attendances.length > 0) {
        existing = data.attendances.find(
          (a: any) =>
            a.year === absenYear &&
            a.month === absenMonth &&
            a.class_id === absenClassId &&
            a.subject.toLowerCase() === absenSubject.trim().toLowerCase()
        );
      }

      if (existing) {
        setAttendanceExistingId(existing.id);
        setAttendanceStatus(existing.status);
        setAttendanceNotes(existing.notes || '');

        // Petakan item absen yang sudah ada
        const sheetMap = new Map();
        (existing.items || []).forEach((it: any) => {
          sheetMap.set(it.student_id, it);
        });

        const newSheet = classStudents.map((st: any) => {
          const item = sheetMap.get(st.id);
          const present = item ? item.present : 0;
          const sick = item ? item.sick : 0;
          const permission = item ? item.permission : 0;
          const unexcused = item ? item.unexcused : 0;
          return {
            student_id: st.id,
            student_name: st.name,
            student_nis: st.nis || '-',
            gender: st.gender,
            present,
            sick,
            permission,
            unexcused,
            total: present + sick + permission + unexcused,
            notes: item?.notes || '',
          };
        });

        setAttendanceSheet(newSheet);
      } else {
        // Baru: Inisialisasi sheet dengan seluruh siswa kelas target (H, S, I, A = 0)
        setAttendanceExistingId(null);
        setAttendanceStatus('Draft');
        setAttendanceNotes('');

        const newSheet = classStudents.map((st: any) => ({
          student_id: st.id,
          student_name: st.name,
          student_nis: st.nis || '-',
          gender: st.gender,
          present: 0,
          sick: 0,
          permission: 0,
          unexcused: 0,
          total: 0,
          notes: '',
        }));

        setAttendanceSheet(newSheet);
      }
    } catch (error: any) {
      console.error('Error loading attendance sheet:', error);
      setAttendanceAlert({
        type: 'error',
        message: 'Gagal memuat lembar rekap absen.',
      });
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleAttendanceChange = (
    index: number,
    field: 'present' | 'sick' | 'permission' | 'unexcused',
    valStr: string
  ) => {
    const val = Math.max(0, parseInt(valStr) || 0);
    setAttendanceSheet((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: val };
      // Hitung total otomatis (H + S + I + A)
      row.total =
        (row.present || 0) +
        (row.sick || 0) +
        (row.permission || 0) +
        (row.unexcused || 0);
      updated[index] = row;
      return updated;
    });
  };

  const handleSaveAttendance = async (targetStatus: 'Draft' | 'Dikirim') => {
    if (!absenClassId || !absenSubject) {
      alert('Pilih kelas dan mata pelajaran.');
      return;
    }

    if (attendanceSheet.length === 0) {
      alert('Tidak ada data siswa untuk disimpan.');
      return;
    }

    if (targetStatus === 'Dikirim') {
      const confirmSend = confirm(
        'Apakah Anda yakin ingin mengirim rekap absen bulanan ini ke Wakasek Kesiswaan? Setelah dikirim, data akan masuk proses verifikasi.'
      );
      if (!confirmSend) return;
    }

    setIsSavingAttendance(true);
    setAttendanceAlert(null);

    try {
      const payload = {
        id: attendanceExistingId || undefined,
        year: absenYear,
        month: absenMonth,
        class_id: absenClassId,
        subject: absenSubject.trim(),
        status: targetStatus,
        notes: attendanceNotes.trim(),
        items: attendanceSheet.map((row) => ({
          student_id: row.student_id,
          present: row.present,
          sick: row.sick,
          permission: row.permission,
          unexcused: row.unexcused,
          notes: row.notes,
        })),
      };

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAttendanceStatus(targetStatus);
        setAttendanceAlert({
          type: 'success',
          message: data.message || 'Rekap presensi berhasil disimpan.',
        });
        fetchAttendanceHistory();
        fetchDashboardData();
      } else {
        setAttendanceAlert({
          type: 'error',
          message: data.error || 'Gagal menyimpan rekap presensi.',
        });
      }
    } catch (err: any) {
      setAttendanceAlert({
        type: 'error',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: MATERI & MODUL
  // --------------------------------------------------------------------------

  const handleUploadMaterialFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/teacher/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMaterialForm((prev) => ({ ...prev, file_url: data.url }));
        alert('File materi berhasil diunggah!');
      } else {
        alert(data.error || 'Gagal mengunggah file materi.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan unggah file.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.title || !materialForm.subject) {
      alert('Judul materi dan mata pelajaran wajib diisi.');
      return;
    }

    setIsSavingMaterial(true);
    try {
      const res = await fetch('/api/teacher/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAddMaterialModalOpen(false);
        setMaterialForm({
          title: '',
          subject: dashboardData.subjects[0] || '',
          class_id: '',
          description: '',
          file_url: '',
          link_url: '',
        });
        fetchMaterials();
      } else {
        alert(data.error || 'Gagal menyimpan materi pembelajaran.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingMaterial(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: TUGAS
  // --------------------------------------------------------------------------

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !assignmentForm.title ||
      !assignmentForm.subject ||
      !assignmentForm.class_id ||
      !assignmentForm.deadline ||
      !assignmentForm.description
    ) {
      alert('Mohon lengkapi semua kolom tugas wajib.');
      return;
    }

    setIsSavingAssignment(true);
    try {
      const res = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAddAssignmentModalOpen(false);
        setAssignmentForm({
          title: '',
          subject: dashboardData.subjects[0] || '',
          class_id: classes[0]?.id || '',
          description: '',
          deadline: '',
          attachment_url: '',
        });
        fetchAssignments();
        fetchDashboardData();
      } else {
        alert(data.error || 'Gagal membuat tugas.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: PIKET
  // --------------------------------------------------------------------------

  const handleAddViolationToPicket = () => {
    setPicketViolations((prev) => [
      ...prev,
      {
        student_id: allStudentsForPicket[0]?.id || '',
        violation_type: 'Kedisiplinan',
        location: 'Lingkungan Sekolah',
        time: '07:15',
        description: '',
        initial_action: 'Diberikan pembinaan langsung di pos piket',
      },
    ]);
  };

  const handleRemoveViolationFromPicket = (index: number) => {
    setPicketViolations((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleViolationChange = (index: number, field: string, value: string) => {
    setPicketViolations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmitPicketReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPicket(true);
    setPicketAlert(null);

    try {
      const res = await fetch('/api/teacher/picket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: picketDate,
          school_condition_summary: picketConditionSummary.trim(),
          general_notes: picketGeneralNotes.trim(),
          violations: picketViolations,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPicketAlert({
          type: 'success',
          message:
            'Laporan piket harian dan data siswa bermasalah berhasil disimpan ke Satu Data Terpusat!',
        });
        setPicketConditionSummary('');
        setPicketGeneralNotes('');
        setPicketViolations([]);
        fetchPicketData();
        fetchDashboardData();
      } else {
        setPicketAlert({
          type: 'error',
          message: data.error || 'Gagal menyimpan laporan piket.',
        });
      }
    } catch (err: any) {
      setPicketAlert({
        type: 'error',
        message: err.message || 'Terjadi kesalahan server.',
      });
    } finally {
      setIsSavingPicket(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: PENGATURAN AKUN (PASSWORD)
  // --------------------------------------------------------------------------

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
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
        setPasswordMsg({ type: 'success', text: 'Password berhasil diperbarui!' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Gagal mengubah password.' });
      }
    } catch (error: any) {
      setPasswordMsg({ type: 'error', text: error.message || 'Terjadi kesalahan koneksi.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // --------------------------------------------------------------------------
  // FILTERED DATA
  // --------------------------------------------------------------------------

  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      if (scheduleViewMode === 'today' && sch.day !== dashboardData.currentDay) {
        return false;
      }
      if (scheduleDayFilter !== 'all' && sch.day !== scheduleDayFilter) {
        return false;
      }
      return true;
    });
  }, [schedules, scheduleViewMode, scheduleDayFilter, dashboardData.currentDay]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
        m.subject.toLowerCase().includes(materialSearch.toLowerCase());
      const matchClass =
        materialClassFilter === 'all' || m.class_id === materialClassFilter;
      return matchSearch && matchClass;
    });
  }, [materials, materialSearch, materialClassFilter]);

  const filteredAssignments = useMemo(() => {
    const now = new Date();
    return assignments.filter((a) => {
      if (assignmentFilter === 'active') {
        return new Date(a.deadline) >= now && a.is_active;
      }
      if (assignmentFilter === 'past') {
        return new Date(a.deadline) < now || !a.is_active;
      }
      return true;
    });
  }, [assignments, assignmentFilter]);

  const filteredRosterStudents = useMemo(() => {
    if (!selectedClassRoster) return [];
    return (selectedClassRoster.students || []).filter(
      (s: any) =>
        s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        (s.nis && s.nis.includes(rosterSearch))
    );
  }, [selectedClassRoster, rosterSearch]);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Buka menu"
            >
              {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
                <BookOpen className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block leading-tight">
                  Portal Guru Mapel
                </span>
                <span className="text-sm font-black text-slate-900 leading-tight">
                  SMAN 18 BOMBANA
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Website Publik
            </a>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">@{user.username}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex gap-6">
        {/* Sidebar Nav (Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu Utama Guru
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              1. Dashboard
            </button>

            <button
              onClick={() => setActiveTab('jadwal')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'jadwal'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <Calendar className="w-4 h-4" />
                2. Jadwal Mengajar
              </span>
              {dashboardData.schedulesToday.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'jadwal'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {dashboardData.schedulesToday.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('kelas')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'kelas'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                3. Kelas Saya
              </span>
              {classes.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'kelas'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {classes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('absen')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'absen'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              4. Rekap Absen Bulanan
            </button>

            <button
              onClick={() => setActiveTab('materi')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'materi'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              5. Materi & Modul
            </button>

            <button
              onClick={() => setActiveTab('tugas')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'tugas'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4" />
                6. Tugas Siswa
              </span>
              {dashboardData.activeAssignments.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'tugas'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {dashboardData.activeAssignments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('piket')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'piket'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4" />
                7. Laporan Piket
              </span>
              {dashboardData.todayPicket ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : null}
            </button>

            <div className="pt-2">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sistem & Akun
              </div>

              <button
                onClick={() => setActiveTab('notifikasi')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'notifikasi'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                8. Notifikasi
              </button>

              <button
                onClick={() => setActiveTab('pengaturan')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'pengaturan'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                9. Pengaturan Akun
              </button>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-md space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              Friendly & Green School
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Mewujudkan pembelajaran aktif, disiplin positif, dan ramah lingkungan di SMAN 18 Bombana.
            </p>
            <div className="pt-1 text-[11px] text-emerald-300 font-mono">
              Role: Guru Mata Pelajaran
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                      18
                    </div>
                    <span className="font-bold text-slate-900 text-sm">Menu Guru</span>
                  </div>
                  <button
                    onClick={() => setIsMobileNavOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
                    { id: 'jadwal', label: '2. Jadwal Mengajar', icon: Calendar },
                    { id: 'kelas', label: '3. Kelas Saya', icon: Users },
                    { id: 'absen', label: '4. Rekap Absen Bulanan', icon: FileSpreadsheet },
                    { id: 'materi', label: '5. Materi & Modul', icon: BookOpen },
                    { id: 'tugas', label: '6. Tugas Siswa', icon: ClipboardList },
                    { id: 'piket', label: '7. Laporan Piket', icon: ShieldAlert },
                    { id: 'notifikasi', label: '8. Notifikasi', icon: Bell },
                    { id: 'pengaturan', label: '9. Pengaturan Akun', icon: Settings },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as TeacherTab);
                          setIsMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          activeTab === item.id
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <LogoutButton />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Profile Greeting Card */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Tahun Ajaran Aktif 2024/2025 • SMAN 18 Bombana
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Selamat Datang, {user.name}
                  </h1>
                  <p className="text-emerald-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    Portal pengajaran terpadu untuk mengelola jadwal tatap muka, rekapitulasi kehadiran bulanan, materi modul pembelajaran, penugasan, serta piket sekolah secara akuntabel.
                  </p>
                  {dashboardData.subjects && dashboardData.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-xs text-emerald-200 font-semibold self-center">
                        Mata Pelajaran:
                      </span>
                      {dashboardData.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg bg-emerald-700/80 text-white text-xs font-bold"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Overview Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Jadwal Hari Ini</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {dashboardData.schedulesToday.length}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">sesi kelas ({dashboardData.currentDay})</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Kelas Diajar</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {dashboardData.classesTaughtCount || classes.length}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">rombongan belajar</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Tugas Aktif</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {dashboardData.activeAssignments.length}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">belum ditutup</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Status Piket Hari Ini</span>
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    {dashboardData.todayPicket ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Melapor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                        Belum / Bebas Tugas
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Jadwal Hari Ini & Tugas Aktif */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Jadwal Hari Ini */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-slate-900 text-sm">
                        Jadwal Mengajar Hari Ini ({dashboardData.currentDay})
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('jadwal')}
                      className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Lihat Semua <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {dashboardData.schedulesToday.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <Clock className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs">Tidak ada jadwal tatap muka untuk hari ini.</p>
                      <button
                        onClick={() => {
                          setActiveTab('jadwal');
                          setIsAddScheduleModalOpen(true);
                        }}
                        className="text-xs text-emerald-600 font-bold hover:underline"
                      >
                        + Tambah Jadwal Mengajar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.schedulesToday.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {item.class?.name || '-'}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{item.subject}</h4>
                              <p className="text-[11px] text-slate-500">
                                Ruang: {item.room || 'Kelas Utama'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-1 rounded-lg">
                              {item.start_time} - {item.end_time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tugas Siswa Aktif */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Tugas Siswa Aktif</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('tugas')}
                      className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Kelola Tugas <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {dashboardData.activeAssignments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs">Tidak ada tugas aktif yang sedang berjalan.</p>
                      <button
                        onClick={() => {
                          setActiveTab('tugas');
                          setIsAddAssignmentModalOpen(true);
                        }}
                        className="text-xs text-emerald-600 font-bold hover:underline"
                      >
                        + Buat Tugas Baru
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.activeAssignments.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {item.class?.name} • {item.subject}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 mt-1">{item.title}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Batas: {new Date(item.deadline).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Latest Attendance Recap & School Announcements */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rekap Absen Bulanan Terkini */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                      <h3 className="font-bold text-slate-900 text-sm">
                        Rekap Presensi Bulanan Terkini
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('absen')}
                      className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Buka Lembar Presensi <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {dashboardData.latestAttendances.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs">Belum ada rekap presensi bulanan yang tersimpan.</p>
                      <button
                        onClick={() => setActiveTab('absen')}
                        className="text-xs text-emerald-600 font-bold hover:underline"
                      >
                        Mulai Input Presensi Bulanan
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {dashboardData.latestAttendances.map((rec: any) => (
                        <div key={rec.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                Kelas {rec.class?.name} • {rec.subject}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rec.status === 'Disetujui'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rec.status === 'Dikirim'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Periode: {MONTH_NAMES[rec.month - 1]} {rec.year} • {rec._count?.items || 0} Siswa Terdata
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setAbsenClassId(rec.class_id);
                              setAbsenYear(rec.year);
                              setAbsenMonth(rec.month);
                              setAbsenSubject(rec.subject);
                              setActiveTab('absen');
                              handleLoadAttendanceSheet();
                            }}
                            className="text-xs text-emerald-600 font-bold hover:underline"
                          >
                            Buka
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pengumuman Sekolah */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Pengumuman Sekolah</h3>
                  </div>

                  {dashboardData.announcements.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      Tidak ada pengumuman terbaru saat ini.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.announcements.map((ann: any) => (
                        <div key={ann.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {ann.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {ann.content}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            {new Date(ann.published_at || ann.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: JADWAL MENGAJAR */}
          {/* ========================================================================= */}
          {activeTab === 'jadwal' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Jadwal Mengajar Guru</h2>
                  <p className="text-xs text-slate-500">
                    Kelola dan pantau agenda kegiatan belajar mengajar mingguan Anda.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddScheduleModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Jadwal
                  </button>
                </div>
              </div>

              {/* View Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setScheduleViewMode('today')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      scheduleViewMode === 'today'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hari Ini ({dashboardData.currentDay})
                  </button>
                  <button
                    onClick={() => setScheduleViewMode('weekly')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      scheduleViewMode === 'weekly'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mingguan (Semua)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Filter Hari:</span>
                  <select
                    value={scheduleDayFilter}
                    onChange={(e) => setScheduleDayFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="all">Semua Hari</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Table / Cards */}
              {isLoadingSchedules ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs mt-2">Memuat jadwal mengajar...</p>
                </div>
              ) : filteredSchedules.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Clock className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada jadwal yang sesuai kriteria.</p>
                  <p className="text-xs text-slate-400">
                    Klik tombol "Tambah Jadwal" di atas untuk menambahkan jadwal mengajar baru.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50">
                        <th className="py-3 px-4 rounded-l-xl">Hari</th>
                        <th className="py-3 px-4">Jam</th>
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4">Mata Pelajaran</th>
                        <th className="py-3 px-4 rounded-r-xl">Ruangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSchedules.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                              {item.day}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            {item.start_time} - {item.end_time}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {item.class?.name || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{item.subject}</td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {item.room || 'Ruang Kelas Reguler'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: KELAS SAYA */}
          {/* ========================================================================= */}
          {activeTab === 'kelas' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Daftar Kelas yang Diajar</h2>
                  <p className="text-xs text-slate-500">
                    Lihat rombongan belajar dan rincian data siswa di kelas yang Anda ampu.
                  </p>
                </div>
              </div>

              {isLoadingClasses ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs mt-2">Memuat daftar kelas...</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Belum ada kelas yang terdaftar.</p>
                  <p className="text-xs text-slate-400">
                    Jadwalkan sesi mengajar Anda agar kelas muncul di daftar ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-5 rounded-3xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Tingkat {cls.grade}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {cls._count?.students || cls.students?.length || 0} Siswa
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Kelas {cls.name}</h3>
                        <p className="text-xs text-slate-600">
                          Wali Kelas: <span className="font-semibold text-slate-800">{cls.homeroom_teacher?.name || '-'}</span>
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200/60">
                        <button
                          onClick={() => {
                            setSelectedClassRoster(cls);
                            setRosterSearch('');
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Roster Siswa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: REKAP ABSEN BULANAN */}
          {/* ========================================================================= */}
          {activeTab === 'absen' && (
            <div className="space-y-6">
              {/* Header Info Workflow */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-black text-slate-900">Rekap Presensi Bulanan Siswa</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Isi rekapitulasi kehadiran Hadir (H), Sakit (S), Izin (I), dan Alpa (A) secara bulanan. Total otomatis terhitung oleh sistem tanpa input manual. Simpan sebagai Draft untuk pengeditan lanjutan, atau Kirim ke Wakasek Kesiswaan.
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Tahun</label>
                    <select
                      value={absenYear}
                      onChange={(e) => setAbsenYear(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Bulan</label>
                    <select
                      value={absenMonth}
                      onChange={(e) => setAbsenMonth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Kelas</label>
                    <select
                      value={absenClassId}
                      onChange={(e) => setAbsenClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">Pilih Kelas</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Kelas {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Mata Pelajaran</label>
                    <input
                      type="text"
                      value={absenSubject}
                      onChange={(e) => setAbsenSubject(e.target.value)}
                      placeholder="e.g. Matematika Wajib"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleLoadAttendanceSheet}
                      disabled={isLoadingSheet}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                    >
                      {isLoadingSheet ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Muat / Isi Lembar Presensi
                    </button>
                  </div>
                </div>

                {attendanceAlert && (
                  <div
                    className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
                      attendanceAlert.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {attendanceAlert.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{attendanceAlert.message}</span>
                  </div>
                )}

                {/* Lembar Presensi Grid */}
                {attendanceSheet.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">
                          Lembar Presensi: Periode {MONTH_NAMES[absenMonth - 1]} {absenYear}
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Kelas {classes.find((c) => c.id === absenClassId)?.name} • Mapel: {absenSubject}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-800">Status:</span>
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-xl uppercase ${
                            attendanceStatus === 'Disetujui'
                              ? 'bg-emerald-200 text-emerald-900'
                              : attendanceStatus === 'Dikirim'
                              ? 'bg-blue-200 text-blue-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {attendanceStatus}
                        </span>
                      </div>
                    </div>

                    {attendanceStatus !== 'Draft' && (
                      <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800 text-xs flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0 text-blue-600" />
                        <span>
                          Rekap presensi ini berstatus <b>{attendanceStatus}</b> dan dalam peninjauan Wakasek Kesiswaan.
                        </span>
                      </div>
                    )}

                    <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                            <th className="py-3 px-3 w-12 text-center">No</th>
                            <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                            <th className="py-3 px-2 w-20 text-center">H (Hadir)</th>
                            <th className="py-3 px-2 w-20 text-center">S (Sakit)</th>
                            <th className="py-3 px-2 w-20 text-center">I (Izin)</th>
                            <th className="py-3 px-2 w-20 text-center">A (Alpa)</th>
                            <th className="py-3 px-2 w-24 text-center bg-slate-100 text-slate-900 font-black">
                              Total
                            </th>
                            <th className="py-3 px-4 min-w-[150px]">Catatan Khusus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {attendanceSheet.map((row, idx) => (
                            <tr key={row.student_id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">
                                <div>{row.student_name}</div>
                                <span className="text-[10px] text-slate-400 font-mono font-normal">
                                  NIS: {row.student_nis} • {row.gender === 'L' ? 'L' : 'P'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={attendanceStatus !== 'Draft'}
                                  value={row.present}
                                  onChange={(e) => handleAttendanceChange(idx, 'present', e.target.value)}
                                  className="w-16 py-1 px-1.5 text-center font-mono font-bold rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={attendanceStatus !== 'Draft'}
                                  value={row.sick}
                                  onChange={(e) => handleAttendanceChange(idx, 'sick', e.target.value)}
                                  className="w-16 py-1 px-1.5 text-center font-mono font-bold rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 text-amber-700"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={attendanceStatus !== 'Draft'}
                                  value={row.permission}
                                  onChange={(e) => handleAttendanceChange(idx, 'permission', e.target.value)}
                                  className="w-16 py-1 px-1.5 text-center font-mono font-bold rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 text-blue-700"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={attendanceStatus !== 'Draft'}
                                  value={row.unexcused}
                                  onChange={(e) => handleAttendanceChange(idx, 'unexcused', e.target.value)}
                                  className="w-16 py-1 px-1.5 text-center font-mono font-bold rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 disabled:bg-slate-100 text-rose-700"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-center bg-slate-100 font-mono font-black text-slate-800 text-xs">
                                {row.total}
                              </td>
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  disabled={attendanceStatus !== 'Draft'}
                                  value={row.notes}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setAttendanceSheet((prev) => {
                                      const u = [...prev];
                                      u[idx] = { ...u[idx], notes: val };
                                      return u;
                                    });
                                  }}
                                  placeholder="Catatan..."
                                  className="w-full py-1 px-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Catatan Umum Rekap & Aksi */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Catatan Tambahan untuk Wakasek Kesiswaan (Opsional)
                      </label>
                      <textarea
                        rows={2}
                        disabled={attendanceStatus !== 'Draft'}
                        value={attendanceNotes}
                        onChange={(e) => setAttendanceNotes(e.target.value)}
                        placeholder="Tuliskan catatan perkembangan kehadiran kelas pada bulan ini..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isSavingAttendance || attendanceStatus !== 'Draft'}
                        onClick={() => handleSaveAttendance('Draft')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs disabled:opacity-50 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Simpan Sebagai Draft
                      </button>

                      <button
                        type="button"
                        disabled={isSavingAttendance || attendanceStatus !== 'Draft'}
                        onClick={() => handleSaveAttendance('Dikirim')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        {isSavingAttendance ? 'Mengirim...' : 'Kirim ke Wakasek Kesiswaan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Riwayat Rekap Absen Bulanan */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Riwayat Rekap Presensi yang Dibuat</h3>
                </div>

                {isLoadingAttendanceHistory ? (
                  <div className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
                    <p className="text-xs mt-2">Memuat riwayat presensi...</p>
                  </div>
                ) : attendancesHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Belum ada riwayat rekap presensi yang pernah disimpan.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Periode</th>
                          <th className="py-2.5 px-3">Kelas & Mapel</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Jumlah Siswa</th>
                          <th className="py-2.5 px-3">Tanggal Dibuat/Kirim</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendancesHistory.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {MONTH_NAMES[rec.month - 1]} {rec.year}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-800">
                                Kelas {rec.class?.name}
                              </span>
                              <span className="text-slate-500 block text-[11px]">{rec.subject}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rec.status === 'Disetujui'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rec.status === 'Dikirim'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-mono">
                              {rec.items?.length || 0} siswa
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {new Date(rec.created_at).toLocaleDateString('id-ID')}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  setAbsenYear(rec.year);
                                  setAbsenMonth(rec.month);
                                  setAbsenClassId(rec.class_id);
                                  setAbsenSubject(rec.subject);
                                  handleLoadAttendanceSheet();
                                }}
                                className="text-xs font-bold text-emerald-600 hover:underline"
                              >
                                {rec.status === 'Draft' ? 'Buka & Edit' : 'Buka Detail'}
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

          {/* ========================================================================= */}
          {/* TAB 5: MATERI & MODUL */}
          {/* ========================================================================= */}
          {activeTab === 'materi' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Materi & Modul Ajar</h2>
                  <p className="text-xs text-slate-500">
                    Pusat repositori bahan ajar, presentasi, dan modul digital untuk siswa.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddMaterialModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Unggah Materi Baru
                </button>
              </div>

              {/* Filter / Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Cari materi atau mata pelajaran..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Kelas:</span>
                  <select
                    value={materialClassFilter}
                    onChange={(e) => setMaterialClassFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="all">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Material Cards */}
              {isLoadingMaterials ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs mt-2">Memuat materi pembelajaran...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Belum ada materi ajar yang diunggah.</p>
                  <p className="text-xs text-slate-400">
                    Klik tombol "Unggah Materi Baru" untuk membagikan modul bagi peserta didik.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {mat.subject}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {mat.class ? `Kelas ${mat.class.name}` : 'Semua Kelas'}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug">{mat.title}</h3>
                        {mat.description && (
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                            {mat.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">
                          {new Date(mat.created_at).toLocaleDateString('id-ID')}
                        </span>
                        <div className="flex items-center gap-2">
                          {mat.file_url && (
                            <a
                              href={mat.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 text-xs font-bold"
                            >
                              <Download className="w-3 h-3" />
                              Unduh File
                            </a>
                          )}
                          {mat.link_url && (
                            <a
                              href={mat.link_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 text-xs font-bold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Tautan
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: TUGAS SISWA */}
          {/* ========================================================================= */}
          {activeTab === 'tugas' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Manajemen Tugas Siswa</h2>
                  <p className="text-xs text-slate-500">
                    Buat dan pantau batas pengumpulan tugas mandiri maupun kelompok.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddAssignmentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Buat Tugas Baru
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit text-xs font-bold">
                <button
                  onClick={() => setAssignmentFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    assignmentFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Tugas ({assignments.length})
                </button>
                <button
                  onClick={() => setAssignmentFilter('active')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    assignmentFilter === 'active'
                      ? 'bg-white text-amber-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sedang Berjalan
                </button>
                <button
                  onClick={() => setAssignmentFilter('past')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    assignmentFilter === 'past'
                      ? 'bg-white text-slate-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Telah Lewat / Selesai
                </button>
              </div>

              {/* Assignment List */}
              {isLoadingAssignments ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600" />
                  <p className="text-xs mt-2">Memuat daftar tugas...</p>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Belum ada tugas pada kategori ini.</p>
                  <p className="text-xs text-slate-400">
                    Klik "Buat Tugas Baru" untuk membuat instruksi tugas bagi peserta didik.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredAssignments.map((asg) => {
                    const isPast = new Date(asg.deadline) < new Date();
                    return (
                      <div
                        key={asg.id}
                        className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                          isPast
                            ? 'bg-slate-50 border-slate-200/80 opacity-80'
                            : 'bg-white border-amber-200/80 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              Kelas {asg.class?.name} • {asg.subject}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isPast
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isPast ? 'Selesai' : 'Aktif'}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 leading-snug">
                            {asg.title}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                            {asg.description}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Batas: {new Date(asg.deadline).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {asg.attachment_url && (
                            <a
                              href={asg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> Lampiran
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: LAPORAN PIKET (INTEGRASI SATU DATA PELANGGARAN SISWA) */}
          {/* ========================================================================= */}
          {activeTab === 'piket' && (
            <div className="space-y-6">
              {/* Form Input Laporan Piket */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <h2 className="text-lg font-black text-slate-900">
                      Laporan Piket Harian & Pelaporan Siswa Bermasalah
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Catat situasi ketertiban harian sekolah. Siswa bermasalah yang dilaporkan di sini otomatis tersinkronisasi ke <b>Satu Data Terpusat Pelanggaran Siswa</b> untuk ditangani oleh Guru BK & Wakasek Kesiswaan.
                  </p>
                </div>

                {picketAlert && (
                  <div
                    className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
                      picketAlert.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {picketAlert.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{picketAlert.message}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitPicketReport} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Piket
                      </label>
                      <input
                        type="date"
                        required
                        value={picketDate}
                        onChange={(e) => setPicketDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ringkasan Situasi & Kondisi Sekolah
                      </label>
                      <input
                        type="text"
                        value={picketConditionSummary}
                        onChange={(e) => setPicketConditionSummary(e.target.value)}
                        placeholder="Contoh: Apel pagi berjalan lancar, cuaca cerah, lingkungan bersih dan kondusif."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan Tambahan Guru Piket
                    </label>
                    <textarea
                      rows={2}
                      value={picketGeneralNotes}
                      onChange={(e) => setPicketGeneralNotes(e.target.value)}
                      placeholder="Catatan penanganan fasilitas, izin tamu, atau kejadian khusus..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* SUB-SECTION: LAPORAN SISWA BERMASALAH */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">
                          Pelaporan Siswa Bermasalah Saat Piket
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddViolationToPicket}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Siswa
                      </button>
                    </div>

                    {picketViolations.length === 0 ? (
                      <p className="text-xs text-rose-700/70 italic py-2">
                        Tidak ada siswa yang melanggar tata tertib pada sesi piket ini. (Opsional)
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {picketViolations.map((v, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-white border border-rose-200 shadow-sm space-y-3 relative"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-black text-slate-800">
                                Siswa Bermasalah #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveViolationFromPicket(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1 rounded-lg text-xs flex items-center gap-1 font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <label className="block text-slate-600 font-bold mb-1">
                                  Nama Siswa
                                </label>
                                <select
                                  required
                                  value={v.student_id}
                                  onChange={(e) => handleViolationChange(idx, 'student_id', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
                                >
                                  <option value="">Pilih Siswa...</option>
                                  {allStudentsForPicket.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.class?.name || 'Tanpa Kelas'})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-600 font-bold mb-1">
                                  Jenis Pelanggaran
                                </label>
                                <select
                                  value={v.violation_type}
                                  onChange={(e) => handleViolationChange(idx, 'violation_type', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
                                >
                                  <option value="Kedisiplinan">Kedisiplinan</option>
                                  <option value="Keterlambatan">Keterlambatan</option>
                                  <option value="Kerapian / Seragam">Kerapian / Seragam</option>
                                  <option value="Membolos">Membolos</option>
                                  <option value="Merokok">Merokok</option>
                                  <option value="Gadget / HP di Jam Belajar">Gadget / HP di Jam Belajar</option>
                                  <option value="Perkelahian">Perkelahian</option>
                                  <option value="Lainnya">Lainnya</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-600 font-bold mb-1">
                                  Lokasi Kejadian
                                </label>
                                <input
                                  type="text"
                                  value={v.location}
                                  onChange={(e) => handleViolationChange(idx, 'location', e.target.value)}
                                  placeholder="e.g. Gerbang depan, Kantin"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-slate-600 font-bold mb-1">
                                  Deskripsi / Kronologi Kejadian
                                </label>
                                <textarea
                                  rows={2}
                                  required
                                  value={v.description}
                                  onChange={(e) => handleViolationChange(idx, 'description', e.target.value)}
                                  placeholder="Jelaskan secara ringkas pelanggaran yang dilakukan..."
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-600 font-bold mb-1">
                                  Tindakan Awal Guru Piket
                                </label>
                                <textarea
                                  rows={2}
                                  value={v.initial_action}
                                  onChange={(e) => handleViolationChange(idx, 'initial_action', e.target.value)}
                                  placeholder="Contoh: Diberi teguran lisan, diarahkan ke ruang piket, dicatat di buku tatib."
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingPicket}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      {isSavingPicket ? 'Menyimpan...' : 'Kirim Laporan Piket'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Riwayat Laporan Piket Sebelumnya */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Riwayat Laporan Piket Terakhir</h3>
                </div>

                {isLoadingPicket ? (
                  <div className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-600" />
                    <p className="text-xs mt-2">Memuat riwayat piket...</p>
                  </div>
                ) : picketHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Belum ada riwayat laporan piket yang tersimpan.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {picketHistory.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            {new Date(rep.date).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Petugas: {rep.picket_teacher?.name}
                          </span>
                        </div>
                        {rep.school_condition_summary && (
                          <p className="text-xs text-slate-700">
                            <span className="font-semibold">Kondisi:</span> {rep.school_condition_summary}
                          </p>
                        )}
                        {rep.general_notes && (
                          <p className="text-xs text-slate-500">
                            <span className="font-semibold">Catatan:</span> {rep.general_notes}
                          </p>
                        )}
                        {rep.violations && rep.violations.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60">
                            <span className="text-[11px] font-bold text-rose-800 block mb-1">
                              Siswa Bermasalah yang Dilaporkan ({rep.violations.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {rep.violations.map((v: any) => (
                                <span
                                  key={v.id}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-semibold"
                                >
                                  {v.student?.name} ({v.violation_type}) - Status: {v.status}
                                </span>
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

          {/* ========================================================================= */}
          {/* TAB 8: NOTIFIKASI */}
          {/* ========================================================================= */}
          {activeTab === 'notifikasi' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Notifikasi & Informasi Terkini</h2>
                  <p className="text-xs text-slate-500">
                    Pemberitahuan resmi dan agenda sekolah untuk pendidik.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {dashboardData.announcements.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Bell className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">Tidak ada notifikasi baru.</p>
                  </div>
                ) : (
                  dashboardData.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/50 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Pengumuman Sekolah
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(ann.published_at || ann.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {ann.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: PENGATURAN AKUN */}
          {/* ========================================================================= */}
          {activeTab === 'pengaturan' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900">Pengaturan Akun & Keamanan</h2>
                  <p className="text-xs text-slate-500">
                    Informasi kredensial login dan pembaruan password pendidik.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data Profil Guru */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Profil Guru
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Nama Lengkap</span>
                        <span className="font-bold text-slate-900">{user.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Username</span>
                        <span className="font-mono text-slate-800">@{user.username}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Email</span>
                        <span className="font-mono text-slate-800">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Role Portal</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                          Guru Mata Pelajaran
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Ganti Password */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      Ganti Password
                    </h3>

                    {passwordMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          passwordMsg.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {passwordMsg.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{passwordMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password Lama
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.oldPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                          }
                          placeholder="Password saat ini"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password Baru (Min. 6 karakter)
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          placeholder="Password baru"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          placeholder="Ketik ulang password baru"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                      >
                        {isSavingPassword ? 'Menyimpan...' : 'Perbarui Password'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ROSTER SISWA KELAS (READ-ONLY) */}
      {/* ========================================================================= */}
      {selectedClassRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Roster Siswa Kelas {selectedClassRoster.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Wali Kelas: {selectedClassRoster.homeroom_teacher?.name || '-'} • Total: {selectedClassRoster.students?.length || 0} Siswa
                </p>
              </div>
              <button
                onClick={() => setSelectedClassRoster(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search within roster */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Cari siswa di kelas ini..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl max-h-[55vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3 text-center">L/P</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRosterStudents.map((st: any, idx: number) => (
                    <tr key={st.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{st.nis || '-'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-600">{st.gender}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedClassRoster(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH JADWAL MENGAJAR */}
      {/* ========================================================================= */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Tambah Jadwal Mengajar</h3>
              </div>
              <button
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                <select
                  required
                  value={scheduleForm.class_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Pilih Kelas Target</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.subject}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                  placeholder="e.g. Bahasa Indonesia"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={scheduleForm.day}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ruangan / Lab (Opsional)</label>
                <input
                  type="text"
                  value={scheduleForm.room}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                  placeholder="e.g. Lab Komputer 1 / Ruang XII-A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSavingSchedule ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UNGGAH MATERI BARU */}
      {/* ========================================================================= */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Unggah Materi / Modul</h3>
              </div>
              <button
                onClick={() => setIsAddMaterialModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Materi</label>
                <input
                  type="text"
                  required
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  placeholder="e.g. Modul 1: Struktur Atom & Tabel Periodik"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={materialForm.subject}
                    onChange={(e) => setMaterialForm({ ...materialForm, subject: e.target.value })}
                    placeholder="e.g. Kimia"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Sasaran</label>
                  <select
                    value={materialForm.class_id}
                    onChange={(e) => setMaterialForm({ ...materialForm, class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ringkasan / Petunjuk</label>
                <textarea
                  rows={2}
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  placeholder="Catatan mengenai bahan kajian atau ringkasan capaian..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unggah Dokumen (PDF, DOCX, PPTX, Max 20MB)
                </label>
                <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                  <Upload className="w-5 h-5 mx-auto text-slate-400" />
                  <input
                    type="file"
                    onChange={handleUploadMaterialFile}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
                  />
                  {isUploadingFile && (
                    <p className="text-[11px] text-emerald-600 font-semibold">Mengunggah file ke server...</p>
                  )}
                  {materialForm.file_url && (
                    <p className="text-[11px] text-emerald-700 font-bold truncate">
                      File terlampir: {materialForm.file_url}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tautan Eksternal / Video (Opsional)
                </label>
                <input
                  type="url"
                  value={materialForm.link_url}
                  onChange={(e) => setMaterialForm({ ...materialForm, link_url: e.target.value })}
                  placeholder="https://drive.google.com/... atau https://youtube.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMaterial || isUploadingFile}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSavingMaterial ? 'Menyimpan...' : 'Simpan Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BUAT TUGAS BARU */}
      {/* ========================================================================= */}
      {isAddAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Buat Tugas Baru</h3>
              </div>
              <button
                onClick={() => setIsAddAssignmentModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Tugas</label>
                <input
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. Analisis Teks Eksplanasi Bab 2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={assignmentForm.subject}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                    placeholder="e.g. Bahasa Indonesia"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Target</label>
                  <select
                    required
                    value={assignmentForm.class_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Batas Pengumpulan (Deadline)</label>
                <input
                  type="datetime-local"
                  required
                  value={assignmentForm.deadline}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instruksi Tugas</label>
                <textarea
                  rows={3}
                  required
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Tuliskan petunjuk pengerjaan, format berkas yang dikumpulkan, dll..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tautan Lampiran / Panduan (Opsional)
                </label>
                <input
                  type="url"
                  value={assignmentForm.attachment_url}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, attachment_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAssignmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssignment}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {isSavingAssignment ? 'Menyimpan...' : 'Simpan & Terbitkan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
