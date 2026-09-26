'use client';

import React, { useState, useEffect } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import {
  X,
  Bell,
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Tag,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Newspaper,
  Layers,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  image?: string | null;
  category: string;
  published_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface AnnouncementManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onSuccess?: () => void;
}

export default function AnnouncementManagementModal({
  isOpen,
  onClose,
  userRole,
  onSuccess,
}: AnnouncementManagementModalProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form / Modal State
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'preview'>('list');
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('pengumuman');
  const [publishedAt, setPublishedAt] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/informasi?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data.announcements || []);
      } else {
        setErrorMsg(data.error || 'Gagal memuat informasi.');
      }
    } catch {
      setErrorMsg('Gagal memuat data informasi sekolah.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setContent('');
    setCategory('pengumuman');
    setPublishedAt(new Date().toISOString().slice(0, 10));
    setIsPublished(true);
    setImagePreview('');
    setImageFile(null);
    setActiveTab('form');
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setPublishedAt(item.published_at.slice(0, 10));
    setIsPublished(item.is_published);
    setImagePreview(item.image || '');
    setImageFile(null);
    setActiveTab('form');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Judul dan isi informasi wajib diisi.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let finalImageUrl = editingItem ? editingItem.image : null;

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'informasi');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          setErrorMsg(uploadData.error || 'Gagal mengunggah thumbnail gambar.');
          setSaving(false);
          return;
        }
        finalImageUrl = uploadData.url;
      }

      const url = editingItem
        ? `/api/admin/informasi/${editingItem.id}`
        : '/api/admin/informasi';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
          is_published: isPublished,
          image: finalImageUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(editingItem ? 'Informasi berhasil diperbarui.' : 'Informasi baru berhasil dibuat.');
        setActiveTab('list');
        fetchData();
        if (onSuccess) onSuccess();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan informasi.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi jaringan.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item: Announcement) => {
    try {
      const res = await fetch(`/api/admin/informasi/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      if (res.ok) {
        setSuccessMsg(`Status informasi diubah menjadi ${!item.is_published ? 'Published' : 'Draft'}.`);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Gagal mengubah status publikasi.');
      }
    } catch {
      setErrorMsg('Gagal mengubah status publikasi.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/informasi/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg('Informasi berhasil dihapus.');
        setDeleteTarget(null);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Gagal menghapus informasi.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = announcements.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Pusat Pengelolaan Informasi &amp; Pengumuman
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Portal resmi publikasi pengumuman sekolah &amp; beranda (Admin &amp; Pembina OSIS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-rose-100 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-emerald-100 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Sub Header & Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Daftar Pengumuman ({announcements.length})
            </button>
            <button
              onClick={handleOpenCreate}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'form' && !editingItem
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Pengumuman Baru</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-2">
              {/* Filter Status */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                {(['all', 'published', 'draft'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                      statusFilter === s
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {s === 'all' ? 'Semua' : s === 'published' ? 'Published' : 'Draft'}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchData}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari judul atau isi informasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Announcements List */}
              {loading ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs">Memuat informasi...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Tidak ada informasi ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Silakan ubah filter atau klik tombol &ldquo;Buat Pengumuman Baru&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item) => {
                    const isAgenda = item.category === 'agenda';
                    const isBerita = item.category === 'berita';

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          {item.image ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <SafeImage
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                fallback={
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                                    Foto
                                  </div>
                                }
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isAgenda
                                    ? 'bg-amber-100 text-amber-900'
                                    : isBerita
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {item.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.is_published
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.is_published ? 'Published' : 'Draft'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(item.published_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {item.content}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* Toggle Publish */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(item)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all ${
                              item.is_published
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={item.is_published ? 'Ubah ke Draft' : 'Publikasikan'}
                          >
                            {item.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            title="Edit Informasi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Hapus Informasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'form' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingItem ? 'Edit Informasi / Pengumuman' : 'Form Pengumuman Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Batal &amp; Kembali
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Informasi / Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Asesmen Sumatif & Pembagian Rapor Semester"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pengumuman">Pengumuman</option>
                    <option value="berita">Berita</option>
                    <option value="agenda">Agenda Kegiatan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Terbit
                  </label>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Publikasi
                  </label>
                  <select
                    value={isPublished ? 'published' : 'draft'}
                    onChange={(e) => setIsPublished(e.target.value === 'published')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="published">Published (Publik)</option>
                    <option value="draft">Draft (Disembunyikan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto / Thumbnail Dokumen (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <SafeImage
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        fallback={null}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Informasi Lengkap *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Tuliskan isi detail pengumuman atau berita secara lengkap..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed whitespace-pre-line"
                />
              </div>

              {/* Live Preview Card */}
              {title && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Tampilan Pengumuman</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900">
                      {category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">{title}</h4>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line line-clamp-3">
                      {content}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Hapus Pengumuman?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pengumuman &ldquo;{deleteTarget.title}&rdquo; akan dihapus secara permanen dari sistem.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
