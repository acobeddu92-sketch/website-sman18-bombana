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
  Loader2,
  RefreshCw,
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

interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  title: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function cleanFileNameToTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_-]+/g, ' ').trim();
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

  // Multiple Upload State (Admin Galeri)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [batchTitleBase, setBatchTitleBase] = useState('');
  const [batchDesc, setBatchDesc] = useState('');
  const [uploadCompleted, setUploadCompleted] = useState(false);

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
    // Bersihkan URL preview sebelumnya jika ada
    uploadQueue.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    if (photo) {
      setEditingPhoto(photo);
      setPhotoTitle(photo.title);
      setPhotoDesc(photo.description || '');
      setPhotoAlbumId(photo.album_id || '');
      setPhotoPreview(photo.image);
      setPhotoFile(null);
      setUploadQueue([]);
      setUploadCompleted(false);
    } else {
      setEditingPhoto(null);
      setPhotoTitle('');
      setPhotoDesc('');
      setPhotoAlbumId(
        selectedAlbumFilter !== 'all' ? selectedAlbumFilter : albums[0]?.id || ''
      );
      setPhotoPreview('');
      setPhotoFile(null);
      setUploadQueue([]);
      setBatchTitleBase('');
      setBatchDesc('');
      setUploadCompleted(false);
      setUploadProgress({ current: 0, total: 0, percent: 0 });
    }
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    if (isUploading) return;
    uploadQueue.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setUploadQueue([]);
    setShowPhotoModal(false);
    setUploadCompleted(false);
  };

  const handleResetForNextBatch = () => {
    if (isUploading) return;
    uploadQueue.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setUploadQueue([]);
    setBatchTitleBase('');
    setBatchDesc('');
    setUploadCompleted(false);
    setUploadProgress({ current: 0, total: 0, percent: 0 });
  };

  // Handler untuk ganti file pada mode edit foto tunggal
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type?.toLowerCase())) {
      setErrorMsg('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau SVG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Handler untuk memilih multiple files pada mode upload baru
  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    const newItems: UploadQueueItem[] = [];

    Array.from(fileList).forEach((file, idx) => {
      const isTypeValid = allowedTypes.includes(file.type?.toLowerCase());
      const isSizeValid = file.size <= 5 * 1024 * 1024;

      let status: 'pending' | 'error' = 'pending';
      let errorMessage: string | undefined = undefined;

      if (!isTypeValid) {
        status = 'error';
        errorMessage = 'Format tidak didukung (harus JPG/PNG/WEBP/SVG).';
      } else if (!isSizeValid) {
        status = 'error';
        errorMessage = 'Ukuran melebihi batas 5 MB.';
      }

      let initialTitle = '';
      if (batchTitleBase.trim()) {
        const itemNumber = uploadQueue.length + idx + 1;
        initialTitle = `${batchTitleBase.trim()} (${itemNumber})`;
      } else {
        initialTitle = cleanFileNameToTitle(file.name);
      }

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: isTypeValid ? URL.createObjectURL(file) : '',
        name: file.name,
        size: file.size,
        title: initialTitle,
        status,
        errorMessage,
      });
    });

    setUploadQueue((prev) => [...prev, ...newItems]);
    setUploadCompleted(false);

    // Reset input value agar dapat memilih file yang sama jika diperlukan
    e.target.value = '';
  };

  const handleRemoveQueueItem = (id: string) => {
    if (isUploading) return;
    setUploadQueue((prev) => {
      const itemToRemove = prev.find((i) => i.id === id);
      if (itemToRemove?.previewUrl && itemToRemove.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleApplyBatchTitle = () => {
    if (!batchTitleBase.trim()) return;
    setUploadQueue((prev) =>
      prev.map((item, idx) => {
        if (item.status === 'success') return item;
        const numberSuffix = prev.length > 1 ? ` (${idx + 1})` : '';
        return {
          ...item,
          title: `${batchTitleBase.trim()}${numberSuffix}`,
        };
      })
    );
  };

  // Handler proses upload multiple files satu per satu secara terpisah
  const handleStartBatchUpload = async () => {
    // Cegah double upload (Requirement 19)
    if (isUploading) return;

    const itemsToUpload = uploadQueue.filter(
      (item) => item.status === 'pending' || item.status === 'error'
    );

    if (itemsToUpload.length === 0) {
      setErrorMsg('Tidak ada foto yang siap diunggah.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setUploadCompleted(false);

    let successCount = uploadQueue.filter((item) => item.status === 'success').length;
    let failCount = 0;
    const totalToUpload = itemsToUpload.length;
    let processed = 0;

    setUploadProgress({ current: 0, total: totalToUpload, percent: 0 });

    for (let i = 0; i < uploadQueue.length; i++) {
      const currentItem = uploadQueue[i];

      // Lewati file yang sudah berhasil diupload sebelumnya
      if (currentItem.status === 'success') {
        continue;
      }

      // Validasi ukuran
      if (currentItem.file.size > 5 * 1024 * 1024) {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? { ...item, status: 'error', errorMessage: 'Ukuran melebihi batas 5 MB.' }
              : item
          )
        );
        failCount++;
        processed++;
        setUploadProgress({
          current: processed,
          total: totalToUpload,
          percent: Math.round((processed / totalToUpload) * 100),
        });
        continue;
      }

      // Update status menjadi sedang mengupload
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === currentItem.id ? { ...item, status: 'uploading' } : item
        )
      );

      try {
        // 1. Upload ke storage (/api/admin/upload -> Vercel Blob / fallback)
        const formData = new FormData();
        formData.append('file', currentItem.file);
        formData.append('folder', 'gallery');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || 'Gagal mengupload ke storage.');
        }

        // 2. Simpan record foto ke database
        const photoRes = await fetch('/api/admin/galeri/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentItem.title.trim() || cleanFileNameToTitle(currentItem.name),
            description: batchDesc.trim() || null,
            album_id: photoAlbumId || null,
            image: uploadData.url,
          }),
        });
        const photoData = await photoRes.json();

        if (!photoRes.ok || !photoData.success) {
          throw new Error(photoData.error || 'Gagal menyimpan foto ke database.');
        }

        // Berhasil
        successCount++;
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? { ...item, status: 'success', errorMessage: undefined }
              : item
          )
        );
      } catch (err: any) {
        failCount++;
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? { ...item, status: 'error', errorMessage: err.message || 'Gagal mengupload' }
              : item
          )
        );
      } finally {
        processed++;
        setUploadProgress({
          current: processed,
          total: totalToUpload,
          percent: Math.round((processed / totalToUpload) * 100),
        });
      }
    }

    setIsUploading(false);
    setUploadCompleted(true);

    // Refresh daftar galeri di latar belakang agar foto langsung muncul (Requirement 10)
    fetchData();

    if (failCount === 0) {
      setSuccessMsg(`Berhasil mengunggah ${processed} foto ke galeri.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setSuccessMsg(`${processed - failCount} foto berhasil diunggah.`);
      setErrorMsg(`${failCount} foto gagal diunggah. Silakan tinjau status file di bawah.`);
    }
  };

  // Handler untuk menyimpan edit foto tunggal
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

      if (!editingPhoto) return;

      const url = `/api/admin/galeri/photos/${editingPhoto.id}`;
      const method = 'PUT';

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
        setSuccessMsg('Foto berhasil diperbarui.');
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

  const totalBatchSize = uploadQueue.reduce((acc, item) => acc + item.size, 0);
  const queueSuccessCount = uploadQueue.filter((item) => item.status === 'success').length;
  const queueFailedCount = uploadQueue.filter((item) => item.status === 'error').length;
  const queuePendingCount = uploadQueue.filter((item) => item.status === 'pending').length;
  const queuePendingAndErrorCount = uploadQueue.filter(
    (item) => item.status === 'pending' || item.status === 'error'
  ).length;

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className={`bg-white rounded-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto ${
              editingPhoto ? 'max-w-lg' : 'max-w-2xl'
            }`}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingPhoto ? 'Edit Informasi Foto' : 'Upload Foto Galeri'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPhoto
                      ? 'Perbarui data atau ganti gambar foto ini.'
                      : 'Pilih satu atau banyak foto sekaligus untuk ditambahkan ke galeri.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePhotoModal}
                disabled={isUploading || savingPhoto}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode 1: Edit Foto Tunggal */}
            {editingPhoto ? (
              <form onSubmit={handleSavePhoto} className="space-y-4">
                {/* Preview & File Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    File Foto (JPG, PNG, WEBP, maks. 5 MB)
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
                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
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
                          Format JPG, PNG, WEBP, atau SVG hingga 5 MB
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/svg+xml"
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
                    onClick={handleClosePhotoModal}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingPhoto}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {savingPhoto ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: Multiple & Single File Upload Baru */
              <div className="space-y-4">
                {/* Opsi Target Album & Judul Template */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-emerald-600" />
                      <span>Album &amp; Pengaturan Batch</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Diterapkan ke batch foto</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pilih Album
                      </label>
                      <select
                        value={photoAlbumId}
                        onChange={(e) => setPhotoAlbumId(e.target.value)}
                        disabled={isUploading}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white disabled:bg-slate-100"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Template Judul (Opsional)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={batchTitleBase}
                          onChange={(e) => setBatchTitleBase(e.target.value)}
                          disabled={isUploading}
                          placeholder="Contoh: Upacara Hardiknas"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
                        />
                        {uploadQueue.length > 0 && batchTitleBase.trim() && (
                          <button
                            type="button"
                            onClick={handleApplyBatchTitle}
                            disabled={isUploading}
                            className="px-2.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold shrink-0 transition-colors"
                            title="Terapkan judul ini ke semua foto dalam antrean"
                          >
                            Terapkan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Deskripsi Bersama (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={batchDesc}
                      onChange={(e) => setBatchDesc(e.target.value)}
                      disabled={isUploading}
                      placeholder="Keterangan singkat tentang kegiatan atau foto-foto ini..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* File Picker Dropzone (Multiple = true) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih File Foto * (Bisa pilih 1 atau banyak foto sekaligus)
                  </label>
                  <label
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isUploading
                        ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                        : 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 shadow-2xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {uploadQueue.length > 0
                        ? '+ Klik untuk menambah foto lainnya'
                        : 'Klik untuk memilih satu atau banyak foto'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Format JPG, PNG, WEBP, atau SVG • Maksimal 5 MB per file
                    </span>
                    <input
                      type="file"
                      multiple={true}
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      disabled={isUploading}
                      className="hidden"
                      onChange={handleMultipleFilesChange}
                    />
                  </label>
                </div>

                {/* Indikator Progress Upload */}
                {isUploading && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>
                          Mengunggah foto {uploadProgress.current} dari {uploadProgress.total}...
                        </span>
                      </span>
                      <span className="font-mono">{uploadProgress.percent}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-emerald-200/70 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress.percent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Mohon jangan menutup jendela ini hingga proses upload selesai.
                    </p>
                  </div>
                )}

                {/* Banner Status Selesai */}
                {uploadCompleted && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      queueFailedCount === 0
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {queueFailedCount === 0 ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold">
                          {queueFailedCount === 0
                            ? `Semua ${queueSuccessCount} foto berhasil diunggah!`
                            : `${queueSuccessCount} foto berhasil, ${queueFailedCount} foto gagal.`}
                        </p>
                        <p className="text-[11px] opacity-80">
                          {queueFailedCount === 0
                            ? 'Foto baru langsung tampil pada galeri.'
                            : 'Foto yang berhasil tetap tersimpan di galeri. Anda dapat mengunggah ulang foto yang gagal.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetForNextBatch}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shrink-0 shadow-2xs self-end sm:self-center"
                    >
                      Upload Batch Baru
                    </button>
                  </div>
                )}

                {/* Daftar File dalam Antrean */}
                {uploadQueue.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Daftar Foto ({uploadQueue.length} file • Total {formatBytes(totalBatchSize)})
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        {queueSuccessCount > 0 && (
                          <span className="text-emerald-700 font-semibold">
                            ✓ {queueSuccessCount} Berhasil
                          </span>
                        )}
                        {queueFailedCount > 0 && (
                          <span className="text-red-600 font-semibold">
                            ✗ {queueFailedCount} Gagal
                          </span>
                        )}
                        {queuePendingCount > 0 && (
                          <span className="text-slate-500 font-semibold">
                            ⏳ {queuePendingCount} Siap
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-2 max-h-60 overflow-y-auto space-y-2 bg-slate-50/50">
                      {uploadQueue.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl bg-white border transition-all flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                            item.status === 'success'
                              ? 'border-emerald-200 bg-emerald-50/40'
                              : item.status === 'error'
                              ? 'border-red-200 bg-red-50/40'
                              : item.status === 'uploading'
                              ? 'border-emerald-400 ring-2 ring-emerald-500/20'
                              : 'border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>

                          {/* Info & Input Judul */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                                {idx + 1}. {item.name}
                              </p>
                              <span className="text-[11px] font-mono text-slate-500 shrink-0">
                                {formatBytes(item.size)}
                              </span>
                            </div>

                            <input
                              type="text"
                              value={item.title}
                              disabled={isUploading || item.status === 'success'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUploadQueue((prev) =>
                                  prev.map((q) => (q.id === item.id ? { ...q, title: val } : q))
                                );
                              }}
                              placeholder="Ketik judul foto..."
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 text-slate-700"
                            />
                          </div>

                          {/* Status & Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                            {item.status === 'pending' && (
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                Siap diupload
                              </span>
                            )}
                            {item.status === 'uploading' && (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Mengunggah...</span>
                              </span>
                            )}
                            {item.status === 'success' && (
                              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Berhasil</span>
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span
                                className="text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 max-w-[150px] truncate"
                                title={item.errorMessage}
                              >
                                <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                                <span className="truncate">{item.errorMessage || 'Gagal'}</span>
                              </span>
                            )}

                            {/* Tombol Hapus per file */}
                            {!isUploading && item.status !== 'success' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQueueItem(item.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Hapus dari antrean"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClosePhotoModal}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      {uploadCompleted && queueFailedCount === 0 ? 'Selesai & Tutup' : 'Batal / Tutup'}
                    </button>
                    {uploadQueue.length > 0 && !isUploading && (
                      <button
                        type="button"
                        onClick={handleResetForNextBatch}
                        className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Bersihkan Antrean
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {queueFailedCount > 0 && !isUploading && (
                      <button
                        type="button"
                        onClick={handleStartBatchUpload}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Upload Ulang ({queueFailedCount} Gagal)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleStartBatchUpload}
                      disabled={
                        isUploading ||
                        uploadQueue.length === 0 ||
                        queuePendingAndErrorCount === 0
                      }
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            Mengunggah ({uploadProgress.current}/{uploadProgress.total})...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>
                            {uploadQueue.length === 0
                              ? 'Pilih Foto Terlebih Dahulu'
                              : `Mulai Upload (${queuePendingAndErrorCount} Foto)`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
