'use client';

import React, { useState, useEffect } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import {
  X,
  Image as ImageIcon,
  FolderPlus,
  UploadCloud,
  Trash2,
  Edit3,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface Album {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  _count?: {
    photos: number;
  };
}

interface Photo {
  id: string;
  title: string;
  description: string | null;
  image: string;
  album_id: string | null;
  album?: {
    id: string;
    title: string;
  } | null;
  created_at: string;
}

interface GalleryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onSuccess?: () => void;
}

export default function GalleryManagementModal({
  isOpen,
  onClose,
  userRole,
  onSuccess,
}: GalleryManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'albums' | 'upload' | 'create-album'>('photos');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadAlbumId, setUploadAlbumId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New/Edit Album Form State
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isSavingAlbum, setIsSavingAlbum] = useState(false);

  // Edit Photo Form State
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editPhotoTitle, setEditPhotoTitle] = useState('');
  const [editPhotoDesc, setEditPhotoDesc] = useState('');
  const [editPhotoAlbumId, setEditPhotoAlbumId] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, selectedAlbumFilter]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [albumRes, photoRes] = await Promise.all([
        fetch('/api/admin/galeri/albums'),
        fetch(`/api/admin/galeri/photos?album_id=${selectedAlbumFilter}`),
      ]);

      if (albumRes.ok) {
        const albumData = await albumRes.json();
        setAlbums(albumData.albums || []);
      }
      if (photoRes.ok) {
        const photoData = await photoRes.json();
        setPhotos(photoData.photos || []);
      }
    } catch {
      setErrorMsg('Gagal memuat data galeri.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Ukuran file maksimal 5 MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!uploadTitle) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setUploadTitle(nameWithoutExt.replace(/[-_]/g, ' '));
      }
    }
  };

  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Pilih foto terlebih dahulu.');
      return;
    }
    if (!uploadTitle.trim()) {
      setErrorMsg('Judul foto wajib diisi.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Upload to storage
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'gallery');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Gagal mengupload file ke storage.');
      }

      // 2. Save photo record to DB
      const photoRes = await fetch('/api/admin/galeri/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          description: uploadDesc.trim() || null,
          album_id: uploadAlbumId || null,
          image: uploadData.url,
        }),
      });

      const photoData = await photoRes.json();
      if (!photoRes.ok || !photoData.success) {
        throw new Error(photoData.error || 'Gagal menyimpan foto ke database.');
      }

      setSuccessMsg('Foto berhasil diunggah ke galeri!');
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadTitle('');
      setUploadDesc('');
      setUploadAlbumId('');
      setActiveTab('photos');
      fetchData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim()) {
      setErrorMsg('Nama album wajib diisi.');
      return;
    }

    setIsSavingAlbum(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = editingAlbum
        ? `/api/admin/galeri/albums/${editingAlbum.id}`
        : '/api/admin/galeri/albums';
      const method = editingAlbum ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: albumTitle.trim(),
          description: albumDesc.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan album.');
      }

      setSuccessMsg(editingAlbum ? 'Album berhasil diperbarui.' : 'Album baru berhasil dibuat!');
      setAlbumTitle('');
      setAlbumDesc('');
      setEditingAlbum(null);
      setActiveTab('albums');
      fetchData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan album.');
    } finally {
      setIsSavingAlbum(false);
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('Yakin ingin menghapus album ini? Semua foto di dalamnya akan ikut terhapus.')) {
      return;
    }

    setDeletingId(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/galeri/albums/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus album.');
      setSuccessMsg('Album berhasil dihapus.');
      fetchData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus album.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Yakin ingin menghapus foto ini?')) return;

    setDeletingId(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/galeri/photos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus foto.');
      setSuccessMsg('Foto berhasil dihapus.');
      fetchData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus foto.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    setIsSavingPhoto(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/galeri/photos/${editingPhoto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPhotoTitle.trim(),
          description: editPhotoDesc.trim() || null,
          album_id: editPhotoAlbumId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memperbarui foto.');
      }

      setSuccessMsg('Foto berhasil diperbarui.');
      setEditingPhoto(null);
      fetchData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui foto.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Pusat Pengelolaan Galeri & Dokumentasi
              </h3>
              <p className="text-xs text-slate-500">
                Kelola album dan foto dokumentasi kegiatan SMAN 18 Bombana
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-2 pt-2">
          <button
            onClick={() => { setActiveTab('photos'); setEditingPhoto(null); }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'photos'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Koleksi Foto ({photos.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('albums'); setEditingAlbum(null); }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'albums'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Album Kegiatan ({albums.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Unggah Foto Baru</span>
          </button>

          <button
            onClick={() => {
              setEditingAlbum(null);
              setAlbumTitle('');
              setAlbumDesc('');
              setActiveTab('create-album');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'create-album'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Buat Album Baru</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DAFTAR FOTO */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Filter Album:</span>
                  <select
                    value={selectedAlbumFilter}
                    onChange={(e) => setSelectedAlbumFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="all">Semua Foto ({photos.length})</option>
                    {albums.map((alb) => (
                      <option key={alb.id} value={alb.id}>
                        {alb.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchData}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors"
                    title="Muat Ulang"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Foto</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                  <p className="text-xs">Memuat foto galeri...</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada foto dalam galeri ini</p>
                  <p className="text-[11px] text-slate-400 mt-1">Mulai unggah foto dokumentasi kegiatan sekolah.</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-3 px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Unggah Foto Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        <SafeImage
                          src={photo.image}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                              Foto tidak tersedia
                            </div>
                          }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                          <button
                            onClick={() => {
                              setEditingPhoto(photo);
                              setEditPhotoTitle(photo.title);
                              setEditPhotoDesc(photo.description || '');
                              setEditPhotoAlbumId(photo.album_id || '');
                            }}
                            className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs backdrop-blur-xs transition-colors shadow-xs"
                            title="Edit Foto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            disabled={deletingId === photo.id}
                            className="p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg text-xs backdrop-blur-xs transition-colors shadow-xs"
                            title="Hapus Foto"
                          >
                            {deletingId === photo.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-xs line-clamp-1" title={photo.title}>
                            {photo.title}
                          </p>
                          {photo.album?.title && (
                            <span className="inline-block mt-0.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md line-clamp-1">
                              {photo.album.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Photo Sub-modal */}
              {editingPhoto && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                  <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-extrabold text-slate-900 text-sm">Edit Informasi Foto</h4>
                      <button
                        onClick={() => setEditingPhoto(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={handleUpdatePhoto} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Judul Foto</label>
                        <input
                          type="text"
                          value={editPhotoTitle}
                          onChange={(e) => setEditPhotoTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Foto</label>
                        <textarea
                          rows={2}
                          value={editPhotoDesc}
                          onChange={(e) => setEditPhotoDesc(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Deskripsi kegiatan..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Album</label>
                        <select
                          value={editPhotoAlbumId}
                          onChange={(e) => setEditPhotoAlbumId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">-- Tanpa Album (Galeri Umum) --</option>
                          {albums.map((alb) => (
                            <option key={alb.id} value={alb.id}>
                              {alb.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingPhoto(null)}
                          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingPhoto}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          {isSavingPhoto && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAFTAR ALBUM */}
          {activeTab === 'albums' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-600">Total Album: {albums.length}</span>
                <button
                  onClick={() => {
                    setEditingAlbum(null);
                    setAlbumTitle('');
                    setAlbumDesc('');
                    setActiveTab('create-album');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Album</span>
                </button>
              </div>

              {albums.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada album kegiatan</p>
                  <p className="text-[11px] text-slate-400 mt-1">Buat album untuk mengelompokkan dokumentasi foto kegiatan.</p>
                  <button
                    onClick={() => setActiveTab('create-album')}
                    className="mt-3 px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Buat Album Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm line-clamp-1">
                            {album.title}
                          </h5>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full shrink-0">
                            {album._count?.photos || 0} Foto
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {album.description || 'Tidak ada deskripsi.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setSelectedAlbumFilter(album.id);
                            setActiveTab('photos');
                          }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Lihat Foto
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingAlbum(album);
                              setAlbumTitle(album.title);
                              setAlbumDesc(album.description || '');
                              setActiveTab('create-album');
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                            title="Edit Album"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAlbum(album.id)}
                            disabled={deletingId === album.id}
                            className="p-1 text-red-400 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
                            title="Hapus Album"
                          >
                            {deletingId === album.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UNGGAH FOTO */}
          {activeTab === 'upload' && (
            <form onSubmit={handleUploadPhoto} className="max-w-xl mx-auto space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Foto Dokumentasi</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">Format: JPG, PNG, WEBP. Maksimal 5 MB.</p>
              </div>

              {previewUrl && (
                <div className="relative aspect-16/9 max-w-sm mx-auto bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Foto *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Upacara Bendera HUT RI ke-81"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Album Kegiatan</label>
                <select
                  value={uploadAlbumId}
                  onChange={(e) => setUploadAlbumId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Tanpa Album (Galeri Umum) --</option>
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat (Opsional)</label>
                <textarea
                  rows={3}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Keterangan waktu, tempat, atau partisipan kegiatan..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Unggah Foto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: BUAT / EDIT ALBUM */}
          {activeTab === 'create-album' && (
            <form onSubmit={handleSaveAlbum} className="max-w-xl mx-auto space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  {editingAlbum ? 'Perbarui Informasi Album' : 'Form Pembuatan Album Baru'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Album memudahkan pengelompokan dokumentasi foto seperti peringatan hari besar, kegiatan OSIS, Pramuka, atau pembelajaran luar kelas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Album *</label>
                <input
                  type="text"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  placeholder="Contoh: Latihan Gabungan Pramuka 2026"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Album (Opsional)</label>
                <textarea
                  rows={3}
                  value={albumDesc}
                  onChange={(e) => setAlbumDesc(e.target.value)}
                  placeholder="Tujuan atau lingkup kegiatan dalam album ini..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAlbum(null);
                    setActiveTab('albums');
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingAlbum}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
                >
                  {isSavingAlbum ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      <span>{editingAlbum ? 'Simpan Perubahan' : 'Buat Album'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
