import React from 'react';
import { Lightbulb, Sprout, Smile, Calendar, Sparkles } from 'lucide-react';

interface DailyMessageProps {
  content: string;
  category: string; // 'motivasi' | 'nasehat' | 'pantun'
  author?: string | null;
}

export default function DailyMessageSection({
  content = 'Kesuksesan bukan tentang siapa yang paling cepat, tetapi siapa yang tidak berhenti melangkah.',
  category = 'motivasi',
  author = 'Inspirasi Belajar',
}: DailyMessageProps) {
  // Pengaturan visual badge berdasarkan kategori
  const getCategoryConfig = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'pantun':
        return {
          title: 'Pantun Jenaka & Edukatif',
          icon: <Smile className="w-4 h-4" />,
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          accentColor: 'from-amber-50 to-orange-50/40',
          borderColor: 'border-amber-200/80',
          tagIcon: '😄',
        };
      case 'nasehat':
        return {
          title: 'Nasehat Karakter & Budi Pekerti',
          icon: <Sprout className="w-4 h-4" />,
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          accentColor: 'from-emerald-50 to-teal-50/40',
          borderColor: 'border-emerald-200/80',
          tagIcon: '🌱',
        };
      case 'motivasi':
      default:
        return {
          title: 'Motivasi Belajar',
          icon: <Lightbulb className="w-4 h-4" />,
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          accentColor: 'from-blue-50 to-indigo-50/40',
          borderColor: 'border-blue-200/80',
          tagIcon: '💡',
        };
    }
  };

  const config = getCategoryConfig(category);

  // Format tanggal hari ini dalam format Bahasa Indonesia (misal: 3 September 2026)
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 via-emerald-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Container Kartu Kata-Kata Hari Ini */}
        <div className="max-w-3xl mx-auto">
          <div
            className={`rounded-3xl bg-gradient-to-br ${config.accentColor} bg-white p-6 sm:p-10 border ${config.borderColor} shadow-md shadow-emerald-900/5 relative overflow-hidden transition-all duration-300 hover:shadow-lg`}
          >
            {/* Header Mini */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-white shadow-sm text-emerald-700">
                  <Sparkles className="w-5 h-5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                    Kata-Kata Hari Ini
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{todayFormatted}</span>
                  </p>
                </div>
              </div>

              {/* Badge Kategori */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.badgeBg}`}
              >
                <span>{config.tagIcon}</span>
                <span>{config.title}</span>
              </div>
            </div>

            {/* Isi Kutipan (Mendukung baris baru untuk bait pantun) */}
            <div className="my-4">
              <p className="text-lg sm:text-xl font-medium text-slate-800 leading-relaxed whitespace-pre-line italic text-center sm:text-left">
                &ldquo;{content}&rdquo;
              </p>
            </div>

            {/* Footer Kartu */}
            <div className="mt-8 pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                — {author || 'Inspirasi SMAN 18'}
              </span>
              <span className="italic text-[11px] text-slate-400">
                Otomatis diperbarui setiap hari • Konsisten sepanjang hari
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
