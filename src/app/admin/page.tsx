import React from 'react';
import { prisma } from '@/lib/prisma';
import { getDailyMessage } from '@/lib/daily-message';
import {
  ShieldAlert,
  UserCheck,
  Users,
  GraduationCap,
  MessageSquareQuote,
  ArrowRight,
  Sparkles,
  Settings,
  PlusCircle,
  Home,
  CheckCircle2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Ambil data statistik sistem
  const [adminCount, kepsekCount, guruCount, siswaCount, totalQuotes, principal, totalAlbums, totalPhotos, totalAnnounce] =
    await Promise.all([
      prisma.user.count({ where: { role: 'administrator' } }),
      prisma.user.count({ where: { role: 'kepala_sekolah' } }),
      prisma.user.count({ where: { role: 'guru' } }),
      prisma.user.count({ where: { role: 'siswa' } }),
      prisma.dailyMessage.count({ where: { is_active: true } }),
      prisma.principalProfile.findFirst(),
      prisma.galleryAlbum.count(),
      prisma.galleryPhoto.count(),
      prisma.announcement.count(),
    ]);

  const dailyQuote = await getDailyMessage();

  const statCards = [
    {
      role: 'Administrator',
      count: adminCount,
      desc: 'Hak akses penuh sistem',
      icon: ShieldAlert,
      color: 'from-purple-500 to-indigo-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      role: 'Kepala Sekolah',
      count: kepsekCount,
      desc: 'Pimpinan & sambutan sekolah',
      icon: UserCheck,
      color: 'from-blue-500 to-cyan-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      role: 'Guru',
      count: guruCount,
      desc: 'Tenaga pendidik terdaftar',
      icon: Users,
      color: 'from-emerald-500 to-green-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      role: 'Siswa',
      count: siswaCount,
      desc: 'Peserta didik aktif',
      icon: GraduationCap,
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-green-800 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dashboard Administrator</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Sistem Informasi SMAN 18 Bombana
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 mt-2 leading-relaxed">
            Fondasi website, keamanan role-based access control (RBAC), pengaturan konten Beranda, dan sistem kata-kata harian otomatis berjalan normal.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-semibold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Kelola User</span>
            </a>
            <a
              href="/admin/beranda"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700/80 text-white font-semibold text-xs sm:text-sm border border-emerald-600/60 hover:bg-emerald-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Pengaturan Beranda</span>
            </a>
          </div>
        </div>

        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Bagian J: Kartu Statistik 4 Role User */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            Statistik Pengguna Terdaftar
          </h2>
          <span className="text-xs text-slate-500">Berdasarkan Role Internal</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.role}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${card.badgeBg}`}
                  >
                    {card.role}
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-slate-900">{card.count}</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">{card.desc}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Status: Aktif</span>
                  <a
                    href="/admin/users"
                    className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Lihat</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Informasi & Preview Sistem */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Preview Kata-Kata Hari Ini yang Aktif */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <MessageSquareQuote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Kata-Kata Hari Ini (Aktif di Beranda)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Koleksi aktif di database: {totalQuotes} kutipan
                  </p>
                </div>
              </div>

              <a
                href="/admin/kata-harian"
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Kelola Koleksi</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                  {dailyQuote.category}
                </span>
                <span className="text-xs text-slate-400">
                  Penulis: {dailyQuote.author || 'Anonim'}
                </span>
              </div>
              <p className="text-base font-medium text-slate-800 italic leading-relaxed whitespace-pre-line">
                &ldquo;{dailyQuote.content}&rdquo;
              </p>
            </div>

            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              💡 <strong>Mekanisme Otomatis:</strong> Kata-kata ini ditentukan secara deterministik oleh sistem berdasarkan tanggal hari ini dan tidak akan berubah sepanjang hari.
            </p>
          </div>

          {/* Pengaturan Cepat Home */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Pesan & Profil Kepala Sekolah
                  </h3>
                  <p className="text-xs text-slate-400">Konten resmi yang tampil di Beranda</p>
                </div>
              </div>

              <a
                href="/admin/beranda"
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Edit Konten</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 space-y-2">
              <p><strong>Nama:</strong> {principal?.name || 'H. Syafruddin, S.Pd., M.Pd.'}</p>
              <p><strong>Jabatan:</strong> {principal?.position || 'Kepala SMA Negeri 18 Bombana'}</p>
              <p className="italic text-slate-700 border-l-2 border-emerald-500 pl-3 py-1">
                &ldquo;{principal?.message}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Panel Status & Checklist Fondasi Phase 1 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Status Fondasi Phase 1</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Konsep Green & Friendly School</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Aktif</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Login Universal (Single Door)</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Aktif</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>RBAC Server-Side (4 Roles)</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Terproteksi</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Session HTTP-Only Cookie</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Aman</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>365+ Kata Harian Otomatis</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{totalQuotes} Kata</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Manajemen User (CRUD)</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Siap</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Galeri &amp; Album Foto</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{totalAlbums} Album / {totalPhotos} Foto</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Informasi &amp; Pengumuman</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{totalAnnounce} Data</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
