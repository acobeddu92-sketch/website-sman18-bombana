import React from 'react';
import { prisma } from '@/lib/prisma';
import { getDailyMessage } from '@/lib/daily-message';
import { getActivePrincipal } from '@/lib/principal';
import SafeImage from '@/components/ui/SafeImage';
import HomeScrollManager from '@/components/public/HomeScrollManager';
import {
  Leaf,
  Quote,
  UserCheck,
  Sparkles,
  Calendar,
  Lightbulb,
  Sprout,
  Smile,
  HeartHandshake,
  BookOpen,
  Users,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let schoolProfile = null;
  let principalProfile = null;
  let homeBackground = null;
  let activePrincipal = null;

  try {
    [schoolProfile, principalProfile, homeBackground, activePrincipal] = await Promise.all([
      prisma.schoolProfile.findFirst(),
      prisma.principalProfile.findFirst(),
      prisma.homeBackground.findFirst({
        where: {
          is_active: true,
          NOT: { image: '' },
        },
        orderBy: { updated_at: 'desc' },
      }),
      getActivePrincipal(),
    ]);
  } catch (err) {
    console.error('Database query error in HomePage:', err);
  }

  const dailyMessage = await getDailyMessage();

  // Helper tampilan badge kategori Kata-Kata Hari Ini
  const getCategoryConfig = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'pantun':
        return {
          title: 'Pantun Jenaka',
          icon: <Smile className="w-3.5 h-3.5" />,
          badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
          accentBg: 'from-amber-500/10 via-white/5 to-orange-500/10',
          borderColor: 'border-white/25',
          emoji: '😄',
        };
      case 'nasehat':
        return {
          title: 'Nasehat Karakter',
          icon: <Sprout className="w-3.5 h-3.5" />,
          badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
          accentBg: 'from-emerald-500/10 via-white/5 to-teal-500/10',
          borderColor: 'border-white/25',
          emoji: '🌱',
        };
      case 'motivasi':
      default:
        return {
          title: 'Motivasi Belajar',
          icon: <Lightbulb className="w-3.5 h-3.5" />,
          badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
          accentBg: 'from-blue-500/10 via-white/5 to-indigo-500/10',
          borderColor: 'border-white/25',
          emoji: '💡',
        };
    }
  };

  const catConfig = getCategoryConfig(dailyMessage.category);

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const schoolName = schoolProfile?.school_name || 'SMA NEGERI 18 BOMBANA';
  const tagline =
    schoolProfile?.tagline ||
    'Membentuk Generasi Berkarakter, Cerdas, dan Berwawasan Lingkungan.';
  const principalName = activePrincipal?.name || 'Belum ditetapkan';
  const principalPosition =
    principalProfile?.position || 'Kepala SMA Negeri 18 Bombana';
  const principalMessage =
    principalProfile?.message ||
    'Mari kita jadikan sekolah sebagai tempat untuk tumbuh, belajar, berkarya, dan mempersiapkan masa depan dengan penuh integritas dan kecintaan pada lingkungan hidup.';
  const principalPhoto =
    activePrincipal?.photo || principalProfile?.photo || '/images/kepala-sekolah.jpg';

  const fourPillars = [
    {
      title: 'Green School Adiwiyata',
      desc: 'Asri, bersih, & bebas sampah plastik.',
      icon: Leaf,
      color: 'text-emerald-300 bg-emerald-500/20',
    },
    {
      title: 'Anti-Bullying & Friendly',
      desc: 'Ramah, inklusif, & saling mendukung.',
      icon: HeartHandshake,
      color: 'text-teal-300 bg-teal-500/20',
    },
    {
      title: 'Kurikulum Terpadu',
      desc: 'Literasi, sains, teknologi, & adab.',
      icon: BookOpen,
      color: 'text-blue-300 bg-blue-500/20',
    },
    {
      title: 'Guru Berdedikasi',
      desc: 'Pendidik profesional & berintegritas.',
      icon: Users,
      color: 'text-green-300 bg-green-500/20',
    },
  ];

  const hasActiveBackground = Boolean(homeBackground?.is_active && homeBackground?.image);

  return (
    <div className="relative flex-1 flex flex-col w-full min-h-0">
      <HomeScrollManager />

      {/* 1. BACKGROUND IMAGE LAYER (Hanya jika aktif di database, tanpa blur agar tetap tajam) */}
      {hasActiveBackground && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: `url('${homeBackground!.image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* 2. GRADIENT OVERLAY LAYER (Overlay lembut agar foto sekolah terlihat jelas) */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-emerald-950/20 to-slate-950/35 pointer-events-none" />
        </div>
      )}

      {/* 3. CONTENT HOME LAYER */}
      <div className="relative z-10 flex-1 flex flex-col justify-between py-2 sm:py-2.5 lg:py-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full gap-2.5 sm:gap-3 lg:gap-2.5 lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-hidden">
      
      {/* 1. HERO COMPACT SECTION (Glassmorphism Semi-Transparent) */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/35 to-teal-950/40 text-white p-3.5 sm:p-4 lg:p-4 shadow-lg shadow-black/10 border border-white/20 relative overflow-hidden shrink-0">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[10px] sm:text-xs font-semibold tracking-wide uppercase mb-1 border border-white/20 backdrop-blur-xs">
              <Leaf className="w-3 h-3 text-emerald-300" />
              <span>Green &amp; Friendly School Concept</span>
            </div>
            <h1 className="text-lg sm:text-2xl lg:text-2xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">
              {schoolName}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-normal max-w-3xl mt-0.5 drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">
              {tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <a
              href="/profil"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-emerald-900 font-bold text-xs shadow-sm hover:shadow transition-all"
            >
              <span>Profil Sekolah</span>
              <ArrowRight className="w-3 h-3" />
            </a>
            <a
              href="/informasi"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/25 backdrop-blur-xs transition-colors"
            >
              <span>Informasi</span>
            </a>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* 2. TWO-COLUMN CONTENT: PESAN KEPALA SEKOLAH & KATA-KATA HARI INI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 lg:gap-3 flex-1 min-h-0 items-stretch">
        
        {/* KOLOM KIRI (7 cols): PESAN KEPALA SEKOLAH (Glass Panel Transparan) */}
        <div className="lg:col-span-7 rounded-2xl bg-white/10 border border-white/25 p-3.5 sm:p-4 lg:p-4 shadow-lg shadow-black/10 flex flex-col justify-between relative overflow-hidden">
          <Quote className="absolute -bottom-2 right-2 w-20 h-20 text-white/[0.06] pointer-events-none -z-0" />
          
          <div className="relative z-10 flex items-center justify-between gap-2 pb-2 border-b border-white/15">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>Pesan Kepala Sekolah</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-200 bg-emerald-500/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Sambutan Resmi
            </span>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-3.5 my-auto py-2">
            {/* Foto Kepala Sekolah (Proporsional & Safe Image) */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-24 lg:h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white/40 bg-slate-900/40 shrink-0">
              <SafeImage
                src={principalPhoto}
                alt={principalName}
                className="w-full h-full object-cover object-top"
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-800 text-white p-2">
                    <UserCheck className="w-8 h-8 text-emerald-200 mb-1" />
                    <span className="text-[9px] font-medium text-emerald-100 text-center leading-tight">
                      Kepala Sekolah
                    </span>
                  </div>
                }
              />
            </div>

            {/* Nama, Jabatan & Pesan */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h2 className="text-sm sm:text-base font-bold text-white drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)] truncate">
                {principalName}
              </h2>
              <p className="text-xs font-semibold text-emerald-300 drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)] -mt-0.5">
                {principalPosition}
              </p>
              <blockquote className="mt-1.5 text-xs sm:text-sm italic text-slate-100 font-normal leading-relaxed border-l-2 border-emerald-400/80 pl-2.5 drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)] ">
                &ldquo;{principalMessage}&rdquo;
              </blockquote>
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-medium drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">Integritas, Budi Pekerti, &amp; Keteladanan</span>
            <span className="text-emerald-300 font-semibold drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">SMAN 18 Bombana</span>
          </div>
        </div>

        {/* KOLOM KANAN (5 cols): KATA-KATA HARI INI (Glass Panel Transparan + Large Quote Font) */}
        <div
          className={`lg:col-span-5 rounded-2xl bg-gradient-to-br ${catConfig.accentBg} border ${catConfig.borderColor} p-3.5 sm:p-4 lg:p-4 shadow-lg shadow-black/10 flex flex-col justify-between relative overflow-hidden`}
        >
          <Quote className="absolute -bottom-3 -right-2 w-28 h-28 text-white/[0.06] pointer-events-none -z-0" />

          {/* 1. Header: Kata-Kata Hari Ini + Kategori Badge */}
          <div className="relative z-10 flex items-center justify-between gap-2 pb-2 border-b border-white/15">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-bold text-white drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">
                Kata-Kata Hari Ini
              </span>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-xs ${catConfig.badgeBg}`}
            >
              <span>{catConfig.emoji}</span>
              <span>{catConfig.title}</span>
            </div>
          </div>

          {/* 2. Body: KUTIPAN UTAMA (FOKUS & BERUKURAN BESAR ~26-32px, Bold, High Contrast) */}
          <div className="relative z-10 my-auto py-2">
            <p className="text-lg sm:text-xl lg:text-[1.5rem] font-bold text-white leading-[1.35] tracking-tight italic  whitespace-pre-line text-center sm:text-left drop-shadow-sm [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">
              &ldquo;{dailyMessage.content}&rdquo;
            </p>
          </div>

          {/* 3. Footer: Author / Penutup & Tanggal */}
          <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
            <span className="font-semibold text-white drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)] truncate">
              — {dailyMessage.author || 'Inspirasi SMAN 18'}
            </span>
            <span className="text-[10px] text-white/70 flex items-center gap-1 shrink-0 drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">
              <Calendar className="w-3 h-3" />
              <span>{todayFormatted}</span>
            </span>
          </div>
        </div>

      </div>

      {/* 3. EMPAT NILAI UNGGULAN SEKOLAH (COMPACT 1x4 ROW - Glass Panel Transparan) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 lg:gap-2.5 shrink-0">
        {fourPillars.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-2.5 sm:p-3 rounded-xl bg-white/10 border border-white/25 shadow-xs hover:bg-white/20 hover:border-white/40 transition-all flex items-center gap-2.5"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white truncate leading-tight drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">
                  {item.title}
                </h3>
                <p className="text-[10px] text-white/80 truncate leading-tight mt-0.5 drop-shadow-xs [text-shadow:-1px_-1px_0_#047857,1px_-1px_0_#047857,-1px_1px_0_#047857,1px_1px_0_#047857,2px_2px_3px_rgba(0,0,0,0.7)]">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      </div>
    </div>
  );
}











