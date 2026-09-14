'use client';

import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  FolderPlus,
  Upload,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Folder,
  Layers,
  Filter,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface Album {
  id: string;
  title: string;
  description?: string | null;
  _count?: { photos: number };
}

interface Photo {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  album_id?: string | null;
  album?: { id: string; title: string } | null;
  created_at: string;
}

export default function AdminGaleriPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('all');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State Album
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [savingAlbum, setSavingAlbum] = useState(false);

  // Modal State Photo
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoAlbumId, setPhotoAlbumId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'album' | 'photo'; id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedAlbumFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [albumRes, photoRes] = await Promise.all([
        fetch('/api/admin/galeri/albums'),
        fetch(`/api/admin/galeri/photos?album_id=${selectedAlbumFilter}`),
      ]);
      const albumData = await albumRes.json();
      const photoData = await photoRes.json();

      if (albumRes.ok) setAlbums(albumData.albums || []);
      if (photoRes.ok) setPhotos(photoData.photos || []);
    } catch {
      setErrorMsg('Gagal memuat data galeri.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER ALBUM ---
  const handleOpenAlbumModal = (album?: Album) => {
    if (album) {
      setEditingAlbum(album);
      setAlbumTitle(album.title);
      setAlbumDesc(album.description || '');
    } else {
      setEditingAlbum(null);
      setAlbumTitle('');
      setAlbumDesc('');
    }
    setShowAlbumModal(true);
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim()) return;
    setSavingAlbum(true);
    setErrorMsg('');

    try {
      const url = editingAlbum
        ? `/api/admin/galeri/albums/${editingAlbum.id}`
        : '/api/admin/galeri/albums';
      const method = editingAlbum ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: albumTitle, description: albumDesc }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(editingAlbum ? 'Album berhasil diubah.' : 'Album baru berhasil dibuat.');
        setShowAlbumModal(false);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan album.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setSavingAlbum(false);
    }
  };

  // --- HANDLER FOTO ---
  const handleOpenPhotoModal = (photo?: Photo) => {
    if (photo) {
      setEditingPhoto(photo);
      setPhotoTitle(photo.title);
      setPhotoDesc(photo.description || '');
      setPhotoAlbumId(photo.album_id || '');
      setPhotoPreview(photo.image);
      setPhotoFile(null);
    } else {
      setEditingPhoto(null);
      setPhotoTitle('');
      setPhotoDesc('');
      setPhotoAlbumId(albums[0]?.id || '');
      setPhotoPreview('');
      setPhotoFile(null);
    }
    setShowPhotoModal(true);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoTitle.trim()) return;
    if (!editingPhoto && !photoFile) {
      setErrorMsg('Silakan pilih file foto terlebih dahulu.');
      return;
    }

    setSavingPhoto(true);
    setErrorMsg('');

    try {
      let finalImageUrl = editingPhoto ? editingPhoto.image : '';

      // Upload file baru jika ada file yang dipilih
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('folder', 'gallery');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          setErrorMsg(uploadData.error || 'Gagal mengupload foto.');
          setSavingPhoto(false);
          return;
        }
        finalImageUrl = uploadData.url;
      }

      const url = editingPhoto
        ? `/api/admin/galeri/photos/${editingPhoto.id}`
        : '/api/admin/galeri/photos';
      const method = editingPhoto ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: photoTitle,
          description: photoDesc,
          album_id: photoAlbumId || null,
          image: finalImageUrl,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(editingPhoto ? 'Foto berhasil diperbarui.' : 'Foto baru berhasil ditambahkan.');
        setShowPhotoModal(false);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan foto.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setSavingPhoto(false);
    }
  };

  // --- HANDLER HAPUS ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const url =
        deleteTarget.type === 'album'
          ? `/api/admin/galeri/albums/${deleteTarget.id}`
          : `/api/admin/galeri/photos/${deleteTarget.id}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(deleteTarget.type === 'album' ? 'Album dan foto di dalamnya berhasil dihapus.' : 'Foto berhasil dihapus.');
        setDeleteTarget(null);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Gagal menghapus data.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ImageIcon className="w-7 h-7 text-emerald-600" />
            <span>Pusat Pengelolaan Galeri &amp; Album</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola album foto kegiatan, fasilitas, dan dokumentasi resmi SMA Negeri 18 Bombana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAlbumModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600" />
            <span>Buat Album Baru</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenPhotoModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-700/20 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Foto</span>
          </button>
        </div>
      </div>

      {/* Alert Notifikasi */}
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

      {/* DAFTAR ALBUM (CARD GRID) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Album Galeri ({albums.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Klik album untuk filter foto</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setSelectedAlbumFilter('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedAlbumFilter === 'all'
                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <Folder className="w-5 h-5 text-emerald-700" />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Semua
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mt-2">Semua Album</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Tampilkan seluruh koleksi foto</p>
          </button>

          {albums.map((alb) => (
            <div
              key={alb.id}
              className={`p-3.5 rounded-2xl border transition-all relative group ${
                selectedAlbumFilter === alb.id
                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedAlbumFilter(alb.id)}
                  className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs"
                >
                  <Folder className="w-4 h-4" />
                  <span>{alb._count?.photos || 0} Foto</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenAlbumModal(alb)}
                    className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                    title="Edit Album"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'album', id: alb.id, title: alb.title })}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Hapus Album"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlbumFilter(alb.id)}
                className="text-left w-full mt-2"
              >
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{alb.title}</h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {alb.description || 'Tidak ada deskripsi'}
                </p>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* DAFTAR FOTO (PHOTO GRID) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              Koleksi Foto ({photos.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {selectedAlbumFilter === 'all'
              ? 'Menampilkan Semua Foto'
              : `Filter: ${albums.find((a) => a.id === selectedAlbumFilter)?.title || ''}`}
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p>Belum ada foto dalam galeri ini.</p>
            <button
              type="button"
              onClick={() => handleOpenPhotoModal()}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
            >
              Upload Foto Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {photos.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col group"
              >
                {/* Visual Thumbnail */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallback={
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-400 p-4">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Gambar</span>
                      </div>
                    }
                  />
                  {item.album && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                      {item.album.title}
                    </span>
                  )}
                </div>

                {/* Konten Foto */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoModal(item)}
                        className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                        title="Edit Foto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'photo', id: item.id, title: item.title })}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL ALBUM */}
      {showAlbumModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-600" />
                <span>{editingAlbum ? 'Edit Album Galeri' : 'Buat Album Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAlbumModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Album *
                </label>
                <input
                  type="text"
                  required
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  placeholder="Contoh: Upacara Bendera, Class Meeting..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Album
                </label>
                <textarea
                  rows={3}
                  value={albumDesc}
                  onChange={(e) => setAlbumDesc(e.target.value)}
                  placeholder="Keterangan singkat tentang album ini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAlbumModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAlbum}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {savingAlbum ? 'Menyimpan...' : 'Simpan Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD / EDIT FOTO */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <span>{editingPhoto ? 'Edit Informasi Foto' : 'Upload Foto Galeri'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              {/* Preview & File Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  File Foto * (JPG, PNG, WEBP, maks. 5 MB)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                  {photoPreview ? (
                    <div className="space-y-3">
                      <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-xs">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs">
                        <span>Ganti File Foto</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handlePhotoFileChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                      <Upload className="w-10 h-10 text-emerald-600 mb-2" />
                      <span className="text-xs font-bold text-slate-700">
                        Klik untuk memilih foto
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Format JPG, PNG, atau WEBP hingga 5 MB
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Album
                </label>
                <select
                  value={photoAlbumId}
                  onChange={(e) => setPhotoAlbumId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Tanpa Album (Umum) --</option>
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Foto *
                </label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="Contoh: Penyerahan Piala Juara 1..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Foto
                </label>
                <textarea
                  rows={2}
                  value={photoDesc}
                  onChange={(e) => setPhotoDesc(e.target.value)}
                  placeholder="Keterangan singkat tentang momen foto ini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPhoto}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {savingPhoto ? 'Menyimpan...' : 'Simpan Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus {deleteTarget.type === 'album' ? 'Album' : 'Foto'}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus &ldquo;{deleteTarget.title}&rdquo;?{' '}
                {deleteTarget.type === 'album'
                  ? 'Seluruh foto di dalam album ini juga akan dihapus secara permanen.'
                  : 'File foto ini akan dihapus dari sistem.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
