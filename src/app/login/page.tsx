'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SafeImage from '@/components/ui/SafeImage';
import {
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

const ROLE_NAMES: Record<string, string> = {
  administrator: 'Administrator',
  kepala_sekolah: 'Kepala Sekolah',
  wakasek_kurikulum: 'Wakasek Kurikulum',
  wakasek_kesiswaan: 'Wakasek Kesiswaan',
  kepala_perpustakaan: 'Kepala Perpustakaan',
  guru_mapel: 'Guru Mapel',
  wali_kelas: 'Wali Kelas',
  siswa: 'Siswa',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get('error');
  const roleParam = searchParams.get('role');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan saat masuk.');
        setIsLoading(false);
        return;
      }

      // Redirection otomatis berdasarkan role yang ditentukan oleh server/database
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        router.refresh();
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Koneksi ke server terputus. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50/40 relative overflow-hidden py-12">
      
      {/* Ornamen Lingkungan Hijau Lembut */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-green-200/30 blur-3xl pointer-events-none" />

      {/* Tombol Kembali ke Beranda */}
      <div className="w-full max-w-md mb-4">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors p-1 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </a>
      </div>

      {/* Card Login */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100/80 p-8 sm:p-10 relative z-10">
        
        {/* Header Logo & Identitas */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-200/80 p-2 flex items-center justify-center mx-auto shadow-md shadow-emerald-700/10 mb-4 overflow-hidden">
            <SafeImage
              src="/images/logo.svg"
              alt="Logo SMAN 18"
              className="w-full h-full object-contain"
              fallback={<GraduationCap className="w-9 h-9 text-emerald-600" />}
            />
          </div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            SMA NEGERI 18 BOMBANA
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Selamat Datang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Silakan masuk menggunakan akun sekolah Anda.
          </p>
          {roleParam && ROLE_NAMES[roleParam] && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold animate-fadeIn">
              <span>Portal:</span>
              <span className="font-bold">{ROLE_NAMES[roleParam]}</span>
            </div>
          )}
        </div>

        {/* Notifikasi Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-800 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Form Login Universal */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Username */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Input Password dengan Toggle Lihat/Sembunyikan */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-700 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tombol Submit Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>LOGIN</span>
              </>
            )}
          </button>
        </form>

        {/* Informasi Bantuan */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Satu pintu login terintegrasi untuk seluruh civitas akademika.<br />
            Lupa password? Silakan hubungi <strong>Administrator Sekolah</strong>.
          </p>
        </div>

      </div>

      {/* Footer Hak Cipta */}
      <p className="mt-8 text-xs text-slate-400 text-center">
        © {new Date().getFullYear()} SMA Negeri 18 Bombana • Green & Friendly School
      </p>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
          Memuat halaman login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

