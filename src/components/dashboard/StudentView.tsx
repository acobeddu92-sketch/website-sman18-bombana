import React from 'react';
import LogoutButton from './LogoutButton';
import { UserRole } from '@/lib/constants';
import { GraduationCap, Award, Calendar, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
  };
}

export default function StudentView({ user }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Profil Siswa */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-8 h-8 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  Peserta Didik
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                NIS / Username: @{user.username} • {user.email}
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

        {/* Sambutan & Motivasi Siswa */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Portal Siswa SMAN 18 Bombana</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
            Halo {user.name}, Semangat Belajar Hari Ini!
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
            Jadilah siswa yang senantiasa menjaga adab, tekun menimba ilmu pengetahuan, dan aktif menjaga kebersihan lingkungan sekolah. Akun siswa Anda telah terhubung ke basis data resmi SMA Negeri 18 Bombana.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <Calendar className="w-5 h-5 text-emerald-700 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Jadwal Pelajaran</h3>
              <p className="text-xs text-slate-500 mt-1">
                Akses jadwal pelajaran mingguan dan agenda kelas (Tahap Berikutnya).
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/60">
              <BookOpen className="w-5 h-5 text-teal-700 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Tugas & Materi</h3>
              <p className="text-xs text-slate-500 mt-1">
                Unduh materi pembelajaran dan pantau batas pengumpulan tugas (Tahap Berikutnya).
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <Award className="w-5 h-5 text-amber-700 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Capaian & Rapor</h3>
              <p className="text-xs text-slate-500 mt-1">
                Laporan nilai akademik dan catatan prestasi peserta didik (Tahap Berikutnya).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
