'use client';

import React from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { UserRole } from '@/lib/constants';
import {
  Flame,
  Compass,
  Users,
  Sparkles,
  Database,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  User as UserIcon,
} from 'lucide-react';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
  };
  type: 'osis' | 'pramuka';
}

export default function PembinaView({ user, type }: Props) {
  const isOsis = type === 'osis';

  const roleTitle = isOsis ? 'Pembina OSIS' : 'Pembina Pramuka';
  const roleSubtitle = isOsis
    ? 'Organisasi Siswa Intra Sekolah (OSIS)'
    : 'Gerakan Pramuka Gugus Depan SMAN 18 Bombana';

  const themeGradient = isOsis
    ? 'from-orange-600 to-amber-700'
    : 'from-amber-700 to-yellow-800';

  const badgeBg = isOsis
    ? 'bg-orange-50 text-orange-800 border-orange-200'
    : 'bg-amber-50 text-amber-800 border-amber-300';

  const IconHeader = isOsis ? Flame : Compass;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Profil Pembina */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${themeGradient} flex items-center justify-center text-white shadow-md shrink-0`}
            >
              <IconHeader className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeBg}`}
                >
                  {roleTitle}
                </span>
                <span className="text-xs text-slate-400 font-medium">SMAN 18 Bombana</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Username: @{user.username} {user.email ? `• ${user.email}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-slate-500" />
              <span>Profil Saya</span>
            </Link>
            <a
              href="/"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Lihat Website
            </a>
            <LogoutButton />
          </div>
        </div>

        {/* Status Banner: Dashboard Sedang Disiapkan */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-green-800 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal {roleTitle}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard {roleTitle} Sedang Disiapkan
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 mt-2 leading-relaxed">
              Selamat datang, <strong>{user.name}</strong>. Modul interaktif untuk pengelolaan kegiatan, keanggotaan, dan administrasi {roleSubtitle} sedang disiapkan secara bertahap.
            </p>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        </div>

        {/* Kartu Informasi & Kesiapan Integrasi Master Data Siswa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Integrasi Master Data Siswa */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 shadow-sm">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Terintegrasi Master Data Siswa
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Seluruh kepengurusan dan anggota {isOsis ? 'OSIS' : 'Pramuka'} terhubung langsung ke Master Data Siswa resmi SMAN 18 Bombana (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs">Student &rarr; Class</code>) menggunakan <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs">student_id</code> unik, tanpa duplikasi data.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Akses READ Terproteksi</span>
            </div>
          </div>

          {/* Card 2: Keamanan & Hak Akses */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Hak Akses Khusus &amp; Terisolasi
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Akun ini memiliki hak akses baca terhadap daftar siswa aktif untuk keperluan pembinaan organisasi kesiswaan. Pengelolaan master data siswa (CRUD) tetap dipegang penuh oleh Administrator sekolah.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-blue-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>RBAC Server-Side Aktif</span>
            </div>
          </div>

          {/* Card 3: Modul Mendatang */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className={`w-12 h-12 rounded-2xl ${isOsis ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-800'} flex items-center justify-center mb-4 shadow-sm`}>
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Fitur {isOsis ? 'OSIS' : 'Pramuka'} Mendatang
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Fitur pemilihan pengurus, pencatatan agenda kegiatan kesiswaan, absensi kegiatan, dan dokumentasi program kerja akan diaktifkan pada tahap pengembangan berikutnya.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Pengembangan Bertahap</span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-slate-400 pt-4">
          Sistem Informasi SMA Negeri 18 Bombana • Green &amp; Friendly School
        </div>

      </div>
    </div>
  );
}
