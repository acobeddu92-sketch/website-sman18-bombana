import React from 'react';
import { prisma } from '@/lib/prisma';
import { Bell, Calendar, Newspaper, ArrowRight, Tag } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

export const dynamic = 'force-dynamic';

export default async function InformasiPage() {
  let announcements: any[] = [];
  try {
    announcements = await prisma.announcement.findMany({
      where: { is_published: true },
      orderBy: { published_at: 'desc' },
    });
  } catch (err) {
    console.error(err);
  }

  if (announcements.length === 0) {
    announcements = [
      {
        id: '1',
        title: 'Jadwal Penilaian Akhir Semester & Pembagian Rapor',
        content: 'Diberitahukan kepada seluruh peserta didik kelas X, XI, dan XII bahwa pelaksanaan asesmen semester akan dimulai minggu depan.',
        category: 'pengumuman',
        published_at: new Date(),
      },
      {
        id: '2',
        title: 'Aksi Bersih Lingkungan Serentak & Kompos Mandiri',
        content: 'Kegiatan rutin Jumat Bersih dalam rangka menguatkan program Adiwiyata Green School SMAN 18 Bombana.',
        category: 'agenda',
        published_at: new Date(),
      },
      {
        id: '3',
        title: 'Siswa SMAN 18 Raih Medali Perunggu Olimpiade Sains',
        content: 'Apresiasi tinggi kepada tim olimpiade biologi dan kebumian yang telah mengharumkan nama sekolah di kancah regional.',
        category: 'berita',
        published_at: new Date(),
      }
    ];
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Halaman */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            Kabar & Informasi
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Informasi Umum & Pengumuman
          </h1>
          <p className="text-base text-slate-600 mt-3">
            Pusat berita, pengumuman resmi, dan agenda kegiatan sekolah terkini.
          </p>
          <div className="w-16 h-1 bg-emerald-600 rounded-full mx-auto mt-4" />
        </div>

        {/* List Card Informasi */}
        <div className="max-w-4xl mx-auto space-y-6">
          {announcements.map((item) => {
            const dateStr = new Intl.DateTimeFormat('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(item.published_at));

            const isAgenda = item.category === 'agenda';
            const isBerita = item.category === 'berita';

            return (
              <div
                key={item.id}
                className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isAgenda
                          ? 'bg-amber-100 text-amber-900'
                          : isBerita
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {isAgenda ? <Calendar className="w-3.5 h-3.5" /> : isBerita ? <Newspaper className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      <span>{item.category}</span>
                    </span>
                    <span className="text-xs text-slate-400">• {dateStr}</span>
                  </div>
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Resmi Sekolah
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {item.image && (
                    <div className="w-full md:w-56 h-48 md:h-40 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/70">
                      <SafeImage
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        fallback={null}
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 hover:text-emerald-700 transition-colors mb-3">
                        {item.title}
                      </h2>

                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Diterbitkan oleh SMAN 18 Bombana</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        Informasi Terverifikasi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
