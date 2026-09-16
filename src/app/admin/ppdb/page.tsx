'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Link as LinkIcon,
  Phone,
  Bell,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Save,
  Calendar,
  FileText,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  X,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface PpdbSettingsData {
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
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  image?: string | null;
  category: string;
  published_at: string;
  is_published: boolean;
}

export default function AdminPpdbPage() {
  const [activeTab, setActiveTab] = useState<'link' | 'kontak' | 'pengumuman' | 'database'>('link');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Settings State
  const [settings, setSettings] = useState<PpdbSettingsData>({
    registrationUrl: '',
    registrationStatus: 'coming_soon',
    academicYear: '2026/2027',
    startDate: '2026-06-15',
    endDate: '2026-07-10',
    announcementDate: '2026-07-15',
    reRegistrationDate: '2026-07-16 s/d 2026-07-20',
    contactPhone: '+62 821-9988-7766',
    contactEmail: 'ppdb@sman18bombana.sch.id',
    notes: '',
  });

  // Pengumuman PPDB State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announceImage, setAnnounceImage] = useState<File | null>(null);
  const [announcePreview, setAnnouncePreview] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [savingAnnounce, setSavingAnnounce] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ppdb');
      const data = await res.json();
      if (res.ok) {
        if (data.settings) setSettings(data.settings);
        if (data.announcements) setAnnouncements(data.announcements);
      } else {
        setErrorMsg(data.error || 'Gagal memuat data PPDB.');
      }
    } catch {
      setErrorMsg('Terjadi gangguan jaringan saat memuat data PPDB.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/ppdb', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Pengaturan PPDB berhasil disimpan.');
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan pengaturan PPDB.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi saat menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  // Handler Buat Pengumuman PPDB
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceContent.trim()) return;

    setSavingAnnounce(true);
    setErrorMsg('');

    try {
      let finalImageUrl: string | null = null;

      // Upload thumbnail jika ada
      if (announceImage) {
        const formData = new FormData();
        formData.append('file', announceImage);
        formData.append('folder', 'informasi');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          setErrorMsg(uploadData.error || 'Gagal mengupload gambar thumbnail.');
          setSavingAnnounce(false);
          return;
        }
        finalImageUrl = uploadData.url;
      }

      const res = await fetch('/api/admin/informasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announceTitle,
          content: announceContent,
          category: 'ppdb',
          published_at: new Date().toISOString(),
          is_published: isPublished,
          image: finalImageUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Pengumuman PPDB baru berhasil diterbitkan.');
        setShowAnnounceModal(false);
        setAnnounceTitle('');
        setAnnounceContent('');
        setAnnounceImage(null);
        setAnnouncePreview('');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setErrorMsg(data.error || 'Gagal menerbitkan pengumuman PPDB.');
      }
    } catch {
      setErrorMsg('Terjadi gangguan jaringan saat menyimpan pengumuman.');
    } finally {
      setSavingAnnounce(false);
    }
  };

  const handleTogglePublish = async (item: AnnouncementItem) => {
    try {
      const res = await fetch(`/api/admin/informasi/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      if (res.ok) {
        setSuccessMsg(`Status pengumuman diubah.`);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setErrorMsg('Gagal mengubah status publikasi.');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengumuman PPDB ini?')) return;
    try {
      const res = await fetch(`/api/admin/informasi/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg('Pengumuman PPDB berhasil dihapus.');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setErrorMsg('Gagal menghapus pengumuman.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-emerald-600" />
            <span>Pengelolaan PPDB (Penerimaan Peserta Didik Baru)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola tautan pendaftaran daring, jadwal pelaksanaan, kontak panitia, dan pengumuman resmi PPDB.
          </p>
        </div>

        <a
          href="/ppdb"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-xs sm:text-sm font-bold transition-all shadow-2xs self-start sm:self-auto"
        >
          <span>Lihat Portal Publik</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Alert Notifikasi */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab Navigasi Admin */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('link')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
            activeTab === 'link'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Link & Periode Pendaftaran</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kontak')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
            activeTab === 'kontak'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Kontak & Layanan Bantuan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pengumuman')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
            activeTab === 'pengumuman'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pengumuman PPDB ({announcements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
            activeTab === 'database'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Rencana Skema Database</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LINK & PERIODE PENDAFTARAN */}
      {/* ========================================================================= */}
      {activeTab === 'link' && (
        <form
          onSubmit={handleSaveSettings}
          className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 max-w-4xl"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Konfigurasi Tautan Pendaftaran Online
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola link formulir pendaftaran daring. Jika dikosongkan, halaman publik akan otomatis menampilkan status &quot;Link pendaftaran belum tersedia&quot;.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL / Tautan Pendaftaran Online Resmi
              </label>
              <input
                type="url"
                placeholder="Contoh: https://ppdb.sultraprov.go.id atau link Google Forms panitia..."
                value={settings.registrationUrl}
                onChange={(e) =>
                  setSettings({ ...settings, registrationUrl: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Kosongkan input ini jika link pendaftaran belum siap dibuka ke publik.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Pendaftaran
              </label>
              <select
                value={settings.registrationStatus}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    registrationStatus: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="coming_soon">Segera Dibuka (Coming Soon)</option>
                <option value="open">Dibuka (Buka Pendaftaran)</option>
                <option value="closed">Ditutup (Pendaftaran Berakhir)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tahun Ajaran PPDB
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 2026/2027"
                value={settings.academicYear}
                onChange={(e) =>
                  setSettings({ ...settings, academicYear: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Mulai Pendaftaran
              </label>
              <input
                type="date"
                value={settings.startDate}
                onChange={(e) =>
                  setSettings({ ...settings, startDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Akhir Pendaftaran
              </label>
              <input
                type="date"
                value={settings.endDate}
                onChange={(e) =>
                  setSettings({ ...settings, endDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Pengumuman Hasil Seleksi
              </label>
              <input
                type="date"
                value={settings.announcementDate}
                onChange={(e) =>
                  setSettings({ ...settings, announcementDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jadwal Pendaftaran Ulang
              </label>
              <input
                type="text"
                placeholder="Contoh: 16 s/d 20 Juli 2026"
                value={settings.reRegistrationDate}
                onChange={(e) =>
                  setSettings({ ...settings, reRegistrationDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Petunjuk untuk Calon Pendaftar
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan catatan penting mengenai pelaksanaan PPDB..."
                value={settings.notes}
                onChange={(e) =>
                  setSettings({ ...settings, notes: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Pendaftaran'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONTAK & LAYANAN BANTUAN */}
      {/* ========================================================================= */}
      {activeTab === 'kontak' && (
        <form
          onSubmit={handleSaveSettings}
          className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 max-w-4xl"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pengaturan Kontak Panitia & Layanan Bantuan PPDB
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kontak ini akan ditampilkan pada tab &quot;Bantuan&quot; di portal publik `/ppdb` agar calon siswa dapat bertanya langsung.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp Hotline Panitia PPDB
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: +62 821-9988-7766"
                value={settings.contactPhone}
                onChange={(e) =>
                  setSettings({ ...settings, contactPhone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Sistem akan secara otomatis membuat tautan chat langsung ke nomor ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email Resmi Panitia PPDB
              </label>
              <input
                type="email"
                required
                placeholder="ppdb@sman18bombana.sch.id"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings({ ...settings, contactEmail: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Kontak Bantuan'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PENGUMUMAN KHUSUS PPDB */}
      {/* ========================================================================= */}
      {activeTab === 'pengumuman' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pengumuman & Surat Edaran PPDB
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengumuman di bawah ini tersimpan di tabel database pengumuman resmi dan tampil pada portal `/ppdb`.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAnnounceModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengumuman PPDB</span>
            </button>
          </div>

          {/* List Pengumuman PPDB */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            {announcements.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs sm:text-sm">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p>Belum ada pengumuman PPDB yang diterbitkan.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol &quot;Tambah Pengumuman PPDB&quot; di atas untuk menerbitkan berita atau surat edaran baru.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          PPDB
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            item.is_published
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {item.is_published ? '● Terbit' : '○ Draf'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.published_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          item.is_published
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {item.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{item.is_published ? 'Tarik Draf' : 'Terbitkan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Tambah Pengumuman */}
          {showAnnounceModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-600" />
                    <span>Terbitkan Pengumuman PPDB Baru</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAnnounceModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Judul Pengumuman PPDB *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pengumuman Kelulusan Seleksi Berkas Jalur Zonasi..."
                      value={announceTitle}
                      onChange={(e) => setAnnounceTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Isi Pengumuman Lengkap *
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Tuliskan isi pengumuman atau surat edaran..."
                      value={announceContent}
                      onChange={(e) => setAnnounceContent(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gambar Thumbnail (Opsional)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAnnounceImage(file);
                          setAnnouncePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">Status Langsung Publikasikan</span>
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAnnounceModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={savingAnnounce}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {savingAnnounce ? 'Menerbitkan...' : 'Terbitkan Pengumuman'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STRUKTUR DATA PENDAFTAR & RENCANA DATABASE */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 max-w-4xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Database className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Arsitektur Skema Database PPDB (Rencana Tahap Berikutnya)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur model Prisma dan tabel PostgreSQL yang direkomendasikan untuk finalisasi penyimpanan pendaftar terpadu.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <p className="font-bold text-slate-900">
              💡 Status Implementasi Saat Ini:
            </p>
            <p>
              Sesuai instruksi dan prinsip integritas database produksi, antarmuka formulir dan upload berkas Vercel Blob telah berfungsi secara aman pada route <code className="bg-slate-200 px-1 rounded">/ppdb</code> tanpa membuat mutasi schema prematur atau menyuntikkan data dummy pada database Neon PostgreSQL.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rekomendasi Model Prisma (`prisma/schema.prisma`):
            </h4>
            <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto leading-relaxed">
              <pre>{`model PpdbApplicant {
  id                String         @id @default(cuid())
  registration_no   String         @unique // "PPDB-2026-XXXXXX"
  nama_lengkap      String
  nisn              String         @unique
  nik               String
  tempat_lahir      String
  tanggal_lahir     DateTime
  jenis_kelamin     String         // "Laki-laki" | "Perempuan"
  agama             String
  alamat            String
  kecamatan         String
  kabupaten         String         @default("Bombana")
  no_whatsapp       String
  email             String
  asal_sekolah      String
  tahun_lulus       String
  nama_orang_tua    String
  pekerjaan_ortu    String
  no_hp_ortu        String
  jalur_pendaftaran String         // "Zonasi" | "Prestasi" | "Afirmasi" | "Perpindahan"
  status_seleksi    String         @default("menunggu_verifikasi") // "lolos" | "tidak_lolos" | "cadangan"
  documents         PpdbDocument[]
  created_at        DateTime       @default(now())
  updated_at        DateTime       @updatedAt

  @@map("ppdb_applicants")
}

model PpdbDocument {
  id           String        @id @default(cuid())
  applicant_id String
  applicant    PpdbApplicant @relation(fields: [applicant_id], references: [id], onDelete: Cascade)
  category     String        // "kartu-keluarga" | "akta-kelahiran" | "ijazah-skl" | "pas-foto" | "dokumen-pendukung"
  file_url     String        // Vercel Blob URL: "ppdb/{id}/..."
  file_name    String
  size_bytes   Int
  mime_type    String
  created_at   DateTime      @default(now())

  @@map("ppdb_documents")
}`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
