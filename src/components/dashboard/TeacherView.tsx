import React from 'react';
import LogoutButton from './LogoutButton';
import { UserRole } from '@/lib/constants';
import { BookOpen, Calendar, CheckSquare, Clock, GraduationCap, Users } from 'lucide-react';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
  };
}

export default function TeacherView({ user }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Profil Guru */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-8 h-8 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                  Dewan Guru
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {user.email} • Username: @{user.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <a
              href="/"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Lihat Website
            </a>
            <LogoutButton />
          </div>
        </div>

        {/* Banner Sambutan Guru */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Selamat Datang di Portal Guru SMAN 18 Bombana
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
            Terima kasih atas dedikasi dan ketulusan Bapak/Ibu dalam membimbing peserta didik. Pada Phase 1 ini, fondasi akun dan autentikasi terpadu sekolah telah aktif. Fitur manajemen pembelajaran lengkap akan dihadirkan pada fase pengembangan selanjutnya.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <Clock className="w-5 h-5 text-blue-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Jurnal & Presensi</h3>
              <p className="text-xs text-slate-500 mt-1">
                Modul presensi digital dan jurnal kegiatan mengajar harian (Tahap Berikutnya).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <CheckSquare className="w-5 h-5 text-emerald-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Penilaian Siswa</h3>
              <p className="text-xs text-slate-500 mt-1">
                Input nilai formatif, sumatif, dan deskripsi capaian kompetensi (Tahap Berikutnya).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <GraduationCap className="w-5 h-5 text-teal-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Bahan Ajar & Materi</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pusat repositori modul ajar dan tugas interaktif siswa (Tahap Berikutnya).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
