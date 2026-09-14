'use client';

import React, { useState, useEffect } from 'react';
import {
  School,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Compass,
  Target,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

export default function AdminProfilPage() {
  const [activeTab, setActiveTab] = useState<'identitas' | 'visi-misi' | 'fasilitas'>('identitas');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Identitas & Kontak
  const [schoolName, setSchoolName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logo, setLogo] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Upload logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Sejarah & Visi Misi
  const [history, setHistory] = useState('');
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [goals, setGoals] = useState('');

  // Fasilitas & Ekstrakurikuler
  const [facilities, setFacilities] = useState<{ name: string; desc: string }[]>([]);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [newFacilityDesc, setNewFacilityDesc] = useState('');

  const [extracurriculars, setExtracurriculars] = useState<{ name: string; desc: string }[]>([]);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraDesc, setNewExtraDesc] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/profil');
      const data = await res.json();
      if (res.ok && data.profile) {
        const p = data.profile;
        setSchoolName(p.school_name || '');
        setTagline(p.tagline || '');
        setLogo(p.logo || '/images/logo.svg');
        setAddress(p.address || '');
        setPhone(p.phone || '');
        setEmail(p.email || '');
        setWebsite(p.website || '');
        setHistory(p.history || '');
        setVision(p.vision || '');
        setMission(p.mission || '');
        setGoals(p.goals || '');

        try {
          setFacilities(p.facilities ? JSON.parse(p.facilities) : []);
        } catch {
          setFacilities([]);
        }

        try {
          setExtracurriculars(p.extracurriculars ? JSON.parse(p.extracurriculars) : []);
        } catch {
          setExtracurriculars([]);
        }
      }
    } catch {
      setErrorMsg('Gagal memuat profil sekolah.');
    } finally {
      setLoading(false);
    }
  };

  // Handler memilih file logo
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran file logo maksimal 2 MB.');
      return;
    }

    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setErrorMsg('');
  };

  // Upload logo ke server
  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('folder', 'logo');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        setLogo(data.url);
        setLogoFile(null);
        setLogoPreview('');
        setSuccessMsg('Logo sekolah berhasil diunggah. Silakan klik Simpan Perubahan.');
      } else {
        setErrorMsg(data.error || 'Gagal mengunggah logo.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server saat upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddFacility = () => {
    if (!newFacilityName.trim()) return;
    setFacilities([...facilities, { name: newFacilityName.trim(), desc: newFacilityDesc.trim() }]);
    setNewFacilityName('');
    setNewFacilityDesc('');
  };

  const handleRemoveFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  const handleAddExtra = () => {
    if (!newExtraName.trim()) return;
    setExtracurriculars([...extracurriculars, { name: newExtraName.trim(), desc: newExtraDesc.trim() }]);
    setNewExtraName('');
    setNewExtraDesc('');
  };

  const handleRemoveExtra = (index: number) => {
    setExtracurriculars(extracurriculars.filter((_, i) => i !== index));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Jika masih ada file logo yang belum di-upload, upload dulu
      let finalLogo = logo;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('folder', 'logo');
        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          finalLogo = uploadData.url;
          setLogo(uploadData.url);
          setLogoFile(null);
          setLogoPreview('');
        }
      }

      const res = await fetch('/api/admin/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name: schoolName,
          tagline,
          logo: finalLogo,
          address,
          phone,
          email,
          website,
          history,
          vision,
          mission,
          goals,
          facilities,
          extracurriculars,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Profil sekolah berhasil disimpan dan diperbarui!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan profil sekolah.');
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
            <School className="w-7 h-7 text-emerald-600" />
            <span>Pengelolaan Profil Sekolah</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola identitas resmi, logo, sejarah, visi misi, fasilitas, dan ekstrakurikuler SMAN 18 Bombana.
          </p>
        </div>

        <a
          href="/profil"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors shrink-0"
        >
          <span>Lihat Halaman Publik</span>
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

      {/* Tab Navigasi */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('identitas')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'identitas'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Identitas, Kontak &amp; Logo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('visi-misi')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'visi-misi'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sejarah, Visi, Misi &amp; Tujuan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fasilitas')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'fasilitas'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Fasilitas &amp; Ekstrakurikuler
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* TAB 1: IDENTITAS & LOGO */}
        {activeTab === 'identitas' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Identitas &amp; Logo Sekolah</span>
            </h2>

            {/* Section Upload Logo */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-4">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                Logo Resmi Sekolah
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-emerald-200 shadow-sm flex items-center justify-center overflow-hidden p-2">
                  <SafeImage
                    src={logoPreview || logo}
                    alt="Logo SMAN 18 Bombana"
                    className="w-full h-full object-contain"
                    fallback={<School className="w-12 h-12 text-emerald-600" />}
                  />
                </div>
                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <p className="text-xs text-slate-600">
                    Gunakan logo resmi SMA NEGERI 18 BOMBANA berformat PNG, JPG, WEBP, atau SVG transparan (maks. 2 MB).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-4 h-4" />
                      <span>Pilih File Logo Baru</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoFileChange}
                      />
                    </label>
                    {logoFile && (
                      <button
                        type="button"
                        onClick={handleUploadLogo}
                        disabled={uploadingLogo}
                        className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {uploadingLogo ? 'Mengunggah...' : 'Upload Logo'}
                      </button>
                    )}
                  </div>
                  {logoFile && (
                    <span className="text-[11px] text-emerald-700 block font-medium">
                      File dipilih: {logoFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nama & Tagline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Resmi Sekolah
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="SMA NEGERI 18 BOMBANA"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagline Sekolah
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Membentuk Generasi Berkarakter, Cerdas, dan Berwawasan Lingkungan"
                />
              </div>
            </div>

            {/* Kontak & Lokasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nomor Telepon / WhatsApp</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="+62 821-xxxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email Resmi</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="info@sman18bombana.sch.id"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Alamat Website</span>
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="https://sman18bombana.sch.id"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Alamat Lengkap</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Kecamatan Poleang, Kabupaten Bombana, Sulawesi Tenggara 93772"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEJARAH, VISI, MISI, TUJUAN */}
        {activeTab === 'visi-misi' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Compass className="w-5 h-5 text-emerald-600" />
              <span>Sejarah, Visi, Misi, &amp; Tujuan Sekolah</span>
            </h2>

            {/* Sejarah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Sejarah Sekolah</span>
              </label>
              <textarea
                rows={4}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                placeholder="Tuliskan sejarah berdirinya SMA Negeri 18 Bombana..."
              />
            </div>

            {/* Visi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Visi Sekolah</span>
              </label>
              <textarea
                rows={3}
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed font-medium"
                placeholder="Menjadi sekolah unggul yang menghasilkan lulusan berakhlak mulia..."
              />
            </div>

            {/* Misi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Misi Sekolah (Tuliskan per poin)</span>
              </label>
              <textarea
                rows={5}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                placeholder="1. Menyelenggarakan pembelajaran berkualitas..."
              />
            </div>

            {/* Tujuan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-teal-600" />
                <span>Tujuan Sekolah</span>
              </label>
              <textarea
                rows={4}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                placeholder="1. Menghasilkan lulusan yang berakhlak mulia..."
              />
            </div>
          </div>
        )}

        {/* TAB 3: FASILITAS & EKSTRAKURIKULER */}
        {activeTab === 'fasilitas' && (
          <div className="space-y-6">
            {/* Kelola Fasilitas */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span>Fasilitas Sekolah ({facilities.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {facilities.map((fac, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveFacility(i)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 pr-5">{fac.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{fac.desc}</p>
                  </div>
                ))}
              </div>

              {/* Form Tambah Fasilitas */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nama fasilitas baru..."
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm flex-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Deskripsi singkat..."
                  value={newFacilityDesc}
                  onChange={(e) => setNewFacilityDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm flex-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFacility}
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* Kelola Ekstrakurikuler */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span>Ekstrakurikuler Sekolah ({extracurriculars.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {extracurriculars.map((ex, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveExtra(i)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 pr-5">{ex.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{ex.desc}</p>
                  </div>
                ))}
              </div>

              {/* Form Tambah Ekstrakurikuler */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nama ekstrakurikuler baru..."
                  value={newExtraName}
                  onChange={(e) => setNewExtraName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm flex-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Deskripsi kegiatan..."
                  value={newExtraDesc}
                  onChange={(e) => setNewExtraDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm flex-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddExtra}
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tombol Simpan Perubahan Utama */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-sm font-bold shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Seluruh Perubahan Profil'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
