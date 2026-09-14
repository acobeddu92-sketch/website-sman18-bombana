import React from 'react';
import { prisma } from '@/lib/prisma';
import {
  Compass,
  Award,
  BookOpen,
  CheckCircle2,
  Trees,
  Target,
  MapPin,
  Phone,
  Mail,
  Globe,
  School,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  let profile = null;
  try {
    profile = await prisma.schoolProfile.findFirst();
  } catch (e) {
    console.error(e);
  }

  const defaultFacilities = [
    { name: 'Ruang Kelas Nyaman & Asri', desc: 'Dilengkapi ventilasi silang udara segar alami dan pencahayaan optimal.' },
    { name: 'Laboratorium IPA & Komputer', desc: 'Sarana praktikum sains dan literasi digital berkecepatan tinggi.' },
    { name: 'Perpustakaan Ramah Baca', desc: 'Koleksi buku lengkap dengan pojok baca santai yang teduh.' },
    { name: 'Taman Sekolah & Hutan Mini', desc: 'Area konservasi tanaman lokal dan pembelajaran adiwiyata luar kelas.' },
    { name: 'Lapangan Olahraga Serbaguna', desc: 'Fasilitas futsal, basket, voli, dan bulutangkis.' },
    { name: 'Musala & Ruang Bimbingan Konseling', desc: 'Pembinaan karakter spiritual dan konsultasi akademik siswa.' },
  ];

  const defaultExtracurriculars = [
    { name: 'Pramuka (Gugus Depan)', desc: 'Membina kemandirian, kedisiplinan, dan jiwa kepemimpinan.' },
    { name: 'PMR / KSR', desc: 'Keterampilan pertolongan pertama dan aksi kemanusiaan sosial.' },
    { name: 'Paskibra Sekolah', desc: 'Pelatihan kedisiplinan baris-berbaris dan upacara bendera.' },
    { name: 'Klub Peduli Lingkungan (Green Club)', desc: 'Pengelolaan daur ulang sampah, kompos, dan hidroponik.' },
    { name: 'Klub Olahraga & Seni Tari', desc: 'Pengembangan minat bakat seni budaya lokal Bombana dan atletik.' },
    { name: 'Klub Sains & Informatika', desc: 'Eksplorasi olimpiade sains dan keterampilan komputer kreatif.' },
  ];

  let facilities = defaultFacilities;
  if (profile?.facilities) {
    try {
      const parsed = JSON.parse(profile.facilities);
      if (Array.isArray(parsed) && parsed.length > 0) facilities = parsed;
    } catch {
      // fallback
    }
  }

  let extracurriculars = defaultExtracurriculars;
  if (profile?.extracurriculars) {
    try {
      const parsed = JSON.parse(profile.extracurriculars);
      if (Array.isArray(parsed) && parsed.length > 0) extracurriculars = parsed;
    } catch {
      // fallback
    }
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Halaman */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="w-20 h-20 rounded-2xl bg-white border border-emerald-200/80 p-2 mx-auto mb-4 shadow-sm flex items-center justify-center overflow-hidden">
            <SafeImage
              src={profile?.logo || '/images/logo.svg'}
              alt="Logo Sekolah"
              className="w-full h-full object-contain"
              fallback={<School className="w-10 h-10 text-emerald-600" />}
            />
          </div>

          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            Tentang Kami
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Profil {profile?.school_name || 'SMA NEGERI 18 BOMBANA'}
          </h1>
          <p className="text-base text-slate-600 mt-3">
            {profile?.tagline || 'Mengenal lebih dekat visi, misi, sejarah, fasilitas, dan ekosistem pendidikan Green & Friendly School.'}
          </p>
          <div className="w-16 h-1 bg-emerald-600 rounded-full mx-auto mt-4" />
        </div>

        {/* 1. Visi, Misi, & Tujuan */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-6 rounded-3xl bg-gradient-to-br from-emerald-800 to-green-900 text-white p-8 sm:p-10 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div>
              <Compass className="w-10 h-10 text-emerald-300 mb-4" />
              <h2 className="text-2xl font-bold mb-4">Visi Sekolah</h2>
              <p className="text-emerald-100 text-lg sm:text-xl font-medium leading-relaxed italic">
                &ldquo;{profile?.vision || 'Menjadi sekolah unggul yang menghasilkan lulusan berakhlak mulia, cerdas, kompetitif, dan berwawasan lingkungan hidup.'}&rdquo;
              </p>
            </div>
            {profile?.goals && (
              <div className="mt-8 pt-6 border-t border-emerald-700/50">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-2">
                  <Target className="w-4 h-4" />
                  <span>Tujuan Sekolah</span>
                </div>
                <div className="text-emerald-100 text-sm leading-relaxed whitespace-pre-line">
                  {profile.goals}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-6 rounded-3xl bg-white p-8 sm:p-10 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <Award className="w-10 h-10 text-emerald-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Misi Sekolah</h2>
              <div className="space-y-3 text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {profile?.mission ||
                  `1. Menyelenggarakan pembelajaran berkualitas dan inovatif berbasis teknologi.\n2. Menumbuhkan nilai-nilai ketakwaan, budi pekerti luhur, dan disiplin tinggi.\n3. Mewujudkan lingkungan sekolah yang bersih, hijau, sehat, dan nyaman (Green School Adiwiyata).\n4. Mengembangkan bakat, minat, dan potensi peserta didik melalui kegiatan akademik dan ekstrakurikuler.`}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sejarah Singkat */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 border border-slate-200/80 shadow-sm mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sejarah Singkat</h2>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
            {profile?.history ||
              'SMA Negeri 18 Bombana didirikan sebagai wujud komitmen pemerintah daerah dan masyarakat dalam memperluas akses pendidikan berkualitas di Kabupaten Bombana, Sulawesi Tenggara. Dengan mengusung konsep Green & Friendly School, sekolah ini berupaya memadukan keasrian alam lingkungan dengan kemajuan akademis, menciptakan iklim belajar yang ramah dan inspiratif bagi setiap generasi penerus bangsa.'}
          </p>
        </div>

        {/* 3. Fasilitas Sekolah */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Fasilitas Sekolah</h2>
            <p className="text-sm text-slate-600 mt-2">Sarana dan prasarana penunjang kenyamanan kegiatan belajar mengajar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:border-emerald-300 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">{f.name}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Ekstrakurikuler */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Ekstrakurikuler &amp; Minat Bakat</h2>
            <p className="text-sm text-slate-600 mt-2">Wadah pembinaan kepribadian, kepemimpinan, dan bakat siswa.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {extracurriculars.map((e, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:border-emerald-300 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700 font-bold mb-3">
                  <Trees className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">{e.name}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Informasi Kontak & Alamat */}
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2.5">
            <School className="w-6 h-6 text-emerald-400" />
            <span>Kontak &amp; Alamat Resmi</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase">Alamat</span>
                <span className="text-sm text-slate-200">{profile?.address || 'Poleang, Bombana, Sultra'}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase">Telepon</span>
                <span className="text-sm text-slate-200">{profile?.phone || '+62 821-xxxx-xxxx'}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase">Email</span>
                <span className="text-sm text-slate-200">{profile?.email || 'info@sman18bombana.sch.id'}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase">Website</span>
                <span className="text-sm text-slate-200">{profile?.website || 'https://sman18bombana.sch.id'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
