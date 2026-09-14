import React from 'react';
import { Leaf, Users, BookOpen, Shield, HeartHandshake, Trees } from 'lucide-react';

export default function QuickInfoSection() {
  const features = [
    {
      icon: <Leaf className="w-6 h-6 text-emerald-600" />,
      title: 'Green School & Adiwiyata',
      desc: 'Komitmen kuat menciptakan lingkungan belajar yang hijau, asri, bersih, dan bebas sampah plastik.',
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-teal-600" />,
      title: 'Friendly & Anti-Bullying',
      desc: 'Iklim sekolah yang hangat, ramah, dan saling mendukung tanpa kekerasan maupun perundungan.',
    },
    {
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      title: 'Kurikulum Terpadu',
      desc: 'Mengintegrasikan kecakapan literasi, sains, teknologi digital, dan penguatan budi pekerti.',
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-700" />,
      title: 'Guru Berdedikasi',
      desc: 'Tenaga pendidik profesional yang mengajar dengan hati dan siap mendampingi setiap langkah siswa.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Nilai Unggulan
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            Mengapa SMA Negeri 18 Bombana?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            Fondasi pendidikan holistik yang menyeimbangkan kecerdasan akademis dengan keluhuran budi pekerti dan kesadaran lingkungan hidup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-emerald-800 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
