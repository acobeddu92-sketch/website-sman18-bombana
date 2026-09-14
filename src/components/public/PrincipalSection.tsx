import React from 'react';
import { Quote, UserCheck } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface PrincipalProps {
  name: string;
  position: string;
  message: string;
  photo?: string | null;
}

export default function PrincipalSection({
  name = 'H. Syafruddin, S.Pd., M.Pd.',
  position = 'Kepala SMA Negeri 18 Bombana',
  message = 'Mari kita jadikan sekolah sebagai tempat untuk tumbuh, belajar, berkarya, dan mempersiapkan masa depan.',
  photo = '/images/kepala-sekolah.jpg',
}: PrincipalProps) {
  return (
    <section className="py-16 sm:py-20 bg-white border-y border-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sambutan Pimpinan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pesan Kepala Sekolah
          </h2>
          <div className="w-12 h-1 bg-emerald-600 rounded-full mx-auto mt-3" />
        </div>

        {/* Card Konten Sambutan */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-50/80 border border-emerald-100/70 p-6 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden">
          <Quote className="absolute top-6 right-6 w-24 h-24 text-emerald-100/60 -z-0 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Kolom Foto Kepala Sekolah */}
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-md border-4 border-white bg-gradient-to-br from-emerald-100 to-slate-200">
                <SafeImage
                  src={photo}
                  alt={name}
                  className="w-full h-full object-cover object-top"
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-800 text-white p-4">
                      <UserCheck className="w-16 h-16 text-emerald-200 mb-2" />
                      <span className="text-xs font-medium text-emerald-100">Foto Kepala Sekolah</span>
                    </div>
                  }
                />
              </div>
              <div className="mt-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">{name}</h3>
                <p className="text-xs sm:text-sm font-medium text-emerald-700">{position}</p>
              </div>
            </div>

            {/* Kolom Kutipan Sambutan */}
            <div className="md:col-span-8 flex flex-col justify-center">
              <div className="prose prose-slate max-w-none">
                <blockquote className="text-base sm:text-lg italic text-slate-700 leading-relaxed pl-4 border-l-4 border-emerald-500 my-0">
                  &ldquo;{message}&rdquo;
                </blockquote>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  SMA Negeri 18 Bombana • Bersama Membangun Karakter Bangsa
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md">
                  Integritas & Keteladanan
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
