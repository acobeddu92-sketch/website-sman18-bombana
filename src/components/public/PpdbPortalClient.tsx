'use client';

import React, { useState } from 'react';
import {
  Link as LinkIcon,
  FileText,
  UploadCloud,
  Bell,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  ChevronDown,
  Printer,
  X,
  FileCheck,
  Eye,
  Trash2,
  Info,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

export interface PpdbClientSettings {
  registrationUrl: string;
  registrationStatus: 'open' | 'closed' | 'coming_soon';
  academicYear: string;
  startDate: string;
  endDate: string;
  announcementDate: string;
  reRegistrationDate: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  quotas?: {
    zonasi: number;
    afirmasi: number;
    prestasi: number;
    perpindahan: number;
  };
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  image?: string | null;
  category: string;
  published_at: string;
}

interface PpdbPortalClientProps {
  initialSettings: PpdbClientSettings;
  announcements: AnnouncementItem[];
  schoolProfile?: {
    school_name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logo?: string | null;
  } | null;
}

export default function PpdbPortalClient({
  initialSettings,
  announcements,
  schoolProfile,
}: PpdbPortalClientProps) {
  // Tab Aktif (5 Menu Utama)
  const [activeTab, setActiveTab] = useState<
    'link' | 'formulir' | 'berkas' | 'informasi' | 'bantuan'
  >('link');

  const settings = initialSettings;

  // --- STATE FORMULIR PENDAFTARAN ---
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nisn: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    alamat: '',
    rtRw: '',
    kelurahan: '',
    kecamatan: 'Poleang',
    kabupaten: 'Bombana',
    noWhatsapp: '',
    email: '',
    asalSekolah: '',
    tahunLulus: '2026',
    namaOrangTua: '',
    pekerjaanOrangTua: '',
    noHpOrangTua: '',
    jalurPendaftaran: 'Zonasi',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [applicantId, setApplicantId] = useState<string>(() => {
    // Generate nomor pendaftar unik sementara
    return `PPDB-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  });

  // --- STATE UPLOAD BERKAS ---
  interface UploadedDoc {
    id: string;
    category: string;
    categoryLabel: string;
    fileName: string;
    originalName: string;
    url: string;
    sizeBytes: number;
    uploadedAt: string;
  }

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // --- STATE FAQ ACCORDION ---
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Kategori Dokumen Persyaratan
  const documentCategories = [
    {
      id: 'kartu-keluarga',
      label: 'Kartu Keluarga (KK)',
      required: true,
      desc: 'Scan/Foto KK yang diterbitkan minimal 1 tahun sebelum pendaftaran',
    },
    {
      id: 'akta-kelahiran',
      label: 'Akta Kelahiran',
      required: true,
      desc: 'Scan/Foto Akta Kelahiran asli atau surat keterangan lahir resmi',
    },
    {
      id: 'ijazah-skl',
      label: 'Ijazah / Surat Keterangan Lulus (SKL)',
      required: true,
      desc: 'Scan SKL atau Ijazah SMP/MTs sederajat berlegalisir asli',
    },
    {
      id: 'pas-foto',
      label: 'Pas Foto Resmi (3x4)',
      required: true,
      desc: 'Foto terbaru berseragam sekolah dengan latar belakang merah/biru',
    },
    {
      id: 'dokumen-pendukung',
      label: 'Dokumen Pendukung Lainnya',
      required: false,
      desc: 'Kartu KIP/PKH (Afirmasi), Piagam Prestasi (Jalur Prestasi), atau SK Mutasi (Jalur Perpindahan)',
    },
  ];

  // Handler Submit Formulir (Validasi & Preview)
  const handleValidateForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.namaLengkap.trim()) errors.namaLengkap = 'Nama lengkap wajib diisi.';
    if (!formData.nisn.trim()) {
      errors.nisn = 'NISN wajib diisi.';
    } else if (!/^\d{10}$/.test(formData.nisn.trim())) {
      errors.nisn = 'NISN harus berjumlah 10 digit angka.';
    }
    if (!formData.nik.trim()) {
      errors.nik = 'NIK wajib diisi.';
    } else if (!/^\d{16}$/.test(formData.nik.trim())) {
      errors.nik = 'NIK harus berjumlah 16 digit angka.';
    }
    if (!formData.tempatLahir.trim()) errors.tempatLahir = 'Tempat lahir wajib diisi.';
    if (!formData.tanggalLahir) errors.tanggalLahir = 'Tanggal lahir wajib diisi.';
    if (!formData.alamat.trim()) errors.alamat = 'Alamat domisili wajib diisi.';
    if (!formData.noWhatsapp.trim()) {
      errors.noWhatsapp = 'Nomor WhatsApp wajib diisi.';
    } else if (formData.noWhatsapp.replace(/\D/g, '').length < 9) {
      errors.noWhatsapp = 'Nomor WhatsApp tidak valid (minimal 9 digit).';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email calon peserta didik wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Format alamat email tidak valid.';
    }
    if (!formData.asalSekolah.trim()) errors.asalSekolah = 'Asal sekolah SMP/MTs wajib diisi.';
    if (!formData.namaOrangTua.trim()) errors.namaOrangTua = 'Nama orang tua/wali wajib diisi.';
    if (!formData.pekerjaanOrangTua.trim()) errors.pekerjaanOrangTua = 'Pekerjaan orang tua wajib diisi.';
    if (!formData.noHpOrangTua.trim()) errors.noHpOrangTua = 'Nomor telepon/WA orang tua wajib diisi.';

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setShowPreviewModal(true);
    } else {
      // Scroll ke bagian atas form jika ada error
      const firstErrorField = Object.keys(errors)[0];
      const elem = document.getElementById(`field-${firstErrorField}`);
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handler Upload Dokumen
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    catId: string,
    catLabel: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategory(catId);
    setUploadError(null);
    setUploadSuccess(null);

    // Validasi Ukuran (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`Ukuran file ${file.name} melebihi batas 5 MB.`);
      setUploadingCategory(null);
      e.target.value = '';
      return;
    }

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('category', catId);
      form.append('applicantId', applicantId);

      const res = await fetch('/api/ppdb/upload', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Tambahkan ke daftar berkas terunggah
        const newDoc: UploadedDoc = {
          id: `${catId}-${Date.now()}`,
          category: catId,
          categoryLabel: catLabel,
          fileName: data.data.fileName,
          originalName: data.data.originalName,
          url: data.data.url,
          sizeBytes: data.data.sizeBytes,
          uploadedAt: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        // Ganti jika kategori sudah ada sebelumnya
        setUploadedDocs((prev) => [
          ...prev.filter((d) => d.category !== catId),
          newDoc,
        ]);

        setUploadSuccess(`Berkas ${catLabel} berhasil diunggah.`);
      } else {
        setUploadError(data.error || `Gagal mengunggah berkas ${catLabel}.`);
      }
    } catch {
      setUploadError('Terjadi gangguan jaringan saat mengunggah berkas.');
    } finally {
      setUploadingCategory(null);
      e.target.value = '';
    }
  };

  // Navigasi 5 Menu Utama
  const navTabs = [
    {
      id: 'link' as const,
      name: 'Link Pendaftaran',
      desc: 'Akses Portal & Formulir Online',
      icon: LinkIcon,
    },
    {
      id: 'formulir' as const,
      name: 'Formulir Pendaftaran',
      desc: 'Biodata Calon Siswa Baru',
      icon: FileText,
    },
    {
      id: 'berkas' as const,
      name: 'Upload Berkas',
      desc: 'Unggah KK, Akta, SKL & Foto',
      icon: UploadCloud,
    },
    {
      id: 'informasi' as const,
      name: 'Informasi & Pengumuman',
      desc: 'Jadwal, Syarat & Berita',
      icon: Bell,
    },
    {
      id: 'bantuan' as const,
      name: 'Bantuan & Kontak',
      desc: 'FAQ & Posko Panitia PPDB',
      icon: HelpCircle,
    },
  ];

  // Status Pendaftaran
  const isRegistrationActive =
    settings.registrationStatus === 'open' && Boolean(settings.registrationUrl?.trim());

  const cleanPhone = (settings.contactPhone || schoolProfile?.phone || '+62 821-9988-7766')
    .replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Halo Panitia PPDB SMAN 18 Bombana, saya ingin menanyakan informasi seputar pendaftaran siswa baru.'
  )}`;

  return (
    <div className="py-8 sm:py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HERO SECTION / HEADER PPDB */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-10 md:p-12 shadow-xl shadow-emerald-900/10 mb-8 sm:mb-10">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Portal Resmi PPDB {settings.academicYear || '2026/2027'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Penerimaan Peserta Didik Baru
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 mt-3 sm:mt-4 leading-relaxed font-normal">
              Selamat datang di portal informasi dan pendaftaran calon peserta didik baru SMA Negeri 18 Bombana.
              Wujudkan masa depan berkarakter, cerdas, dan berwawasan lingkungan bersama kami.
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mt-6 pt-6 border-t border-white/15 text-xs sm:text-sm font-medium">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-900/50 backdrop-blur-sm border border-emerald-500/30">
                <Calendar className="w-4 h-4 text-emerald-300" />
                <span>Periode: {settings.startDate} s/d {settings.endDate}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-900/50 backdrop-blur-sm border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Bebas Biaya Pendaftaran (Gratis)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-900/50 backdrop-blur-sm border border-emerald-500/30">
                <GraduationCap className="w-4 h-4 text-emerald-300" />
                <span>4 Jalur Seleksi</span>
              </span>
            </div>
          </div>

          {/* Elemen Dekoratif Hijau Friendly */}
          <div className="absolute right-0 -bottom-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* 5 MENU NAVIGASI PPDB (RESPONSIF DESKTOP & SMARTPHONE) */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-start p-3.5 sm:p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold leading-tight block">
                    {tab.name}
                  </span>
                  <span
                    className={`text-[11px] mt-1 line-clamp-1 ${
                      isActive ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {tab.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. MENU: LINK PENDAFTARAN */}
        {/* ========================================================================= */}
        {activeTab === 'link' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 mb-4">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Area Tautan Pendaftaran Online</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Pendaftaran Calon Peserta Didik Baru
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                  Calon siswa dapat melakukan pendaftaran melalui tautan resmi yang telah disediakan oleh panitia PPDB SMA Negeri 18 Bombana.
                </p>

                {/* Status Box & Registration Action */}
                <div className="mt-8 p-6 sm:p-8 rounded-2xl border bg-slate-50/80 border-slate-200">
                  {isRegistrationActive ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>Link Pendaftaran Online Sedang Aktif & Terbuka</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Klik tombol di bawah ini untuk menuju ke formulir pendaftaran resmi eksternal yang dikelola panitia:
                      </p>
                      <div className="pt-2">
                        <a
                          href={settings.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
                        >
                          <span>DAFTAR ONLINE SEKARANG</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* Sesuai instruksi user: Tampilkan status "Link pendaftaran belum tersedia" jika data belum ada */
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-800 text-sm sm:text-base font-bold">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>Link pendaftaran belum tersedia</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Tautan pendaftaran online resmi sedang dalam tahap persiapan oleh Administrator dan Panitia PPDB SMA Negeri 18 Bombana.
                        Tautan pendaftaran akan diaktifkan sesuai jadwal pembukaan resmi.
                      </p>
                      <div className="p-4 rounded-xl bg-white border border-amber-200/80 text-xs text-slate-600 space-y-1.5">
                        <p className="font-semibold text-slate-800">
                          📌 Yang dapat Anda lakukan saat ini:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                          <li>Mempersiapkan dokumen persyaratan (Kartu Keluarga, Akta Kelahiran, SKL).</li>
                          <li>Mencoba mengisi pratinjau data pada menu <strong>Formulir Pendaftaran</strong>.</li>
                          <li>Mengunggah dokumen persyaratan awal pada menu <strong>Upload Berkas</strong>.</li>
                          <li>Menghubungi panitia melalui menu <strong>Bantuan</strong> jika memerlukan konsultasi.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alternatif Cepat Navigasi Tab Internal */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">Pilihan Menu Alternatif:</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('formulir')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Buka Formulir Pendaftaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('berkas')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Dokumen Persyaratan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MENU: FORMULIR PENDAFTARAN */}
        {/* ========================================================================= */}
        {activeTab === 'formulir' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Informasi Struktur Formulir */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Struktur Formulir Pendaftaran Calon Siswa Baru</span>
                <span className="text-emerald-800/90 text-xs block mt-0.5">
                  Isi formulir berikut dengan data yang valid dan sesuai dengan dokumen resmi (Kartu Keluarga & Akta Kelahiran).
                  Struktur ini disiapkan untuk validasi data pendaftar sebelum registrasi final.
                </span>
              </div>
            </div>

            <form
              onSubmit={handleValidateForm}
              className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-8"
            >
              {/* Bagian 1: Identitas Calon Siswa */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Data Identitas Calon Siswa
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  <div className="sm:col-span-2 lg:col-span-3" id="field-namaLengkap">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Calon Siswa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap sesuai ijazah/akta..."
                      value={formData.namaLengkap}
                      onChange={(e) =>
                        setFormData({ ...formData, namaLengkap: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.namaLengkap
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.namaLengkap && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.namaLengkap}</p>
                    )}
                  </div>

                  <div id="field-nisn">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NISN (Nomor Induk Siswa Nasional) *
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      placeholder="10 digit angka"
                      value={formData.nisn}
                      onChange={(e) =>
                        setFormData({ ...formData, nisn: e.target.value.replace(/\D/g, '') })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.nisn
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.nisn && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.nisn}</p>
                    )}
                  </div>

                  <div id="field-nik">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIK (Nomor Induk Kependudukan) *
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      required
                      placeholder="16 digit sesuai Kartu Keluarga"
                      value={formData.nik}
                      onChange={(e) =>
                        setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.nik
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.nik && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.nik}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jenis Kelamin *
                    </label>
                    <select
                      value={formData.jenisKelamin}
                      onChange={(e) =>
                        setFormData({ ...formData, jenisKelamin: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div id="field-tempatLahir">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tempat Lahir *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bombana / Poleang"
                      value={formData.tempatLahir}
                      onChange={(e) =>
                        setFormData({ ...formData, tempatLahir: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.tempatLahir
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.tempatLahir && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.tempatLahir}</p>
                    )}
                  </div>

                  <div id="field-tanggalLahir">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Lahir *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalLahir}
                      onChange={(e) =>
                        setFormData({ ...formData, tanggalLahir: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.tanggalLahir
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.tanggalLahir && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.tanggalLahir}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Agama *
                    </label>
                    <select
                      value={formData.agama}
                      onChange={(e) =>
                        setFormData({ ...formData, agama: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen Protestan">Kristen Protestan</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Khonghucu">Khonghucu</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Alamat & Kontak */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Alamat Domisili & Kontak
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  <div className="sm:col-span-2 lg:col-span-3" id="field-alamat">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Lengkap Domisili (Sesuai KK) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Jalan, Dusun, RT/RW, Desa..."
                      value={formData.alamat}
                      onChange={(e) =>
                        setFormData({ ...formData, alamat: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.alamat
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.alamat && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.alamat}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kecamatan *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.kecamatan}
                      onChange={(e) =>
                        setFormData({ ...formData, kecamatan: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div id="field-noWhatsapp">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor WhatsApp Calon Siswa / Wali *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 082199887766"
                      value={formData.noWhatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, noWhatsapp: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.noWhatsapp
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.noWhatsapp && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.noWhatsapp}</p>
                    )}
                  </div>

                  <div id="field-email">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Email Calon Siswa *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contoh@gmail.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.email
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bagian 3: Riwayat Sekolah & Pilihan Jalur */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Asal Sekolah & Jalur Pendaftaran
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  <div className="sm:col-span-2" id="field-asalSekolah">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Asal Sekolah (SMP / MTs) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SMP Negeri 1 Poleang"
                      value={formData.asalSekolah}
                      onChange={(e) =>
                        setFormData({ ...formData, asalSekolah: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.asalSekolah
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.asalSekolah && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.asalSekolah}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tahun Kelulusan *
                    </label>
                    <select
                      value={formData.tahunLulus}
                      onChange={(e) =>
                        setFormData({ ...formData, tahunLulus: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilihan Jalur Pendaftaran PPDB *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        { id: 'Zonasi', label: 'Zonasi (50%)', desc: 'Jarak domisili terdekat' },
                        { id: 'Prestasi', label: 'Prestasi (30%)', desc: 'Nilai rapor & lomba' },
                        { id: 'Afirmasi', label: 'Afirmasi (15%)', desc: 'Keluarga pra-sejahtera (KIP)' },
                        { id: 'Perpindahan', label: 'Perpindahan (5%)', desc: 'Tugas orang tua/wali' },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            formData.jalurPendaftaran === item.id
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="jalurPendaftaran"
                              value={item.id}
                              checked={formData.jalurPendaftaran === item.id}
                              onChange={() =>
                                setFormData({ ...formData, jalurPendaftaran: item.id })
                              }
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold">{item.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1 ml-5">
                            {item.desc}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian 4: Data Orang Tua / Wali */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    4
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Data Orang Tua / Wali
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  <div id="field-namaOrangTua">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Orang Tua / Wali *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Ayah / Ibu / Wali"
                      value={formData.namaOrangTua}
                      onChange={(e) =>
                        setFormData({ ...formData, namaOrangTua: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.namaOrangTua
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.namaOrangTua && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.namaOrangTua}</p>
                    )}
                  </div>

                  <div id="field-pekerjaanOrangTua">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pekerjaan Orang Tua / Wali *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Petani / PNS / Wiraswasta..."
                      value={formData.pekerjaanOrangTua}
                      onChange={(e) =>
                        setFormData({ ...formData, pekerjaanOrangTua: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.pekerjaanOrangTua
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.pekerjaanOrangTua && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.pekerjaanOrangTua}</p>
                    )}
                  </div>

                  <div id="field-noHpOrangTua">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Telepon / WhatsApp Orang Tua *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="08xxxxxxxxxx"
                      value={formData.noHpOrangTua}
                      onChange={(e) =>
                        setFormData({ ...formData, noHpOrangTua: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        formErrors.noHpOrangTua
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.noHpOrangTua && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.noHpOrangTua}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Data formulir tersimpan secara privat di sesi pendaftaran Anda.</span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="reset"
                    onClick={() => {
                      setFormData({
                        namaLengkap: '',
                        nisn: '',
                        nik: '',
                        tempatLahir: '',
                        tanggalLahir: '',
                        jenisKelamin: 'Laki-laki',
                        agama: 'Islam',
                        alamat: '',
                        rtRw: '',
                        kelurahan: '',
                        kecamatan: 'Poleang',
                        kabupaten: 'Bombana',
                        noWhatsapp: '',
                        email: '',
                        asalSekolah: '',
                        tahunLulus: '2026',
                        namaOrangTua: '',
                        pekerjaanOrangTua: '',
                        noHpOrangTua: '',
                        jalurPendaftaran: 'Zonasi',
                      });
                      setFormErrors({});
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Reset Formulir
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Pratinjau Data Formulir</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* MODAL PRATINJAU FORMULIR PENDAFTARAN */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Pratinjau Lembar Formulir Pendaftaran
                    </h3>
                    <p className="text-xs text-slate-400">
                      ID Registrasi Sementara: <span className="font-mono font-bold text-emerald-700">{applicantId}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lembar Ringkasan Identitas Calon Siswa */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-y-2.5 border-b border-slate-200/70 pb-3">
                  <span className="text-slate-500">Nama Lengkap:</span>
                  <span className="font-bold text-slate-900">{formData.namaLengkap}</span>

                  <span className="text-slate-500">NISN:</span>
                  <span className="font-mono font-bold text-slate-800">{formData.nisn}</span>

                  <span className="text-slate-500">NIK:</span>
                  <span className="font-mono font-bold text-slate-800">{formData.nik}</span>

                  <span className="text-slate-500">Tempat, Tgl Lahir:</span>
                  <span className="font-medium text-slate-800">
                    {formData.tempatLahir}, {formData.tanggalLahir}
                  </span>

                  <span className="text-slate-500">Jenis Kelamin:</span>
                  <span className="font-medium text-slate-800">{formData.jenisKelamin}</span>

                  <span className="text-slate-500">Agama:</span>
                  <span className="font-medium text-slate-800">{formData.agama}</span>
                </div>

                <div className="grid grid-cols-2 gap-y-2.5 border-b border-slate-200/70 pb-3">
                  <span className="text-slate-500">Alamat Domisili:</span>
                  <span className="font-medium text-slate-800">{formData.alamat}, {formData.kecamatan}, {formData.kabupaten}</span>

                  <span className="text-slate-500">Nomor WhatsApp:</span>
                  <span className="font-bold text-emerald-700">{formData.noWhatsapp}</span>

                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-800">{formData.email}</span>
                </div>

                <div className="grid grid-cols-2 gap-y-2.5">
                  <span className="text-slate-500">Asal Sekolah:</span>
                  <span className="font-bold text-slate-900">{formData.asalSekolah} ({formData.tahunLulus})</span>

                  <span className="text-slate-500">Jalur Pilihan:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block w-fit">
                    Jalur {formData.jalurPendaftaran}
                  </span>

                  <span className="text-slate-500">Orang Tua / Wali:</span>
                  <span className="font-medium text-slate-800">
                    {formData.namaOrangTua} ({formData.pekerjaanOrangTua})
                  </span>

                  <span className="text-slate-500">No. Kontak Ortu:</span>
                  <span className="font-medium text-slate-800">{formData.noHpOrangTua}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Struktur data formulir Anda telah divalidasi. Lanjutkan dengan mengunggah berkas persyaratan
                  pada menu <strong>Upload Berkas</strong> untuk melengkapi verifikasi administratif.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Pratinjau</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setActiveTab('berkas');
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                >
                  Lanjut Upload Berkas &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MENU: UPLOAD BERKAS (VERCEL BLOB TERISOLASI) */}
        {/* ========================================================================= */}
        {activeTab === 'berkas' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Informasi Penyimpanan Terisolasi */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm flex items-start gap-3 shadow-md">
              <UploadCloud className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 block">
                  Unggah Dokumen Persyaratan Calon Peserta Didik
                </span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Berkas disimpan secara aman pada <strong>Vercel Blob Storage</strong> di direktori khusus{' '}
                  <code className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-[11px]">
                    ppdb/{applicantId}/...
                  </code>{' '}
                  terpisah dari galeri sekolah. Format yang didukung: <strong>PDF, JPG, PNG, WEBP</strong> (Maksimal 5 MB per berkas).
                </p>
              </div>
            </div>

            {/* Notifikasi Status Upload */}
            {uploadSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}
            {uploadError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Grid Kartu Dokumen Persyaratan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {documentCategories.map((doc) => {
                const isUploaded = uploadedDocs.some((d) => d.category === doc.id);
                const currentDoc = uploadedDocs.find((d) => d.category === doc.id);
                const isUploading = uploadingCategory === doc.id;

                return (
                  <div
                    key={doc.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 bg-white ${
                      isUploaded
                        ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            {doc.label}
                          </h4>
                          {doc.required ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                              Wajib
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              Opsional
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{doc.desc}</p>
                      </div>

                      {isUploaded && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Area Upload Box */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      {isUploaded && currentDoc ? (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-emerald-200">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {currentDoc.originalName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {(currentDoc.sizeBytes / 1024).toFixed(1)} KB • Diunggah {currentDoc.uploadedAt}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={currentDoc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Lihat Berkas"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <label className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" title="Ganti Berkas">
                              <UploadCloud className="w-4 h-4" />
                              <input
                                type="file"
                                accept=".pdf,image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={isUploading}
                                onChange={(e) => handleFileUpload(e, doc.id, doc.label)}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                            isUploading
                              ? 'border-emerald-400 bg-emerald-50/50 cursor-wait'
                              : 'border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20'
                          }`}
                        >
                          <UploadCloud
                            className={`w-6 h-6 mb-1.5 ${
                              isUploading ? 'text-emerald-600 animate-bounce' : 'text-slate-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-700">
                            {isUploading ? 'Sedang mengunggah...' : 'Pilih Berkas untuk Diunggah'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            PDF, JPG, PNG, WEBP hingga 5 MB
                          </span>
                          <input
                            type="file"
                            accept=".pdf,image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => handleFileUpload(e, doc.id, doc.label)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Kelengkapan Berkas */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Status Kelengkapan Dokumen:
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {uploadedDocs.length} dari {documentCategories.length} kategori berkas telah terunggah.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('informasi')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  Lihat Jadwal & Pengumuman &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. MENU: INFORMASI / PENGUMUMAN */}
        {/* ========================================================================= */}
        {activeTab === 'informasi' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Informasi */}
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Pusat Informasi PPDB
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Jadwal, Persyaratan & Pengumuman
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
                Simak agenda lengkap pelaksanaan dan pengumuman resmi penerimaan siswa baru.
              </p>
            </div>

            {/* A. JADWAL PELAKSANAAN PPDB */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Jadwal Resmi Pelaksanaan PPDB {settings.academicYear || '2026/2027'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: '1',
                    title: 'Sosialisasi & Publikasi',
                    date: '01 Mei - 14 Juni 2026',
                    desc: 'Penyebarluasan informasi jalur & persyaratan ke SMP/MTs mitra.',
                    active: false,
                  },
                  {
                    step: '2',
                    title: 'Pendaftaran & Unggah Berkas',
                    date: `${settings.startDate || '15 Juni'} s/d ${settings.endDate || '10 Juli 2026'}`,
                    desc: 'Pengisian formulir daring/luring dan pengunggahan berkas persyaratan.',
                    active: true,
                  },
                  {
                    step: '3',
                    title: 'Pengumuman Hasil Seleksi',
                    date: `${settings.announcementDate || '15 Juli 2026'}`,
                    desc: 'Penetapan calon siswa yang dinyatakan lolos verifikasi.',
                    active: false,
                  },
                  {
                    step: '4',
                    title: 'Pendaftaran Ulang',
                    date: `${settings.reRegistrationDate || '16 - 20 Juli 2026'}`,
                    desc: 'Verifikasi berkas fisik dan pengarahan Masa Pengenalan Lingkungan Sekolah (MPLS).',
                    active: false,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`p-5 rounded-2xl border transition-all ${
                      item.active
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                        : 'border-slate-200/80 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        {item.step}
                      </span>
                      {item.active && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          Tahap Berjalan
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mt-2">{item.title}</h4>
                    <span className="text-xs font-semibold text-emerald-700 block mt-1">
                      {item.date}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* B. PERSYARATAN & JALUR PENDAFTARAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Persyaratan Umum */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Persyaratan Umum</h3>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Telah lulus SMP / MTs atau bentuk lain yang sederajat.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Berusia paling tinggi 21 (dua puluh satu) tahun pada tanggal 1 Juli tahun berjalan.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Memiliki Kartu Keluarga (KK) yang diterbitkan paling singkat 1 tahun sebelum tanggal pendaftaran.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Memiliki Akta Kelahiran resmi dari Dinas Kependudukan dan Catatan Sipil.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Surat Keterangan Lulus (SKL) asli atau fotokopi berlegalisir kepala sekolah asal.</span>
                  </li>
                </ul>
              </div>

              {/* Persyaratan Khusus 4 Jalur */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Kuota & Jalur Seleksi</h3>
                </div>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">1. Jalur Zonasi (50%)</span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Domisili
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Diperuntukkan bagi calon siswa berdomisili di dalam wilayah zonasi terdekat dengan SMA Negeri 18 Bombana.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">2. Jalur Prestasi (30%)</span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Rapor & Piagam
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Berdasarkan akumulasi nilai rapor semester 1-5 atau piagam kejuaraan akademik / non-akademik minimal tingkat kabupaten.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">3. Jalur Afirmasi (15%)</span>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        KIP / PKH
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Bagi keluarga ekonomi kurang mampu yang dibuktikan dengan keikutsertaan program penanganan keluarga tidak mampu (KIP, PKH).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">4. Jalur Perpindahan Tugas (5%)</span>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        Mutasi Kerja
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Bagi calon siswa yang berpindah domisili mengikuti penugasan resmi orang tua/wali dari instansi terkait.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* C. PENGUMUMAN RESMI PPDB DARI DATABASE */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Pengumuman & Berita Terkini PPDB
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Terintegrasi Database Resmi</span>
              </div>

              {announcements.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">Belum ada surat edaran atau pengumuman khusus PPDB yang diterbitkan.</p>
                  <p className="text-slate-400 mt-0.5 text-xs">
                    Pengumuman resmi kelulusan dan seleksi akan diterbitkan oleh Administrator pada bagian ini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {announcements.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                          PPDB
                        </span>
                        <span>•</span>
                        <span>{new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. MENU: BANTUAN & FAQ */}
        {/* ========================================================================= */}
        {activeTab === 'bantuan' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Bantuan */}
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Pusat Bantuan & Layanan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Tanya Jawab & Kontak Panitia PPDB
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
                Temukan jawaban cepat atau hubungi langsung panitia untuk konsultasi pendaftaran.
              </p>
            </div>

            {/* Kontak Panitia Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* WhatsApp Hotline */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <Phone className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Hotline WhatsApp Panitia</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Layanan pesan cepat untuk kendala pendaftaran dan verifikasi berkas.
                  </p>
                  <p className="text-sm font-extrabold text-emerald-700 mt-2 font-mono">
                    {settings.contactPhone || schoolProfile?.phone || '+62 821-9988-7766'}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <span>Hubungi via WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Email Panitia */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Email Resmi PPDB</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Pengiriman pengaduan resmi dan berkas perbaikan dokumen.
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-2 truncate">
                    {settings.contactEmail || schoolProfile?.email || 'ppdb@sman18bombana.sch.id'}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <a
                    href={`mailto:${settings.contactEmail || 'ppdb@sman18bombana.sch.id'}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                  >
                    <span>Kirim Email</span>
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Posko Langsung / Alamat */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Sekretariat Posko PPDB</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Gedung Utama SMA Negeri 18 Bombana.
                  </p>
                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                    {schoolProfile?.address || 'Jl. Pendidikan No. 18, Kecamatan Poleang, Kabupaten Bombana, Sulawesi Tenggara 93772'}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                    Senin - Sabtu (08.00 - 14.00 WITA)
                  </span>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <a
                    href="https://maps.google.com/?q=SMA+Negeri+18+Bombana"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                  >
                    <span>Petunjuk Arah Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Pertanyaan Sering Diajukan (FAQ)
                </h3>
              </div>

              {[
                {
                  q: 'Apakah pendaftaran PPDB di SMA Negeri 18 Bombana dipungut biaya?',
                  a: 'Sama sekali tidak dipungut biaya (100% Gratis). Seluruh rangkaian pelaksanaan PPDB mulai dari pendaftaran, verifikasi dokumen, hingga pendaftaran ulang dibiayai penuh oleh pemerintah.',
                },
                {
                  q: 'Bagaimana jika ijazah asli SMP/MTs belum diterbitkan saat mendaftar?',
                  a: 'Calon peserta didik dapat menggunakan Surat Keterangan Lulus (SKL) resmi yang mencantumkan nilai dan ditandatangani serta distempel basah oleh kepala sekolah asal.',
                },
                {
                  q: 'Apakah bisa mendaftar lebih dari satu jalur seleksi?',
                  a: 'Calon peserta didik hanya dapat memilih 1 (satu) jalur pendaftaran dalam satu tahap seleksi. Namun apabila tidak lolos pada jalur prestasi atau perpindahan, pendaftar dapat mendaftar kembali melalui jalur zonasi selama periode pendaftaran masih dibuka.',
                },
                {
                  q: 'Berapa jarak maksimal untuk jalur zonasi?',
                  a: 'Jalur zonasi memprioritaskan calon peserta didik yang bertempat tinggal paling dekat dengan sekolah berdasarkan alamat pada Kartu Keluarga resmi.',
                },
                {
                  q: 'Apa yang harus dilakukan jika nomor NISN tidak sesuai atau tidak valid?',
                  a: 'Silakan lakukan konfirmasi ke pihak operator SMP/MTs asal untuk memeriksa status keaktifan NISN pada portal Verval PD Kemendikbudristek.',
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/70 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="flex items-center justify-between w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        openFaqIndex === idx ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>

                  {openFaqIndex === idx && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
