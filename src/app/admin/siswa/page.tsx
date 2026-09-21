'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Layers,
  FileText,
  UserCheck,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface StudentItem {
  id: string;
  name: string;
  nis: string | null;
  nisn: string | null;
  gender: string | null;
  class_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  class: {
    id: string;
    name: string;
    grade: string;
    academic_year: string;
    homeroom_teacher: {
      id: string;
      name: string;
      email: string;
      username: string;
    } | null;
  } | null;
  _count?: {
    attendance_items: number;
    violations: number;
    counselings: number;
  };
}

interface ClassOption {
  id: string;
  name: string;
  grade: string;
  academic_year: string;
  homeroom_teacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    students: number;
  };
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [detailStudent, setDetailStudent] = useState<StudentItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<StudentItem | null>(null);

  // Single Form State
  const [singleForm, setSingleForm] = useState({
    name: '',
    class_id: '',
    nis: '',
    nisn: '',
    gender: 'L',
    parent_name: '',
    parent_phone: '',
    address: '',
    is_active: true,
  });
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  // Bulk Form State
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkGender, setBulkGender] = useState('');
  const [bulkNamesText, setBulkNamesText] = useState('');
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    totalSubmitted: number;
    successCount: number;
    failedCount: number;
    failed: Array<{ name: string; reason: string }>;
  } | null>(null);

  // Feedback Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --------------------------------------------------------------------------
  // FETCHERS
  // --------------------------------------------------------------------------

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes || []);
        setAcademicYears(data.academicYears || []);
        if (data.classes.length > 0 && !singleForm.class_id) {
          setSingleForm((prev) => ({ ...prev, class_id: data.classes[0].id }));
          setBulkClassId(data.classes[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);
      if (classFilter !== 'all') params.set('class_id', classFilter);
      if (yearFilter !== 'all') params.set('academic_year', yearFilter);
      if (statusFilter !== 'all') params.set('is_active', statusFilter);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.students || []);
      } else {
        setErrorMsg(data.error || 'Gagal memuat master data siswa.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, classFilter, yearFilter, statusFilter]);

  // --------------------------------------------------------------------------
  // SINGLE STUDENT HANDLERS
  // --------------------------------------------------------------------------

  const openCreateSingleModal = () => {
    setEditingStudent(null);
    setSingleForm({
      name: '',
      class_id: classes[0]?.id || '',
      nis: '',
      nisn: '',
      gender: 'L',
      parent_name: '',
      parent_phone: '',
      address: '',
      is_active: true,
    });
    setErrorMsg('');
    setIsSingleModalOpen(true);
  };

  const openEditSingleModal = (st: StudentItem) => {
    setEditingStudent(st);
    setSingleForm({
      name: st.name,
      class_id: st.class_id || classes[0]?.id || '',
      nis: st.nis || '',
      nisn: st.nisn || '',
      gender: st.gender || 'L',
      parent_name: st.parent_name || '',
      parent_phone: st.parent_phone || '',
      address: st.address || '',
      is_active: st.is_active,
    });
    setErrorMsg('');
    setIsSingleModalOpen(true);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.name.trim() || !singleForm.class_id) {
      alert('Nama siswa dan kelas wajib diisi.');
      return;
    }

    setIsSubmittingSingle(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = editingStudent
        ? `/api/admin/students/${editingStudent.id}`
        : '/api/admin/students';
      const method = editingStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Data siswa berhasil disimpan.');
        setIsSingleModalOpen(false);
        fetchStudents();
        fetchClasses();
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan data siswa.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  // --------------------------------------------------------------------------
  // BULK INSERT HANDLERS
  // --------------------------------------------------------------------------

  const openBulkModal = () => {
    setBulkResult(null);
    setBulkNamesText('');
    setBulkClassId(classes[0]?.id || '');
    setBulkGender('');
    setErrorMsg('');
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkClassId) {
      alert('Silakan pilih kelas terlebih dahulu.');
      return;
    }

    if (!bulkNamesText.trim()) {
      alert('Ketik minimal satu nama siswa pada kotak teks.');
      return;
    }

    setIsSubmittingBulk(true);
    setBulkResult(null);

    try {
      const res = await fetch('/api/admin/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: bulkClassId,
          raw_names: bulkNamesText,
          default_gender: bulkGender || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBulkResult({
          totalSubmitted: data.totalSubmitted,
          successCount: data.successCount,
          failedCount: data.failedCount,
          failed: data.failed || [],
        });
        if (data.successCount > 0) {
          fetchStudents();
          fetchClasses();
        }
      } else {
        alert(data.error || 'Gagal memproses penambahan massal siswa.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // --------------------------------------------------------------------------
  // DELETE & DEACTIVATE HANDLERS
  // --------------------------------------------------------------------------

  const openDeleteModal = (st: StudentItem) => {
    setDeleteCandidate(st);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (forceDeactivate = false) => {
    if (!deleteCandidate) return;

    try {
      const url = forceDeactivate
        ? `/api/admin/students/${deleteCandidate.id}?action=deactivate`
        : `/api/admin/students/${deleteCandidate.id}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setIsDeleteModalOpen(false);
        setDeleteCandidate(null);
        fetchStudents();
      } else {
        alert(data.error || 'Gagal menghapus data siswa.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan jaringan.');
    }
  };

  // Selected class helper for Wali Kelas display
  const selectedClassForSingle = useMemo(() => {
    return classes.find((c) => c.id === singleForm.class_id);
  }, [classes, singleForm.class_id]);

  const selectedClassForBulk = useMemo(() => {
    return classes.find((c) => c.id === bulkClassId);
  }, [classes, bulkClassId]);

  return (
    <div className="space-y-6 sm:space-y-8 antialiased">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
            <UserCheck className="w-7 h-7 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                Satu Master Data Terpusat
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Data Siswa SMA Negeri 18 Bombana
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Basis data tunggal siswa yang terhubung ke seluruh peran pendidik, bimbingan BK, dan kesiswaan.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={openCreateSingleModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            + Tambah Siswa
          </button>
          <button
            onClick={openBulkModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all"
          >
            <Layers className="w-4 h-4" />
            + Tambah Banyak Siswa
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Master Class Empty Warning */}
      {classes.length === 0 && !isLoading && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            Belum Ada Master Data Kelas
          </div>
          <p className="text-slate-600 leading-relaxed">
            Data siswa harus terhubung ke kelas resmi sekolah. Anda belum memiliki data rombel kelas pada database. Silakan buat data kelas terlebih dahulu agar siswa dapat ditempatkan pada kelasnya.
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIS, atau NISN..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-700"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name} ({c.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-700"
            >
              <option value="all">Semua Tahun Ajaran</option>
              {academicYears.map((yr) => (
                <option key={yr} value={yr}>
                  T.A. {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="true">Siswa Aktif</option>
              <option value="false">Siswa Non-Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-semibold">Memuat master data siswa...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-3 max-w-sm mx-auto px-4">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">Belum Ada Data Siswa</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tidak ada data siswa yang cocok dengan kriteria pencarian atau database masih kosong.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={openCreateSingleModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                + Tambah Satu Siswa
              </button>
              <button
                onClick={openBulkModal}
                className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs"
              >
                + Input Massal
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">No</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Wali Kelas</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-medium">
                      {idx + 1}
                    </td>

                    {/* Nama Siswa */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{st.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>NIS: {st.nis || '-'}</span>
                        <span>•</span>
                        <span>NISN: {st.nisn || '-'}</span>
                        <span>•</span>
                        <span>{st.gender === 'L' ? 'Laki-laki' : st.gender === 'P' ? 'Perempuan' : '-'}</span>
                      </div>
                    </td>

                    {/* Kelas */}
                    <td className="py-3.5 px-4">
                      {st.class ? (
                        <div>
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-bold text-xs">
                            Kelas {st.class.name}
                          </span>
                          <span className="block text-[11px] text-slate-400 mt-1">
                            T.A. {st.class.academic_year}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum ditentukan</span>
                      )}
                    </td>

                    {/* Wali Kelas */}
                    <td className="py-3.5 px-4">
                      {st.class?.homeroom_teacher ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {st.class.homeroom_teacher.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block leading-tight">
                              {st.class.homeroom_teacher.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono leading-tight">
                              @{st.class.homeroom_teacher.username || st.class.homeroom_teacher.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum ditugaskan</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          st.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setDetailStudent(st);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Detail Siswa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditSingleModal(st)}
                          className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(st)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-600 hover:text-rose-800 transition-colors"
                          title="Hapus / Nonaktifkan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Statistics */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Menampilkan {students.length} peserta didik</span>
          <span className="font-semibold text-emerald-800">
            Total Rombel Kelas Terdaftar: {classes.length} Rombel
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: TAMBAH / EDIT SISWA (SINGLE) */}
      {/* ===================================================================== */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingStudent ? 'Edit Master Data Siswa' : 'Tambah Siswa Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Isi rincian data siswa untuk dimasukkan ke master data sekolah.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              {/* Nama Siswa */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={singleForm.name}
                  onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                  placeholder="e.g. Ahmad Fauzan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Kelas & Wali Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={singleForm.class_id}
                    onChange={(e) => setSingleForm({ ...singleForm, class_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Pilih Kelas...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name} ({c.grade}) • T.A. {c.academic_year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Wali Kelas (Otomatis dari Rombel)
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold truncate">
                    {selectedClassForSingle?.homeroom_teacher?.name || (
                      <span className="text-slate-400 italic">Belum ada wali kelas</span>
                    )}
                  </div>
                </div>
              </div>

              {/* NIS & NISN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Opsional)</label>
                  <input
                    type="text"
                    value={singleForm.nis}
                    onChange={(e) => setSingleForm({ ...singleForm, nis: e.target.value })}
                    placeholder="Nomor Induk Siswa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN (Opsional)</label>
                  <input
                    type="text"
                    value={singleForm.nisn}
                    onChange={(e) => setSingleForm({ ...singleForm, nisn: e.target.value })}
                    placeholder="Nomor Induk Siswa Nasional"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <div className="flex gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="L"
                      checked={singleForm.gender === 'L'}
                      onChange={(e) => setSingleForm({ ...singleForm, gender: e.target.value })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700">Laki-laki (L)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="P"
                      checked={singleForm.gender === 'P'}
                      onChange={(e) => setSingleForm({ ...singleForm, gender: e.target.value })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700">Perempuan (P)</span>
                  </label>
                </div>
              </div>

              {/* Data Orang Tua & Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Orang Tua / Wali (Opsional)
                  </label>
                  <input
                    type="text"
                    value={singleForm.parent_name}
                    onChange={(e) => setSingleForm({ ...singleForm, parent_name: e.target.value })}
                    placeholder="Nama ayah/ibu/wali"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. Telp / WhatsApp Orang Tua (Opsional)
                  </label>
                  <input
                    type="text"
                    value={singleForm.parent_phone}
                    onChange={(e) => setSingleForm({ ...singleForm, parent_phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Rumah (Opsional)</label>
                <textarea
                  rows={2}
                  value={singleForm.address}
                  onChange={(e) => setSingleForm({ ...singleForm, address: e.target.value })}
                  placeholder="Alamat domisili peserta didik..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Status Aktif */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={singleForm.is_active}
                    onChange={(e) => setSingleForm({ ...singleForm, is_active: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">Status Siswa Aktif</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSingle}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {isSubmittingSingle ? 'Menyimpan...' : 'Simpan Data Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: INPUT SISWA SECARA MASSAL (BULK) */}
      {/* ===================================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tambah Banyak Siswa Sekaligus (Batch Input)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Masukkan daftar nama siswa sekaligus satu nama per baris.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hasil Eksekusi Bulk */}
            {bulkResult && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">Hasil Pemrosesan Batch:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      {bulkResult.successCount} Berhasil
                    </span>
                    {bulkResult.failedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                        {bulkResult.failedCount} Gagal/Dilewati
                      </span>
                    )}
                  </div>
                </div>

                {bulkResult.failed.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="font-bold text-rose-800 block">Rincian Siswa yang Gagal/Dilewati:</span>
                    <div className="max-h-32 overflow-y-auto space-y-1 bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                      {bulkResult.failed.map((fail, i) => (
                        <div key={i} className="text-rose-700">
                          • <b>{fail.name}</b>: {fail.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pilih Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={bulkClassId}
                    onChange={(e) => setBulkClassId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">Pilih Kelas...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name} ({c.grade}) • T.A. {c.academic_year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wali Kelas Terpilih */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wali Kelas</label>
                  <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold truncate">
                    {selectedClassForBulk?.homeroom_teacher?.name || (
                      <span className="text-slate-400 italic">Belum ada wali kelas</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Textarea Nama Siswa */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Daftar Nama Siswa (Satu nama per baris) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Baris kosong akan otomatis diabaikan</span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={bulkNamesText}
                  onChange={(e) => setBulkNamesText(e.target.value)}
                  placeholder={`Ahmad Fauzan\nAndi Saputra\nBudi Setiawan\nCitra Lestari\nDewi Sartika`}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-500 italic">
                  *Sistem akan memeriksa dan mencegah duplikasi nama di kelas yang sama.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBulk}
                    className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-md shadow-teal-700/20 disabled:opacity-50 transition-all"
                  >
                    {isSubmittingBulk ? 'Memproses Batch...' : 'Simpan Seluruh Siswa'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: DETAIL PROFIL SISWA & RIWAYAT TERPADU */}
      {/* ===================================================================== */}
      {isDetailModalOpen && detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center">
                  {detailStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{detailStudent.name}</h3>
                  <p className="text-xs text-slate-500">
                    NIS: {detailStudent.nis || '-'} • NISN: {detailStudent.nisn || '-'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Kelas</span>
                <span className="font-bold text-slate-800">
                  {detailStudent.class ? `Kelas ${detailStudent.class.name}` : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Wali Kelas</span>
                <span className="font-bold text-slate-800">
                  {detailStudent.class?.homeroom_teacher?.name || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Jenis Kelamin</span>
                <span className="font-bold text-slate-800">
                  {detailStudent.gender === 'L' ? 'Laki-laki' : detailStudent.gender === 'P' ? 'Perempuan' : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Orang Tua</span>
                <span className="font-bold text-slate-800">{detailStudent.parent_name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kontak Orang Tua</span>
                <span className="font-mono text-slate-800">{detailStudent.parent_phone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status Akun</span>
                <span className="font-bold text-emerald-700">
                  {detailStudent.is_active ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>
              {detailStudent.address && (
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 block text-[11px]">Alamat</span>
                  <span className="text-slate-700">{detailStudent.address}</span>
                </div>
              )}
            </div>

            {/* Riwayat Keterhubungan di Sistem */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Keterhubungan Data di Sistem Sekolah:
              </span>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                  <span className="text-lg font-black text-blue-700 block">
                    {detailStudent._count?.attendance_items || 0}
                  </span>
                  <span className="text-[11px] text-blue-800 font-semibold">Rekap Absensi</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
                  <span className="text-lg font-black text-rose-700 block">
                    {detailStudent._count?.violations || 0}
                  </span>
                  <span className="text-[11px] text-rose-800 font-semibold">Pelanggaran Tata Tertib</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
                  <span className="text-lg font-black text-purple-700 block">
                    {detailStudent._count?.counselings || 0}
                  </span>
                  <span className="text-[11px] text-purple-800 font-semibold">Sesi Konseling BK</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: KONFIRMASI HAPUS / NONAKTIFKAN */}
      {/* ===================================================================== */}
      {isDeleteModalOpen && deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Penghapusan Siswa</h3>
                <p className="text-xs text-slate-500">Pemeriksaan integritas relasi data sekolah</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Anda akan memproses data siswa <b>"{deleteCandidate.name}"</b> (Kelas {deleteCandidate.class?.name || '-'}).
            </p>

            {/* Cek Riwayat Terkait */}
            {deleteCandidate._count &&
            (deleteCandidate._count.attendance_items > 0 ||
              deleteCandidate._count.violations > 0 ||
              deleteCandidate._count.counselings > 0) ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Siswa Memiliki Riwayat Data Historis
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Siswa ini memiliki {deleteCandidate._count.attendance_items} rekap absensi, {deleteCandidate._count.violations} pelanggaran, dan {deleteCandidate._count.counselings} konseling. Demi keamanan audit sekolah, penghapusan permanen diblokir. Silakan pilih <b>Nonaktifkan Siswa</b>.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
                  >
                    Nonaktifkan Siswa (Aman)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                <p className="text-[11px]">
                  Siswa ini belum memiliki riwayat relasi. Penghapusan akan menghapus record secara permanen dari database.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Batal
              </button>

              {/* Tombol Hapus Permanen hanya aktif jika benar-benar bersih tanpa relasi */}
              {deleteCandidate._count &&
                deleteCandidate._count.attendance_items === 0 &&
                deleteCandidate._count.violations === 0 &&
                deleteCandidate._count.counselings === 0 && (
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(false)}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    Hapus Permanen
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
