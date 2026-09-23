'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Shield,
  Key,
  Camera,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  MapPin,
  IdCard,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import LogoutButton from './LogoutButton';

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  nip?: string | null;
  nik?: string | null;
  photo?: string | null;
  phone?: string | null;
  gender?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  address?: string | null;
  force_password_change?: boolean;
  created_at?: string;
}

interface StudentData {
  id: string;
  nis?: string | null;
  nisn?: string | null;
  name: string;
  gender?: string | null;
  class_name: string;
  academic_year: string;
  parent_name?: string | null;
  parent_phone?: string | null;
  address?: string | null;
}

interface UserProfileViewProps {
  initialUser?: UserData | null;
  forcedMode?: boolean;
}

export default function UserProfileView({ initialUser, forcedMode = false }: UserProfileViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isForcedFromQuery = searchParams.get('forceChange') === 'true' || forcedMode;

  const [user, setUser] = useState<UserData | null>(initialUser || null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(!initialUser);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form State Profile
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nip: '',
    nik: '',
    phone: '',
    gender: 'L',
    birth_place: '',
    birth_date: '',
    address: '',
  });

  // Form State Password
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tabs: 'pribadi' | 'akun' | 'keamanan'
  const isLockedToPassword = Boolean(user?.force_password_change || isForcedFromQuery);
  const [activeTab, setActiveTab] = useState<'pribadi' | 'akun' | 'keamanan'>(
    isLockedToPassword ? 'keamanan' : 'pribadi'
  );

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setStudent(data.student || null);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          nip: data.user.nip || '',
          nik: data.user.nik || '',
          phone: data.user.phone || '',
          gender: data.user.gender || 'L',
          birth_place: data.user.birth_place || '',
          birth_date: data.user.birth_date ? data.user.birth_date.split('T')[0] : '',
          address: data.user.address || '',
        });
        if (data.user.force_password_change) {
          setActiveTab('keamanan');
        }
      } else {
        setErrorMsg(data.error || 'Gagal memuat data profil.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handler Upload Foto Profil
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Ukuran foto profil maksimal 3 MB.');
      return;
    }

    setUploadingPhoto(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch('/api/profile/photo', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setUser((prev) => (prev ? { ...prev, photo: data.url } : null));
        setSuccessMsg('Foto profil berhasil diperbarui.');
      } else {
        setErrorMsg(data.error || 'Gagal mengunggah foto profil.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi saat mengunggah foto.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handler Simpan Profil Pribadi
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: any = {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      };

      // Non-siswa boleh mengubah nama, NIP, NIK, dll.
      if (user?.role !== 'siswa') {
        payload.name = formData.name;
        payload.nip = formData.nip;
        payload.nik = formData.nik;
        payload.gender = formData.gender;
        payload.birth_place = formData.birth_place;
        payload.birth_date = formData.birth_date || null;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setSuccessMsg('Data profil berhasil disimpan.');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Gagal memperbarui profil.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handler Ganti Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!passwordData.oldPassword) {
      setErrorMsg('Password lama / sementara wajib diisi.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }
    if (passwordData.oldPassword === passwordData.newPassword) {
      setErrorMsg('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Password berhasil diperbarui.');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setUser((prev) => (prev ? { ...prev, force_password_change: false } : null));

        // Jika sebelumnya dipaksa ganti password, beri jeda lalu arahkan ke dashboard
        if (isLockedToPassword) {
          setTimeout(() => {
            if (user?.role === 'administrator') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          }, 1500);
        }
      } else {
        setErrorMsg(data.error || 'Gagal memperbarui password.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setSavingPassword(false);
    }
  };

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrator Sistem';
      case 'kepala_sekolah':
        return 'Kepala Sekolah';
      case 'wakasek_kurikulum':
        return 'Wakasek Kurikulum';
      case 'wakasek_kesiswaan':
        return 'Wakasek Kesiswaan';
      case 'kepala_perpustakaan':
        return 'Kepala Perpustakaan';
      case 'guru_mapel':
        return 'Guru Mata Pelajaran';
      case 'wali_kelas':
        return 'Wali Kelas';
      case 'guru_bk':
        return 'Guru BK';
      case 'pembina_osis':
        return 'Pembina OSIS';
      case 'pembina_pramuka':
        return 'Pembina Pramuka';
      case 'siswa':
        return 'Peserta Didik (Siswa)';
      case 'guru':
        return 'Guru Pendidik';
      default:
        return role || 'Pengguna';
    }
  };

  const dashboardBackUrl = user?.role === 'administrator' ? '/admin' : '/dashboard';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500 text-sm">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!isLockedToPassword && (
              <Link
                href={dashboardBackUrl}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Profil &amp; Akun Saya
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Kelola data identitas personel, kontak pribadi, dan keamanan akun Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isLockedToPassword && (
              <Link
                href={dashboardBackUrl}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Dashboard
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* Banner Wajib Ganti Password jika force_password_change aktif */}
        {isLockedToPassword && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-500 text-white shadow-lg flex items-start gap-4 animate-fadeIn">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <h3 className="font-bold text-base">Wajib Mengatur Password Baru</h3>
              <p className="leading-relaxed text-amber-100">
                Akun Anda sedang dalam status reset keamanan oleh Administrator. Anda diwajibkan mengganti password sementara dengan password pribadi baru sebelum dapat mengakses dashboard dan fitur sistem lainnya.
              </p>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 text-xs font-bold">
              Tutup
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">
              Tutup
            </button>
          </div>
        )}

        {/* Card Foto & Ringkasan Identitas */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Box & Upload Button */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
              {user?.photo ? (
                <SafeImage
                  src={user.photo}
                  alt={user.name}
                  className="w-full h-full object-cover object-top"
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-800 text-white font-bold text-2xl">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  }
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-3xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            {/* Tombol Kamera Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Ganti Foto Profil"
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* User Meta Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {getRoleTitle(user?.role)}
              </span>
              {user?.is_active ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Akun Aktif
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                  Nonaktif
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {user?.name}
            </h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <strong>Username:</strong> @{user?.username}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email}
              </span>
              {user?.nip && (
                <span className="flex items-center gap-1">
                  <IdCard className="w-3.5 h-3.5 text-slate-400" />
                  {user.nip}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              Foto profil format JPG, PNG, atau WEBP (maks. 3 MB).
              {uploadingPhoto && ' Sedang mengunggah...'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          {!isLockedToPassword ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('pribadi')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'pribadi'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Informasi Pribadi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('akun')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'akun'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Informasi Akun</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('keamanan')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'keamanan'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Keamanan &amp; Password</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 text-white text-xs sm:text-sm font-bold">
              <Key className="w-4 h-4" />
              <span>Keamanan &amp; Password (Wajib Diisi)</span>
            </div>
          )}
        </div>

        {/* TAB 1: INFORMASI PRIBADI */}
        {activeTab === 'pribadi' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                <span>Data Identitas &amp; Kontak Pribadi</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan informasi biodata Anda selalu mutakhir untuk kebutuhan administrasi sekolah.
              </p>
            </div>

            {/* KONTEN KHUSUS SISWA (SOT: Data akademik dari model Student bersifat Read-Only) */}
            {user?.role === 'siswa' && student && (
              <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-sky-700" />
                    Buku Induk &amp; Data Akademik Siswa (Dapodik)
                  </span>
                  <span className="text-[10px] font-bold bg-sky-200 text-sky-900 px-2.5 py-0.5 rounded-md">
                    Master Ledger Siswa (Read-Only)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-sky-800">Nama Siswa Resmi</label>
                    <div className="mt-0.5 font-bold text-slate-800 bg-white/80 px-3 py-2 rounded-xl border border-sky-200">
                      {student.name}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-sky-800">Nomor Induk Siswa (NIS)</label>
                    <div className="mt-0.5 font-bold text-slate-800 bg-white/80 px-3 py-2 rounded-xl border border-sky-200">
                      {student.nis || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-sky-800">NISN</label>
                    <div className="mt-0.5 font-bold text-slate-800 bg-white/80 px-3 py-2 rounded-xl border border-sky-200">
                      {student.nisn || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-sky-800">Rombongan Belajar (Kelas)</label>
                    <div className="mt-0.5 font-bold text-slate-800 bg-white/80 px-3 py-2 rounded-xl border border-sky-200">
                      {student.class_name} ({student.academic_year})
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-sky-800">Nama Orang Tua / Wali</label>
                    <div className="mt-0.5 font-bold text-slate-800 bg-white/80 px-3 py-2 rounded-xl border border-sky-200">
                      {student.parent_name || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-sky-800">Telepon Orang Tua</label>
                    <div className="mt-0.5 font-bold text-slate-800 bg-white/80 px-3 py-2 rounded-xl border border-sky-200">
                      {student.parent_phone || '-'}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-sky-700 italic">
                  * Nama dan catatan akademik siswa resmi dikelola oleh Bagian Tata Usaha/Kesiswaan melalui buku induk Dapodik.
                </p>
              </div>
            )}

            {/* FORM EDIT PROFIL */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama: Editable untuk non-siswa, Read-Only untuk siswa */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Nama Lengkap &amp; Gelar
                    </label>
                    {user?.role === 'siswa' && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Read-Only (Siswa)
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={user?.role === 'siswa'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email Akun */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* NIP (Khusus Tenaga Pendidik / Pegawai) */}
                {user?.role !== 'siswa' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NIP / Nomor Identitas Pegawai
                      </label>
                      <input
                        type="text"
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        placeholder="Contoh: 19800101 200501 1 002"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NIK (Nomor Induk Kependudukan)
                      </label>
                      <input
                        type="text"
                        value={formData.nik}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        placeholder="16 Digit NIK"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tempat Lahir
                      </label>
                      <input
                        type="text"
                        value={formData.birth_place}
                        onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                        placeholder="Kota / Kabupaten"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Nomor Telepon / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Handphone / WhatsApp Pribadi
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nama jalan, RT/RW, kelurahan, kecamatan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: INFORMASI AKUN (READ-ONLY) */}
        {activeTab === 'akun' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>Informasi Akun Sistem (Dikelola Administrator)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kredensial dan hak akses tingkat sistem untuk akun Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Username Login
                </span>
                <p className="font-mono text-sm font-bold text-slate-800">
                  @{user?.username}
                </p>
                <p className="text-[10px] text-slate-400">
                  Username ditetapkan saat pembuatan akun oleh Admin.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Peran / Role Pengguna
                </span>
                <p className="text-sm font-bold text-emerald-700">
                  {getRoleTitle(user?.role)}
                </p>
                <p className="text-[10px] text-slate-400">
                  Menentukan hak akses menu dan portal kerja sekolah.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status Akun
                </span>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aktif
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Terdaftar Sejak
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-700">Pemberitahuan Hak Akses:</p>
              <p>
                Administrator bertugas mengelola akun (username, role, status aktif, dan reset kredensial).
                Untuk perubahan role akun, silakan hubungi Administrator Sistem SMA Negeri 18 Bombana.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: KEAMANAN & PASSWORD */}
        {activeTab === 'keamanan' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <span>Ganti Password Akun</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Amankan akun Anda dengan mengganti password secara berkala menggunakan kombinasi yang kuat.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
              {/* Password Lama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Lama / Sementara
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, oldPassword: e.target.value })
                    }
                    placeholder="Ketik password saat ini"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru (Min. 6 Karakter)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Ketik password baru"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Ketik ulang password baru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>{savingPassword ? 'Menyimpan...' : 'Perbarui Password'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
