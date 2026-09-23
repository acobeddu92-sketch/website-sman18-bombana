'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  Save,
  UserCheck,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

export default function PengaturanBerandaPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'kepsek' | 'background'>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Hero fields
  const [schoolName, setSchoolName] = useState('');
  const [tagline, setTagline] = useState('');

  // 2. Kepala Sekolah fields
  const [principalName, setPrincipalName] = useState('');
  const [principalPosition, setPrincipalPosition] = useState('');
  const [principalPhoto, setPrincipalPhoto] = useState('');
  const [principalMessage, setPrincipalMessage] = useState('');

  // 3. Background Home fields
  const [bgImage, setBgImage] = useState('');
  const [bgActive, setBgActive] = useState(true);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState('');
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/beranda');
      const data = await res.json();
      if (res.ok) {
        if (data.school) {
          setSchoolName(data.school.school_name || '');
          setTagline(data.school.tagline || '');
        }
        if (data.principal || data.activePrincipal) {
          setPrincipalName(data.activePrincipal?.name || 'Belum ditetapkan');
          setPrincipalPosition(data.principal?.position || 'Kepala SMA Negeri 18 Bombana');
          setPrincipalPhoto(data.activePrincipal?.photo || data.principal?.photo || '/images/kepala-sekolah.jpg');
          setPrincipalMessage(data.principal?.message || '');
        }
        if (data.background) {
          setBgImage(data.background.image || '');
          setBgActive(data.background.is_active);
        }
      } else {
        setErrorMsg(data.error || 'Gagal mengambil data beranda.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER BACKGROUND HOME ---
  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran background maksimal 5 MB.');
      return;
    }

    setBgFile(file);
    setBgPreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleSaveBackground = async () => {
    if (!bgFile && !bgImage) {
      setErrorMsg('Silakan pilih file background terlebih dahulu.');
      return;
    }

    setUploadingBg(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let finalImageUrl = bgImage;

      // Jika ada file baru yang dipilih, upload dulu
      if (bgFile) {
        const formData = new FormData();
        formData.append('file', bgFile);
        formData.append('folder', 'background');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          setErrorMsg(uploadData.error || 'Gagal mengunggah file background.');
          setUploadingBg(false);
          return;
        }
        finalImageUrl = uploadData.url;
      }

      const res = await fetch('/api/admin/beranda/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: finalImageUrl,
          is_active: true,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setBgImage(finalImageUrl);
        setBgActive(true);
        setBgFile(null);
        setBgPreview('');
        setSuccessMsg('Background Home berhasil diperbarui dan diaktifkan.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan background.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleToggleBgStatus = async () => {
    try {
      const res = await fetch('/api/admin/beranda/background', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !bgActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setBgActive(!bgActive);
        setSuccessMsg(data.message || 'Status background diubah.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setErrorMsg('Gagal mengubah status background.');
    }
  };

  const handleDeleteBackground = async () => {
    if (!confirm('Hapus background Home saat ini?')) return;
    try {
      const res = await fetch('/api/admin/beranda/background', { method: 'DELETE' });
      if (res.ok) {
        setBgImage('');
        setBgPreview('');
        setBgFile(null);
        setSuccessMsg('Background Home berhasil dihapus.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setErrorMsg('Gagal menghapus background.');
    }
  };

  // --- HANDLER SIMPAN HERO & KEPALA SEKOLAH (CMS SAJA) ---
  const handleSaveHeroAndKepsek = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/beranda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name: schoolName,
          tagline,
          principal_position: principalPosition,
          principal_message: principalMessage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Pengaturan Beranda & Sambutan Kepala Sekolah berhasil disimpan!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan perubahan.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Home className="w-7 h-7 text-emerald-600" />
            <span>Pengaturan Beranda</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola hero identitas, profil dan foto Kepala Sekolah, serta foto background Home.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors shrink-0"
        >
          <span>Lihat Halaman Home</span>
          <Globe className="w-4 h-4 text-emerald-600" />
        </a>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Submenu Tab Beranda */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'hero'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hero &amp; Identitas Sekolah
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kepsek')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'kepsek'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sambutan &amp; Info Kepala Sekolah
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('background')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'background'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Foto Background Home
        </button>
      </div>

      {/* TAB 1: HERO & IDENTITAS */}
      {activeTab === 'hero' && (
        <form onSubmit={handleSaveHeroAndKepsek} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Identitas Hero Banner</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Sekolah (Judul Utama)
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tagline Singkat Sekolah
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Hero'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SAMBUTAN & INFORMASI PUBLIK KEPALA SEKOLAH (CMS) */}
      {activeTab === 'kepsek' && (
        <form onSubmit={handleSaveHeroAndKepsek} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Sambutan &amp; Informasi Publik Kepala Sekolah</span>
          </h2>

          {/* Section Foto Personal Kepsek (Read-Only Preview dari Akun Kepala Sekolah) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                Foto Personal Kepala Sekolah
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Sumber: Akun Kepala Sekolah (Read-Only)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Box Preview */}
              <div className="w-28 h-28 rounded-2xl bg-white border-2 border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                <SafeImage
                  src={principalPhoto}
                  alt={principalName}
                  className="w-full h-full object-cover object-top"
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-800 text-white p-2">
                      <UserCheck className="w-10 h-10 text-emerald-200 mb-1" />
                      <span className="text-[9px] font-medium text-emerald-100">Foto Kepsek</span>
                    </div>
                  }
                />
              </div>

              {/* Deskripsi Aturan SOT Foto */}
              <div className="space-y-1.5 flex-1 text-center sm:text-left">
                <p className="text-xs font-bold text-slate-800">
                  {principalName}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Foto personal Kepala Sekolah dikelola secara mandiri oleh Kepala Sekolah aktif melalui menu <strong>Profil Saya</strong> (<code className="text-xs bg-slate-200/70 px-1 py-0.5 rounded text-emerald-800">/dashboard/profile</code>).
                </p>
                <p className="text-[11px] text-slate-400">
                  Admin Beranda bertugas mengelola Pesan Sambutan dan Jabatan Resmi untuk kebutuhan konten beranda sekolah (CMS publik).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Lengkap &amp; Gelar
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Sumber: User (Read-Only)
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={principalName}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-sm font-medium cursor-not-allowed focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Nama disinkronkan otomatis dari User aktif role Kepala Sekolah. Kelola di <strong>Admin &gt; Manajemen Pengguna</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jabatan Resmi
              </label>
              <input
                type="text"
                required
                value={principalPosition}
                onChange={(e) => setPrincipalPosition(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pesan Sambutan Kepala Sekolah
            </label>
            <textarea
              rows={4}
              required
              value={principalMessage}
              onChange={(e) => setPrincipalMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Gunakan pesan ringkas dan inspiratif (2-4 kalimat) agar pas dengan tata letak satu layar Home.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Sambutan & Info'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: FOTO BACKGROUND HOME */}
      {activeTab === 'background' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <span>Pengaturan Foto Background Home</span>
            </h2>
            {bgImage && (
              <button
                type="button"
                onClick={handleToggleBgStatus}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  bgActive
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {bgActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{bgActive ? 'Background Aktif' : 'Background Nonaktif'}</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Upload foto lanskap gedung sekolah atau suasana asri SMAN 18 Bombana untuk dijadikan latar belakang halaman Home. Sistem akan otomatis menerapkan <strong>soft dark/green gradient overlay</strong> agar teks dan kartu Home tetap terbaca jelas serta ramah mata.
            </p>

            {/* Area Preview Background */}
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm flex items-center justify-center">
              {bgPreview || bgImage ? (
                <>
                  <img
                    src={bgPreview || bgImage}
                    alt="Preview Background Home"
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Visual Overlay Simulation */}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-emerald-950/65 to-slate-950/80 flex flex-col items-center justify-center text-white p-6 text-center pointer-events-none">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs mb-2">
                      Simulasi Tampilan di Halaman Home
                    </span>
                    <h3 className="text-xl font-bold">SMA NEGERI 18 BOMBANA</h3>
                    <p className="text-xs text-emerald-200 mt-1 max-w-md">
                      Teks dan komponen tetap terbaca tajam dengan gradient overlay pelindung.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <ImageIcon className="w-12 h-12 mb-2 text-slate-600" />
                  <span className="text-sm font-bold text-slate-300">Belum Ada Background Khusus</span>
                  <span className="text-xs text-slate-500 mt-1">
                    Home saat ini menggunakan warna tema default Green &amp; Friendly.
                  </span>
                </div>
              )}
            </div>

            {/* Tombol Aksi Upload */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors shadow-md shadow-emerald-700/20 active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>{bgImage ? 'Ganti Foto Background' : 'Upload Foto Background'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleBgFileChange}
                  />
                </label>

                {bgFile && (
                  <button
                    type="button"
                    onClick={handleSaveBackground}
                    disabled={uploadingBg}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs sm:text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{uploadingBg ? 'Menyimpan...' : 'Simpan Background Baru'}</span>
                  </button>
                )}

                {bgFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setBgFile(null);
                      setBgPreview('');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                  >
                    Batal
                  </button>
                )}
              </div>

              {bgImage && (
                <button
                  type="button"
                  onClick={handleDeleteBackground}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Background</span>
                </button>
              )}
            </div>

            {bgFile && (
              <p className="text-xs text-emerald-700 font-medium">
                File terpilih: {bgFile.name} (klik &ldquo;Simpan Background Baru&rdquo; untuk menerapkan ke website).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
