import React from 'react';
import LogoutButton from './LogoutButton';
import { UserRole } from '@/lib/constants';
import {
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
  };
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalAnnouncements: number;
  };
}

export default function PrincipalView({ user, stats }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Topbar / Header Profile */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center text-white shadow-md">
              <UserCheck className="w-8 h-8 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  Kepala Sekolah
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

        {/* Statistik Ringkas Sekolah */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Dewan Guru</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.totalTeachers}</div>
            <p className="text-xs text-slate-500 mt-1">Tenaga pendidik aktif SMAN 18</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Peserta Didik</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.totalStudents}</div>
            <p className="text-xs text-slate-500 mt-1">Siswa terdaftar dalam sistem</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Pengumuman Resmi</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.totalAnnouncements}</div>
            <p className="text-xs text-slate-500 mt-1">Informasi publik yang tayang</p>
          </div>
        </div>

        {/* Sambutan & Panduan Kepemimpinan Sekolah */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>Pesan Kepemimpinan Green School</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
                Selamat datang di portal pimpinan SMA Negeri 18 Bombana. Melalui sistem terintegrasi ini, sekolah terus berupaya meningkatkan efisiensi tata kelola informasi, memupuk budaya mutu akademik, dan mengawal komitmen adiwiyata pelestarian lingkungan sekolah.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800">
                💡 <strong>Catatan Pimpinan:</strong> Pengaturan isi Pesan Kepala Sekolah yang tayang di Beranda publik dapat dikoordinasikan bersama Administrator melalui Dashboard Admin.
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Agenda Pimpinan
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Rapat Evaluasi Program Mutu Akademik</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Supervisi Lingkungan Hijau Adiwiyata</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Koordinasi Pembinaan Karakter Siswa</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
