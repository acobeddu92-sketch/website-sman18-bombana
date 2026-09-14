import React from 'react';
import { ArrowRight, Leaf, Award, Users, BookOpen, ShieldCheck } from 'lucide-react';

interface HeroProps {
  schoolName?: string;
  tagline?: string;
}

export default function HeroSection({
  schoolName = 'SMA NEGERI 18 BOMBANA',
  tagline = 'Membentuk Generasi Berkarakter, Cerdas, dan Berwawasan Lingkungan',
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 py-16 sm:py-24 lg:py-28">
      {/* Dekorasi Latar Belakang Alam Lembut */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-green-200/25 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Kolom Teks Utama */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Badge Konsep Green & Friendly School */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <Leaf className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Green & Friendly School Concept</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Selamat Datang di <br />
              <span className="bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 bg-clip-text text-transparent">
                {schoolName}
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8">
              {tagline}. Membina insan muda yang unggul dalam ilmu pengetahuan, berakar kuat pada nilai luhur budi pekerti, serta mencintai kelestarian alam.
            </p>

            {/* Tombol Call to Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="/profil"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-base shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 transition-all duration-200"
              >
                <span>Jelajahi Profil Sekolah</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/informasi"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-base shadow-sm hover:shadow transition-all duration-200"
              >
                <span>Pengumuman & Agenda</span>
              </a>
            </div>

            {/* Fakta Singkat / Point Highlight */}
            <div className="mt-10 pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-emerald-800">Asri & Ramah</span>
                <span className="text-xs sm:text-sm text-slate-500">Lingkungan Belajar Hijau</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-emerald-800">Berkarakter</span>
                <span className="text-xs sm:text-sm text-slate-500">Disiplin & Beretika</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-emerald-800">Berprestasi</span>
                <span className="text-xs sm:text-sm text-slate-500">Akademik & Bakat</span>
              </div>
            </div>
          </div>

          {/* Kolom Visual / Banner Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Card Ilustrasi Visual Green School */}
              <div className="relative rounded-3xl bg-gradient-to-br from-emerald-800 to-green-900 p-8 text-white shadow-2xl shadow-emerald-900/25 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-200 border border-white/20">
                    <Leaf className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
                      Filosofi Pendidikan
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                      Mendidik Pikiran, Menumbuhkan Nurani, Menjaga Bumi.
                    </h2>
                  </div>

                  <p className="text-sm text-emerald-100/90 leading-relaxed">
                    Setiap sudut SMAN 18 Bombana dirancang untuk menjadi ruang belajar yang menyenangkan, aman, inklusif, dan penuh inspirasi bagi seluruh peserta didik.
                  </p>

                  <div className="space-y-3 pt-4 border-t border-white/15">
                    <div className="flex items-center gap-3 text-sm text-emerald-50">
                      <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
                      <span>Lingkungan Bebas Perundungan (Safe & Friendly)</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-emerald-50">
                      <BookOpen className="w-5 h-5 text-emerald-300 shrink-0" />
                      <span>Pembelajaran Interaktif & Berpusat Pada Siswa</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-emerald-50">
                      <Award className="w-5 h-5 text-emerald-300 shrink-0" />
                      <span>Pengembangan Bakat, Olahraga & Ekstrakurikuler</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
