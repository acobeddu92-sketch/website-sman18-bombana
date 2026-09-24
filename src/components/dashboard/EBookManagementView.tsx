'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  FolderTree,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Upload,
  Globe,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Download,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Loader2,
  FileUp,
  Image as ImageIcon,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface EBookCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: {
    ebooks: number;
  };
}

interface EBook {
  id: string;
  title: string;
  author: string;
  publisher?: string | null;
  year?: number | null;
  isbn?: string | null;
  description?: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  cover_image?: string | null;
  is_published: boolean;
  published_at?: string | null;
  download_count: number;
  created_at: string;
  category: {
    id: string;
    name: string;
    code: string;
  };
  uploaded_by?: {
    id: string;
    name: string;
  };
}

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  isAdmin?: boolean;
}

export default function EBookManagementView({ user, isAdmin = false }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'ebooks' | 'categories'>('ebooks');

  // Data States
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [categories, setCategories] = useState<EBookCategory[]>([]);
  const [isLoadingEbooks, setIsLoadingEbooks] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Pagination & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEbooks, setTotalEbooks] = useState(0);

  // Category Search
  const [categorySearch, setCategorySearch] = useState('');

  // Alerts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEBook, setSelectedEBook] = useState<EBook | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EBookCategory | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'publish' | 'unpublish' | 'delete' | 'deleteCategory';
    targetId: string;
    targetName: string;
  } | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  // Reader Modal
  const [readerEBook, setReaderEBook] = useState<EBook | null>(null);

  // Form States - EBook Upload/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPublisher, setFormPublisher] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formCover, setFormCover] = useState<File | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Form States - Category
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // --------------------------------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------------------------------

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const res = await fetch('/api/library/ebook-categories');
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const fetchEbooks = useCallback(async () => {
    setIsLoadingEbooks(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategoryFilter !== 'all') params.set('category_id', selectedCategoryFilter);
      if (statusFilter === 'published') params.set('is_published', 'true');
      if (statusFilter === 'draft') params.set('is_published', 'false');
      params.set('page', String(currentPage));
      params.set('limit', '12');

      const res = await fetch(`/api/library/ebooks?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEbooks(data.ebooks || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalEbooks(data.pagination.total || 0);
        }
      } else {
        setEbooks([]);
        setTotalPages(1);
        setTotalEbooks(0);
      }
    } catch (err) {
      console.error('Error fetching ebooks:', err);
      setEbooks([]);
    } finally {
      setIsLoadingEbooks(false);
    }
  }, [searchQuery, selectedCategoryFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchEbooks();
  }, [fetchEbooks]);

  const clearFeedback = () => setFeedback(null);

  // --------------------------------------------------------------------------
  // HANDLERS: E-BOOK CRUD
  // --------------------------------------------------------------------------

  const openUploadModal = () => {
    setFormTitle('');
    setFormAuthor('');
    setFormCategoryId(categories[0]?.id || '');
    setFormPublisher('');
    setFormYear('');
    setFormIsbn('');
    setFormDescription('');
    setFormFile(null);
    setFormCover(null);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAuthor.trim() || !formCategoryId) {
      setFeedback({ type: 'error', message: 'Judul, penulis, dan kategori wajib diisi.' });
      return;
    }
    if (!formFile) {
      setFeedback({ type: 'error', message: 'Berkas e-book (PDF atau EPUB maksimal 25 MB) wajib diunggah.' });
      return;
    }

    setIsSubmittingForm(true);
    clearFeedback();

    try {
      const formData = new FormData();
      formData.set('title', formTitle.trim());
      formData.set('author', formAuthor.trim());
      formData.set('category_id', formCategoryId);
      if (formPublisher.trim()) formData.set('publisher', formPublisher.trim());
      if (formYear.trim()) formData.set('year', formYear.trim());
      if (formIsbn.trim()) formData.set('isbn', formIsbn.trim());
      if (formDescription.trim()) formData.set('description', formDescription.trim());
      formData.set('file', formFile);
      if (formCover) formData.set('cover', formCover);

      const res = await fetch('/api/library/ebooks', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: 'Buku elektronik baru berhasil disimpan sebagai Draft.',
        });
        setShowUploadModal(false);
        fetchEbooks();
        fetchCategories();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal mengunggah e-book.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat mengunggah e-book.' });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const openEditModal = (ebook: EBook) => {
    setSelectedEBook(ebook);
    setFormTitle(ebook.title);
    setFormAuthor(ebook.author);
    setFormCategoryId(ebook.category.id);
    setFormPublisher(ebook.publisher || '');
    setFormYear(ebook.year ? String(ebook.year) : '');
    setFormIsbn(ebook.isbn || '');
    setFormDescription(ebook.description || '');
    setFormFile(null);
    setFormCover(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEBook) return;
    if (!formTitle.trim() || !formAuthor.trim() || !formCategoryId) {
      setFeedback({ type: 'error', message: 'Judul, penulis, dan kategori wajib diisi.' });
      return;
    }

    setIsSubmittingForm(true);
    clearFeedback();

    try {
      const formData = new FormData();
      formData.set('title', formTitle.trim());
      formData.set('author', formAuthor.trim());
      formData.set('category_id', formCategoryId);
      formData.set('publisher', formPublisher.trim());
      formData.set('year', formYear.trim());
      formData.set('isbn', formIsbn.trim());
      formData.set('description', formDescription.trim());
      if (formFile) formData.set('file', formFile);
      if (formCover) formData.set('cover', formCover);

      const res = await fetch(`/api/library/ebooks/${selectedEBook.id}`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Data buku elektronik berhasil diperbarui.' });
        setShowEditModal(false);
        fetchEbooks();
        fetchCategories();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal memperbarui e-book.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat memperbarui e-book.' });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: PUBLISH, UNPUBLISH, DELETE CONFIRMATIONS
  // --------------------------------------------------------------------------

  const handleExecuteConfirmAction = async () => {
    if (!confirmAction) return;
    setIsActionProcessing(true);
    clearFeedback();

    try {
      if (confirmAction.type === 'publish') {
        const res = await fetch(`/api/library/ebooks/${confirmAction.targetId}/publish`, {
          method: 'POST',
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFeedback({ type: 'success', message: `E-Book "${confirmAction.targetName}" berhasil dipublikasikan.` });
          fetchEbooks();
        } else {
          setFeedback({ type: 'error', message: data.error || 'Gagal mempublikasikan e-book.' });
        }
      } else if (confirmAction.type === 'unpublish') {
        const res = await fetch(`/api/library/ebooks/${confirmAction.targetId}/unpublish`, {
          method: 'POST',
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFeedback({ type: 'success', message: `E-Book "${confirmAction.targetName}" dikembalikan menjadi status Draft.` });
          fetchEbooks();
        } else {
          setFeedback({ type: 'error', message: data.error || 'Gagal membatalkan publikasi e-book.' });
        }
      } else if (confirmAction.type === 'delete') {
        const res = await fetch(`/api/library/ebooks/${confirmAction.targetId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFeedback({ type: 'success', message: `E-Book "${confirmAction.targetName}" berhasil dihapus secara permanen.` });
          fetchEbooks();
          fetchCategories();
        } else {
          setFeedback({ type: 'error', message: data.error || 'Gagal menghapus e-book.' });
        }
      } else if (confirmAction.type === 'deleteCategory') {
        const res = await fetch(`/api/library/ebook-categories/${confirmAction.targetId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFeedback({ type: 'success', message: `Kategori "${confirmAction.targetName}" berhasil dihapus.` });
          fetchCategories();
        } else {
          setFeedback({ type: 'error', message: data.error || 'Gagal menghapus kategori.' });
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem saat memproses tindakan.' });
    } finally {
      setIsActionProcessing(false);
      setConfirmAction(null);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: CATEGORIES CRUD
  // --------------------------------------------------------------------------

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatCode('');
    setCatDescription('');
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat: EBookCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatDescription(cat.description || '');
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catCode.trim()) {
      setFeedback({ type: 'error', message: 'Nama dan kode kategori wajib diisi.' });
      return;
    }

    setIsSubmittingCategory(true);
    clearFeedback();

    try {
      const payload = {
        name: catName.trim(),
        code: catCode.trim().toUpperCase(),
        description: catDescription.trim() || null,
      };

      if (editingCategory) {
        const res = await fetch(`/api/library/ebook-categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFeedback({ type: 'success', message: 'Kategori e-book berhasil diperbarui.' });
          setShowCategoryModal(false);
          fetchCategories();
        } else {
          setFeedback({ type: 'error', message: data.error || 'Gagal memperbarui kategori.' });
        }
      } else {
        const res = await fetch('/api/library/ebook-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFeedback({ type: 'success', message: 'Kategori e-book baru berhasil ditambahkan.' });
          setShowCategoryModal(false);
          fetchCategories();
        } else {
          setFeedback({ type: 'error', message: data.error || 'Gagal menambahkan kategori.' });
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem saat menyimpan kategori.' });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Filter Categories
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Perpustakaan Digital</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <span>Manajemen Buku Elektronik (E-Book)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Koleksi buku digital resmi SMA Negeri 18 Bombana dengan proteksi akses berkas terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'ebooks' ? (
            <button
              onClick={openUploadModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all"
            >
              <FileUp className="w-4 h-4" />
              <span>Unggah E-Book Baru</span>
            </button>
          ) : (
            <button
              onClick={openAddCategoryModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori E-Book</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={clearFeedback} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('ebooks')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'ebooks'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Katalog E-Book</span>
          {totalEbooks > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
              {totalEbooks}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Kategori E-Book</span>
          {categories.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
              {categories.length}
            </span>
          )}
        </button>
      </div>

      {/* SUBTAB 1: KATALOG E-BOOK */}
      {activeSubTab === 'ebooks' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari judul, pengarang, penerbit, atau ISBN e-book..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Semua Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="p-2 text-xs rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                title="Reset Filter"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table / List View */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {isLoadingEbooks ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  Memuat daftar buku elektronik...
                </p>
              </div>
            ) : ebooks.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  Belum Ada Koleksi Buku Elektronik
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Katalog e-book saat ini masih kosong. Klik tombol &quot;Unggah E-Book Baru&quot; untuk menambahkan dokumen PDF atau EPUB.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">E-Book</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Format & Ukuran</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Diunduh</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {ebooks.map((eb) => (
                      <tr key={eb.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {eb.cover_image ? (
                                <SafeImage
                                  src={eb.cover_image}
                                  alt={eb.title}
                                  className="w-full h-full object-cover"
                                  fallback={<BookOpen className="w-5 h-5 text-slate-400" />}
                                />
                              ) : (
                                <BookOpen className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs sm:max-w-md">
                              <p className="font-bold text-slate-900 line-clamp-1">{eb.title}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {eb.author} {eb.year ? `(${eb.year})` : ''}
                              </p>
                              {eb.isbn && (
                                <p className="text-[10px] font-mono text-slate-400">ISBN: {eb.isbn}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {eb.category.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {eb.mime_type.includes('pdf') ? 'PDF' : 'EPUB'}
                            </span>
                            <p className="text-[11px] text-slate-500">{formatFileSize(eb.file_size)}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {eb.is_published ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Globe className="w-3 h-3 text-emerald-600" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <Lock className="w-3 h-3 text-amber-600" />
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                          {eb.download_count}x
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setReaderEBook(eb)}
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                              title="Baca E-Book"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {eb.is_published ? (
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'unpublish',
                                    targetId: eb.id,
                                    targetName: eb.title,
                                  })
                                }
                                className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                                title="Kembalikan ke Draft"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'publish',
                                    targetId: eb.id,
                                    targetName: eb.title,
                                  })
                                }
                                className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                title="Publikasikan E-Book"
                              >
                                <Globe className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => openEditModal(eb)}
                              className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                              title="Edit Metadata / Berkas"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'delete',
                                  targetId: eb.id,
                                  targetName: eb.title,
                                  })
                              }
                              className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                              title="Hapus E-Book"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Halaman {currentPage} dari {totalPages} (Total {totalEbooks} e-book)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-semibold"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-semibold"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: KATEGORI E-BOOK */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          {/* Search Bar Kategori */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Cari kategori e-book berdasarkan nama atau kode..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
            <button
              onClick={fetchCategories}
              className="p-2 text-xs rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
              title="Segarkan Kategori"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {isLoadingCategories ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  Memuat daftar kategori e-book...
                </p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-12 text-center">
                <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  Belum Ada Kategori E-Book
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Kategori diperlukan saat mengunggah e-book. Klik &quot;Tambah Kategori E-Book&quot; untuk membuat kategori baru.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Kode</th>
                      <th className="py-3.5 px-4">Nama Kategori</th>
                      <th className="py-3.5 px-4">Deskripsi</th>
                      <th className="py-3.5 px-4 text-center">Jumlah E-Book</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs">
                            {cat.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{cat.name}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-sm">
                          {cat.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {cat._count?.ebooks || 0} judul
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditCategoryModal(cat)}
                              className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                              title="Edit Kategori"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'deleteCategory',
                                  targetId: cat.id,
                                  targetName: cat.name,
                                })
                              }
                              className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: UNGGAH E-BOOK BARU                                          */}
      {/* ------------------------------------------------------------------- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Unggah E-Book Baru</h3>
                  <p className="text-xs text-slate-500">
                    Format berkas didukung: PDF dan EPUB (Maks. 25 MB).
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmittingForm && setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Catatan Publikasi:</strong> Setiap e-book yang baru diunggah akan berstatus <strong>Draft</strong> secara otomatis demi keamanan mutu dokumen. Publikasi dapat dilakukan setelah pemeriksaan konten melalui tombol <em>Publikasikan</em>.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Buku Elektronik <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Biologi SMA Kelas XI Kurikulum Merdeka"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Penulis / Pengarang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Nama penulis"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori E-Book <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="" disabled>
                      Pilih Kategori
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={formPublisher}
                    onChange={(e) => setFormPublisher(e.target.value)}
                    placeholder="Nama penerbit"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    placeholder="978-..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sinopsis / Deskripsi</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ringkasan isi buku atau catatan pengantar..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Upload Berkas Dokumen */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Berkas Dokumen E-Book (PDF / EPUB)</span> <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Maksimal ukuran berkas: 25 MB.
                </p>
                <input
                  type="file"
                  required
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFormFile(f);
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
                {formFile && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-2">
                    Berkas terpilih: {formFile.name} ({formatFileSize(formFile.size)})
                  </p>
                )}
              </div>

              {/* Upload Sampul Buku */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Sampul Buku (Opsional)</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Format gambar JPG, PNG, atau WEBP (Maksimal 5 MB).
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFormCover(f);
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
                {formCover && (
                  <p className="text-[11px] font-semibold text-slate-700 mt-2">
                    Sampul terpilih: {formCover.name} ({formatFileSize(formCover.size)})
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmittingForm}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingForm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Simpan Draft</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: EDIT METADATA & GANTI FILE                                  */}
      {/* ------------------------------------------------------------------- */}
      {showEditModal && selectedEBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Perbarui Buku Elektronik</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{selectedEBook.title}</p>
                </div>
              </div>
              <button
                onClick={() => !isSubmittingForm && setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Buku Elektronik <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Penulis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={formPublisher}
                    onChange={(e) => setFormPublisher(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sinopsis / Deskripsi</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Opsi Ganti Berkas */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">
                  Ganti Berkas Dokumen (Opsional)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Berkas saat ini: <strong>{selectedEBook.file_name}</strong> ({formatFileSize(selectedEBook.file_size)}). Biarkan kosong jika tidak ingin mengganti berkas.
                </p>
                <input
                  type="file"
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFormFile(f);
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              {/* Opsi Ganti Sampul */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">
                  Ganti Sampul Buku (Opsional)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Format gambar JPG, PNG, atau WEBP. Biarkan kosong jika tidak ingin mengganti sampul.
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFormCover(f);
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmittingForm}
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingForm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Perbarui Data</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: TAMBAH / EDIT KATEGORI E-BOOK                               */}
      {/* ------------------------------------------------------------------- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingCategory ? 'Edit Kategori E-Book' : 'Tambah Kategori E-Book'}
              </h3>
              <button
                onClick={() => !isSubmittingCategory && setShowCategoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Buku Teks Pelajaran"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kode Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: TEKS"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Keterangan singkat kategori..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmittingCategory}
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Kategori</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI AKSI (PUBLISH / UNPUBLISH / DELETE)               */}
      {/* ------------------------------------------------------------------- */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmAction.type === 'delete' || confirmAction.type === 'deleteCategory'
                    ? 'bg-red-100 text-red-600'
                    : confirmAction.type === 'publish'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {confirmAction.type === 'delete' || confirmAction.type === 'deleteCategory' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmAction.type === 'publish' ? (
                  <Globe className="w-6 h-6" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {confirmAction.type === 'publish'
                    ? 'Publikasikan E-Book?'
                    : confirmAction.type === 'unpublish'
                    ? 'Batalkan Publikasi?'
                    : confirmAction.type === 'delete'
                    ? 'Hapus E-Book Permanen?'
                    : 'Hapus Kategori E-Book?'}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">{confirmAction.targetName}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {confirmAction.type === 'publish' &&
                'E-Book ini akan segera dapat diakses dan dibaca oleh seluruh peserta didik (siswa) melalui Portal Siswa.'}
              {confirmAction.type === 'unpublish' &&
                'E-Book akan dikembalikan ke status Draft. Siswa tidak lagi dapat melihat atau membaca berkas ini.'}
              {confirmAction.type === 'delete' &&
                'Tindakan ini akan menghapus data e-book beserta berkas terkait secara permanen dari server dan penyimpanan. Tindakan ini tidak dapat dibatalkan.'}
              {confirmAction.type === 'deleteCategory' &&
                'Kategori hanya dapat dihapus jika tidak ada judul e-book yang terhubung.'}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isActionProcessing}
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs sm:text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isActionProcessing}
                onClick={handleExecuteConfirmAction}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center gap-2 ${
                  confirmAction.type === 'delete' || confirmAction.type === 'deleteCategory'
                    ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20'
                    : confirmAction.type === 'publish'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20'
                }`}
              >
                {isActionProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>
                    {confirmAction.type === 'publish'
                      ? 'Ya, Publikasikan'
                      : confirmAction.type === 'unpublish'
                      ? 'Kembalikan ke Draft'
                      : 'Ya, Hapus'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: PROTECTED E-BOOK READER                                     */}
      {/* ------------------------------------------------------------------- */}
      {readerEBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
            {/* Header Reader */}
            <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {readerEBook.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {readerEBook.author} • {readerEBook.category.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/library/ebooks/${readerEBook.id}/read`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buka di Tab Baru</span>
                </a>
                <button
                  onClick={() => setReaderEBook(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Tutup Pembaca"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Konten Reader */}
            <div className="flex-1 bg-slate-950 p-2 overflow-hidden flex flex-col items-center justify-center">
              {readerEBook.mime_type === 'application/pdf' ? (
                <iframe
                  src={`/api/library/ebooks/${readerEBook.id}/read#toolbar=1`}
                  className="w-full h-full rounded-2xl border border-slate-800 bg-white"
                  title={readerEBook.title}
                />
              ) : (
                <div className="max-w-md p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Format Buku EPUB</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Berkas e-book ini berformat EPUB ({formatFileSize(readerEBook.file_size)}). Silakan klik tombol di bawah untuk mengunduh dan membaca melalui aplikasi pembaca EPUB di perangkat Anda.
                    </p>
                  </div>
                  <a
                    href={`/api/library/ebooks/${readerEBook.id}/read`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Berkas EPUB</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
