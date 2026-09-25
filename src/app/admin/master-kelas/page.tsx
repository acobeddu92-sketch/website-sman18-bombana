'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Calendar,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Users,
  GraduationCap,
  Check,
  X,
  Info,
  ShieldCheck,
  UserCheck,
  Building2,
  Power,
} from 'lucide-react';

interface AcademicYearItem {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    classes: number;
  };
}

interface ClassItem {
  id: string;
  code: string | null;
  name: string;
  grade: string;
  academic_year: string;
  academic_year_id: string | null;
  is_active: boolean;
  homeroom_teacher_id: string | null;
  created_at: string;
  updated_at: string;
  academic_year_rel?: {
    id: string;
    name: string;
    is_active: boolean;
  } | null;
  homeroom_teacher?: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    nip?: string | null;
  } | null;
  _count?: {
    students: number;
  };
}

interface WaliKelasUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  nip?: string | null;
  assignedClass?: string | null;
  isAssignedInYear?: boolean;
}

export default function MasterKelasPage() {
  // Data States
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [waliKelasUsers, setWaliKelasUsers] = useState<WaliKelasUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modals State
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYearItem | null>(null);
  const [yearForm, setYearForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });
  const [isSubmittingYear, setIsSubmittingYear] = useState(false);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    grade: 'X',
    academic_year_id: '',
    homeroom_teacher_id: '',
    is_active: true,
  });
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);

  // Confirmation Delete Modals
  const [deleteCandidate, setDeleteCandidate] = useState<{
    type: 'class' | 'academic_year';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --------------------------------------------------------------------------
  // FETCHERS
  // --------------------------------------------------------------------------

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [resYears, resClasses] = await Promise.all([
        fetch('/api/admin/academic-years'),
        fetch('/api/admin/classes'),
      ]);

      const dataYears = await resYears.json();
      const dataClasses = await resClasses.json();

      if (resYears.ok && dataYears.success) {
        setAcademicYears(dataYears.academicYears || []);
      } else {
        setErrorMsg(dataYears.error || 'Gagal memuat tahun ajaran.');
      }

      if (resClasses.ok && dataClasses.success) {
        setClasses(dataClasses.classes || []);
        setWaliKelasUsers(dataClasses.waliKelasUsers || []);
      } else {
        setErrorMsg((prev) => prev || dataClasses.error || 'Gagal memuat kelas.');
      }
    } catch (err: any) {
      console.error('Error fetching master data:', err);
      setErrorMsg(err.message || 'Terjadi gangguan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --------------------------------------------------------------------------
  // TAHUN AJARAN ACTIONS
  // --------------------------------------------------------------------------

  const activeYear = useMemo(() => {
    return academicYears.find((y) => y.is_active) || null;
  }, [academicYears]);

  const openAddYearModal = () => {
    setEditingYear(null);
    setYearForm({
      name: '',
      start_date: '',
      end_date: '',
      is_active: academicYears.length === 0, // default active jika belum ada
    });
    setIsYearModalOpen(true);
  };

  const openEditYearModal = (year: AcademicYearItem) => {
    setEditingYear(year);
    setYearForm({
      name: year.name,
      start_date: year.start_date ? year.start_date.split('T')[0] : '',
      end_date: year.end_date ? year.end_date.split('T')[0] : '',
      is_active: year.is_active,
    });
    setIsYearModalOpen(true);
  };

  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.name.trim()) {
      alert('Nama tahun ajaran wajib diisi.');
      return;
    }

    setIsSubmittingYear(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = editingYear
        ? `/api/admin/academic-years/${editingYear.id}`
        : '/api/admin/academic-years';
      const method = editingYear ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yearForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Tahun ajaran berhasil disimpan.');
        setIsYearModalOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Gagal menyimpan tahun ajaran.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingYear(false);
    }
  };

  const handleToggleActivateYear = async (year: AcademicYearItem) => {
    if (year.is_active) {
      alert('Tahun ajaran ini sudah berstatus aktif.');
      return;
    }

    const confirm = window.confirm(
      `Aktifkan Tahun Ajaran "${year.name}"? Tahun ajaran aktif lainnya akan otomatis dinonaktifkan.`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/academic-years/${year.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Tahun ajaran ${year.name} kini aktif.`);
        fetchData();
      } else {
        alert(data.error || 'Gagal mengaktifkan tahun ajaran.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal terhubung ke server.');
    }
  };

  // --------------------------------------------------------------------------
  // KELAS ACTIONS
  // --------------------------------------------------------------------------

  const openAddClassModal = () => {
    setEditingClass(null);
    setClassForm({
      name: '',
      code: '',
      grade: 'X',
      academic_year_id: activeYear?.id || (academicYears[0]?.id || ''),
      homeroom_teacher_id: '',
      is_active: true,
    });
    setIsClassModalOpen(true);
  };

  const openEditClassModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      code: cls.code || '',
      grade: cls.grade,
      academic_year_id: cls.academic_year_id || activeYear?.id || '',
      homeroom_teacher_id: cls.homeroom_teacher_id || '',
      is_active: cls.is_active,
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) {
      alert('Nama kelas wajib diisi (contoh: X IPA 1).');
      return;
    }
    if (!classForm.academic_year_id) {
      alert('Pilih tahun ajaran untuk kelas ini.');
      return;
    }

    setIsSubmittingClass(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = editingClass
        ? `/api/admin/classes/${editingClass.id}`
        : '/api/admin/classes';
      const method = editingClass ? 'PATCH' : 'POST';

      const payload = {
        name: classForm.name.trim(),
        code: classForm.code.trim() || null,
        grade: classForm.grade,
        academic_year_id: classForm.academic_year_id,
        homeroom_teacher_id: classForm.homeroom_teacher_id || null,
        is_active: classForm.is_active,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Data kelas berhasil disimpan.');
        setIsClassModalOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Gagal menyimpan data kelas.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingClass(false);
    }
  };

  const handleToggleClassStatus = async (cls: ClassItem) => {
    const newStatus = !cls.is_active;
    const confirm = window.confirm(
      `Ubah status kelas "${cls.name}" menjadi ${newStatus ? 'AKTIF' : 'NONAKTIF'}?`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/classes/${cls.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Status kelas ${cls.name} berhasil diubah.`);
        fetchData();
      } else {
        alert(data.error || 'Gagal mengubah status kelas.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal terhubung ke server.');
    }
  };

  // --------------------------------------------------------------------------
  // SAFE DELETE ACTION
  // --------------------------------------------------------------------------

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;

    setIsDeleting(true);
    try {
      const url =
        deleteCandidate.type === 'class'
          ? `/api/admin/classes/${deleteCandidate.id}`
          : `/api/admin/academic-years/${deleteCandidate.id}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Data berhasil dihapus.');
        setDeleteCandidate(null);
        fetchData();
      } else {
        alert(data.error || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --------------------------------------------------------------------------
  // FILTERED CLASSES
  // --------------------------------------------------------------------------

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      // 1. Filter Tahun Ajaran
      if (selectedYearFilter !== 'all') {
        const matchesRel = cls.academic_year_id === selectedYearFilter;
        const matchesLegacy = cls.academic_year === selectedYearFilter;
        if (!matchesRel && !matchesLegacy) return false;
      }

      // 2. Filter Tingkat
      if (selectedGradeFilter !== 'all' && cls.grade !== selectedGradeFilter) {
        return false;
      }

      // 3. Filter Status
      if (selectedStatusFilter === 'active' && !cls.is_active) return false;
      if (selectedStatusFilter === 'inactive' && cls.is_active) return false;

      // 4. Pencarian
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = cls.name.toLowerCase().includes(query);
        const matchCode = cls.code?.toLowerCase().includes(query) || false;
        const matchWali = cls.homeroom_teacher?.name.toLowerCase().includes(query) || false;
        if (!matchName && !matchCode && !matchWali) return false;
      }

      return true;
    });
  }, [classes, selectedYearFilter, selectedGradeFilter, selectedStatusFilter, searchTerm]);

  return (
    <div className="space-y-6 sm:space-y-8 antialiased pb-12">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
            <Layers className="w-7 h-7 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                Single Source of Truth
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Otoritas Administrator
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Master Data Kelas & Tahun Ajaran
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Basis data tunggal rombongan belajar, tahun ajaran, dan penugasan wali kelas resmi SMAN 18 Bombana.
            </p>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Perbarui</span>
          </button>

          <button
            onClick={openAddYearModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Calendar className="w-4 h-4 text-slate-300" />
            <span>Tambah Tahun Ajaran</span>
          </button>

          <button
            onClick={openAddClassModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-600/25"
          >
            <Plus className="w-4 h-4 text-emerald-100" />
            <span>Tambah Kelas Baru</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BAGIAN 1: MASTER TAHUN AJARAN */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                1. Master Data Tahun Ajaran
              </h2>
              <p className="text-xs text-slate-500">
                Aturan sistem: Tepat satu tahun ajaran aktif yang menjadi acuan utama seluruh operasional sekolah.
              </p>
            </div>
          </div>

          {activeYear && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tahun Ajaran Aktif: <strong className="text-emerald-950 font-black">{activeYear.name}</strong></span>
            </div>
          )}
        </div>

        {/* Tabel Tahun Ajaran */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Nama Tahun Ajaran</th>
                <th className="px-4 py-3.5">Rentang Tanggal</th>
                <th className="px-4 py-3.5 text-center">Jumlah Rombel</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {academicYears.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Belum ada master tahun ajaran. Silakan klik tombol "Tambah Tahun Ajaran".
                  </td>
                </tr>
              ) : (
                academicYears.map((year) => {
                  const classCount = year._count?.classes || 0;
                  return (
                    <tr key={year.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <span>{year.name}</span>
                        {year.is_active && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {year.start_date || year.end_date ? (
                          <span>
                            {year.start_date ? new Date(year.start_date).toLocaleDateString('id-ID') : '-'}
                            {' s/d '}
                            {year.end_date ? new Date(year.end_date).toLocaleDateString('id-ID') : '-'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum diatur</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {classCount} Kelas
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {year.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        {!year.is_active && (
                          <button
                            onClick={() => handleToggleActivateYear(year)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition"
                            title="Aktifkan Tahun Ajaran Ini"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditYearModal(year)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="Edit Tahun Ajaran"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteCandidate({
                              type: 'academic_year',
                              id: year.id,
                              name: year.name,
                            })
                          }
                          disabled={classCount > 0}
                          className={`p-1.5 rounded-lg transition ${
                            classCount > 0
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                          }`}
                          title={
                            classCount > 0
                              ? 'Tidak dapat dihapus karena masih digunakan oleh kelas'
                              : 'Hapus Tahun Ajaran'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BAGIAN 2: MASTER DATA KELAS */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                2. Master Data Rombongan Belajar (Kelas)
              </h2>
              <p className="text-xs text-slate-500">
                Total {filteredClasses.length} kelas terdaftar berdasarkan kriteria filter aktif.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama kelas (contoh: X IPA 1), kode, atau nama wali..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tahun Ajaran */}
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Tahun Ajaran</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  TA {y.name} {y.is_active ? '(Aktif)' : ''}
                </option>
              ))}
            </select>

            {/* Filter Tingkat */}
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Tingkat</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>

            {/* Filter Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Saja</option>
              <option value="inactive">Nonaktif Saja</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedYearFilter('all');
                setSelectedGradeFilter('all');
                setSelectedStatusFilter('all');
              }}
              className="p-2 text-xs rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700"
              title="Reset Semua Filter"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabel Master Kelas */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">Kode</th>
                <th className="px-4 py-3.5">Nama Kelas</th>
                <th className="px-4 py-3.5 text-center">Tingkat</th>
                <th className="px-4 py-3.5">Tahun Ajaran</th>
                <th className="px-4 py-3.5">Wali Kelas</th>
                <th className="px-4 py-3.5 text-center">Jumlah Siswa</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada kelas yang sesuai kriteria.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan ubah filter pencarian atau tambahkan kelas baru melalui tombol di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls, idx) => {
                  const studentCount = cls._count?.students || 0;
                  const yearDisplay = cls.academic_year_rel?.name || cls.academic_year;

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                        {cls.code ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold">
                            {cls.code}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <span>{cls.name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold text-xs">
                          {cls.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">
                        <span className="font-medium text-slate-800">{yearDisplay}</span>
                        {cls.academic_year_rel?.is_active && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                            AKTIF
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {cls.homeroom_teacher ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                              {cls.homeroom_teacher.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-xs">
                                {cls.homeroom_teacher.name}
                              </p>
                              {cls.homeroom_teacher.nip && (
                                <p className="text-[10px] text-slate-400">
                                  NIP: {cls.homeroom_teacher.nip}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200/60">
                            Belum Ditugaskan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold">
                          <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                          {studentCount} Siswa
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {cls.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleToggleClassStatus(cls)}
                          className={`p-1.5 rounded-lg transition ${
                            cls.is_active
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={cls.is_active ? 'Nonaktifkan Kelas' : 'Aktifkan Kelas'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditClassModal(cls)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="Edit Kelas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteCandidate({
                              type: 'class',
                              id: cls.id,
                              name: cls.name,
                            })
                          }
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL TAMBAH / EDIT TAHUN AJARAN */}
      {/* ==================================================================== */}
      {isYearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsYearModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveYear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  placeholder="Contoh: 2026/2027"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Gunakan format standar YYYY/YYYY (contoh: 2026/2027).</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={yearForm.start_date}
                    onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={yearForm.end_date}
                    onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={yearForm.is_active}
                    onChange={(e) => setYearForm({ ...yearForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Jadikan Tahun Ajaran Aktif Sekarang
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
                  Tahun ajaran aktif lainnya akan otomatis dinonaktifkan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsYearModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingYear}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmittingYear ? 'Menyimpan...' : 'Simpan Tahun Ajaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL TAMBAH / EDIT KELAS */}
      {/* ==================================================================== */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingClass ? `Edit Kelas ${editingClass.name}` : 'Tambah Rombel / Kelas Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    placeholder="Contoh: X IPA 1, XI IPS 2"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Kelas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                    placeholder="Contoh: X-IPA-1"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat (Level) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classForm.grade}
                    onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="X">Tingkat X (Sepuluh)</option>
                    <option value="XI">Tingkat XI (Sebelas)</option>
                    <option value="XII">Tingkat XII (Dua Belas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun Ajaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classForm.academic_year_id}
                    onChange={(e) => setClassForm({ ...classForm, academic_year_id: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.is_active ? '(Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Wali Kelas Selection (HANYA user dengan role wali_kelas) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penugasan Wali Kelas
                </label>
                <select
                  value={classForm.homeroom_teacher_id}
                  onChange={(e) => setClassForm({ ...classForm, homeroom_teacher_id: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Belum Ditugaskan / Kosongkan --</option>
                  {waliKelasUsers.map((w) => {
                    const isAssigned =
                      w.isAssignedInYear &&
                      (!editingClass || editingClass.homeroom_teacher_id !== w.id);

                    return (
                      <option key={w.id} value={w.id} disabled={isAssigned}>
                        {w.name} {w.nip ? `(NIP: ${w.nip})` : ''}
                        {isAssigned ? ` [Sudah di ${w.assignedClass}]` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hanya menampilkan akun pendidik yang memiliki peran resmi <strong className="text-slate-600">wali_kelas</strong>.
                </p>
              </div>

              {/* Status Aktif */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={classForm.is_active}
                    onChange={(e) => setClassForm({ ...classForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Status Kelas Aktif (Dapat digunakan untuk penempatan siswa dan jadwal)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClass}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmittingClass ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DIALOG KONFIRMASI HAPUS (SAFE DELETE) */}
      {/* ==================================================================== */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus {deleteCandidate.type === 'class' ? 'Kelas' : 'Tahun Ajaran'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>"{deleteCandidate.name}"</strong>? Aksi ini akan diblokir oleh sistem jika data masih terhubung dengan siswa, jadwal, atau presensi.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
