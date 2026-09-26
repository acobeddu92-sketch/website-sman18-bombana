'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import EBookManagementView from './EBookManagementView';
import GalleryManagementModal from './GalleryManagementModal';
import { UserRole } from '@/lib/constants';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  Image as ImageIcon,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Tablet,
  BarChart3,
  Printer,
  Bell,
  User,
  LogOut,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  X,
  RefreshCw,
  Loader2,
  Menu,
  ChevronRight,
  GraduationCap,
  Sparkles,
  School,
  FileText,
  BadgeAlert,
  PackagePlus,
  Coins,
  ShieldAlert,
  Send,
} from 'lucide-react';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
    nip?: string | null;
  };
}

type LibraryTab =
  | 'dashboard'
  | 'katalog'
  | 'kategori'
  | 'anggota'
  | 'peminjaman'
  | 'pengembalian'
  | 'riwayat'
  | 'ebooks'
  | 'ebook-categories'
  | 'statistik'
  | 'laporan'
  | 'notifikasi';

export default function LibraryView({ user }: Props) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Global Alert
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const clearFeedback = () => setFeedback(null);

  // --------------------------------------------------------------------------
  // 1. DASHBOARD DATA
  // --------------------------------------------------------------------------
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch('/api/library/dashboard');
      const data = await res.json();
      if (res.ok && data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching library dashboard:', err);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // 2. KATALOG BUKU FISIK
  // --------------------------------------------------------------------------
  const [books, setBooks] = useState<any[]>([]);
  const [physicalCategories, setPhysicalCategories] = useState<any[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBookCategory, setSelectedBookCategory] = useState('all');
  const [bookStockStatus, setBookStockStatus] = useState('all');
  const [bookPage, setBookPage] = useState(1);
  const [bookTotalPages, setBookTotalPages] = useState(1);
  const [totalBooksCount, setTotalBooksCount] = useState(0);

  // Modals Buku Fisik
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState<any>(null);
  const [isBookSubmitting, setIsBookSubmitting] = useState(false);

  // Form Buku Fisik
  const [bCode, setBCode] = useState('');
  const [bTitle, setBTitle] = useState('');
  const [bAuthor, setBAuthor] = useState('');
  const [bPublisher, setBPublisher] = useState('');
  const [bYear, setBYear] = useState('');
  const [bIsbn, setBIsbn] = useState('');
  const [bCategoryId, setBCategoryId] = useState('');
  const [bTotalStock, setBTotalStock] = useState('1');
  const [bShelf, setBShelf] = useState('');
  const [bDescription, setBDescription] = useState('');

  // Form Kelola Stok
  const [stockAdjustmentType, setStockAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [stockAdjustmentAmount, setStockAdjustmentAmount] = useState('1');
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState('');

  const fetchPhysicalCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/library/categories');
      const data = await res.json();
      if (res.ok && data.success) {
        setPhysicalCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    setIsLoadingBooks(true);
    try {
      const params = new URLSearchParams();
      if (bookSearch.trim()) params.set('q', bookSearch.trim());
      if (selectedBookCategory !== 'all') params.set('category_id', selectedBookCategory);
      if (bookStockStatus !== 'all') params.set('stock_status', bookStockStatus);
      params.set('page', String(bookPage));
      params.set('limit', '12');

      const res = await fetch(`/api/library/books?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBooks(data.books || []);
        if (data.pagination) {
          setBookTotalPages(data.pagination.totalPages || 1);
          setTotalBooksCount(data.pagination.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBooks(false);
    }
  }, [bookSearch, selectedBookCategory, bookStockStatus, bookPage]);

  // --------------------------------------------------------------------------
  // 3. KATEGORI BUKU FISIK
  // --------------------------------------------------------------------------
  const [catSearch, setCatSearch] = useState('');
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<any>(null);
  const [catFormName, setCatFormName] = useState('');
  const [catFormCode, setCatFormCode] = useState('');
  const [catFormDesc, setCatFormDesc] = useState('');
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);

  // --------------------------------------------------------------------------
  // 4. ANGGOTA PERPUSTAKAAN (READ-ONLY)
  // --------------------------------------------------------------------------
  const [members, setMembers] = useState<any[]>([]);
  const [memberTypeTab, setMemberTypeTab] = useState<'all' | 'student' | 'teacher'>('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const params = new URLSearchParams();
      params.set('type', memberTypeTab);
      if (memberSearch.trim()) params.set('q', memberSearch.trim());
      params.set('page', String(memberPage));
      params.set('limit', '20');

      const res = await fetch(`/api/library/members?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.members || []);
        if (data.pagination) {
          setMemberTotalPages(data.pagination.totalPages || 1);
          setTotalMembersCount(data.pagination.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [memberTypeTab, memberSearch, memberPage]);

  // --------------------------------------------------------------------------
  // 5. PEMINJAMAN & PENGEMBALIAN & SIRKULASI
  // --------------------------------------------------------------------------
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');
  const [loanSearch, setLoanSearch] = useState('');
  const [loanPage, setLoanPage] = useState(1);
  const [loanTotalPages, setLoanTotalPages] = useState(1);
  const [totalLoansCount, setTotalLoansCount] = useState(0);

  // Peminjaman Baru Form
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [loanMemberType, setLoanMemberType] = useState<'SISWA' | 'GURU'>('SISWA');
  const [loanSelectedMemberId, setLoanSelectedMemberId] = useState('');
  const [loanSelectedBookId, setLoanSelectedBookId] = useState('');
  const [loanDueDate, setLoanDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [loanNotes, setLoanNotes] = useState('');
  const [isLoanSubmitting, setIsLoanSubmitting] = useState(false);

  // Pengembalian & Buku Hilang Modal
  const [returnModalLoan, setReturnModalLoan] = useState<any>(null);
  const [lostModalLoan, setLostModalLoan] = useState<any>(null);
  const [lostFineAmount, setLostFineAmount] = useState('50000');
  const [lostNotes, setLostNotes] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Detail Modal
  const [detailLoan, setDetailLoan] = useState<any>(null);

  const fetchLoans = useCallback(async () => {
    setIsLoadingLoans(true);
    try {
      const params = new URLSearchParams();
      if (loanSearch.trim()) params.set('q', loanSearch.trim());
      if (loanStatusFilter !== 'all') params.set('status', loanStatusFilter);
      params.set('page', String(loanPage));
      params.set('limit', '15');

      const res = await fetch(`/api/library/loans?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLoans(data.loans || []);
        if (data.pagination) {
          setLoanTotalPages(data.pagination.totalPages || 1);
          setTotalLoansCount(data.pagination.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLoans(false);
    }
  }, [loanSearch, loanStatusFilter, loanPage]);

  // --------------------------------------------------------------------------
  // 6. STATISTIK & LAPORAN DATA
  // --------------------------------------------------------------------------
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/library/statistics');
      const data = await res.json();
      if (res.ok && data.success) {
        setStatsData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // 7. NOTIFIKASI
  // --------------------------------------------------------------------------
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoadingAnnounce, setIsLoadingAnnounce] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoadingAnnounce(true);
    try {
      const res = await fetch('/api/admin/informasi?status=published');
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAnnounce(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // 8. PROFIL KEPALA SEKOLAH (UNTUK LEMBAR TANDA TANGAN LAPORAN)
  // --------------------------------------------------------------------------
  const [principalName, setPrincipalName] = useState('Kepala Sekolah SMAN 18 Bombana');

  const fetchPrincipal = useCallback(async () => {
    try {
      const res = await fetch('/api/principal');
      const data = await res.json();
      if (res.ok && data?.name) {
        setPrincipalName(data.name);
      }
    } catch (e) {
      console.error('Error fetching principal profile:', e);
    }
  }, []);

  // --------------------------------------------------------------------------
  // INITIAL LOAD & TAB CHANGE TRIGGERS
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchDashboardData();
    fetchPhysicalCategories();
    fetchPrincipal();
  }, [fetchDashboardData, fetchPhysicalCategories, fetchPrincipal]);

  useEffect(() => {
    if (activeTab === 'katalog') fetchBooks();
    if (activeTab === 'kategori') fetchPhysicalCategories();
    if (activeTab === 'anggota') fetchMembers();
    if (activeTab === 'peminjaman' || activeTab === 'pengembalian' || activeTab === 'riwayat') fetchLoans();
    if (activeTab === 'statistik' || activeTab === 'laporan') {
      fetchStats();
      fetchPrincipal();
    }
    if (activeTab === 'notifikasi') fetchAnnouncements();
  }, [activeTab, fetchBooks, fetchPhysicalCategories, fetchMembers, fetchLoans, fetchStats, fetchPrincipal, fetchAnnouncements]);

  // --------------------------------------------------------------------------
  // HANDLERS: BUKU FISIK CRUD
  // --------------------------------------------------------------------------
  const openAddBook = () => {
    setBCode('');
    setBTitle('');
    setBAuthor('');
    setBPublisher('');
    setBYear('');
    setBIsbn('');
    setBCategoryId(physicalCategories[0]?.id || '');
    setBTotalStock('1');
    setBShelf('');
    setBDescription('');
    setShowAddBookModal(true);
  };

  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bCode.trim() || !bTitle.trim() || !bAuthor.trim() || !bCategoryId) {
      setFeedback({ type: 'error', message: 'Kode, judul, pengarang, dan kategori buku wajib diisi.' });
      return;
    }

    setIsBookSubmitting(true);
    clearFeedback();

    try {
      const res = await fetch('/api/library/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_code: bCode.trim().toUpperCase(),
          title: bTitle.trim(),
          author: bAuthor.trim(),
          category_id: bCategoryId,
          publisher: bPublisher.trim() || undefined,
          publication_year: bYear ? parseInt(bYear, 10) : undefined,
          isbn: bIsbn.trim() || undefined,
          total_stock: parseInt(bTotalStock, 10) || 1,
          shelf_location: bShelf.trim() || undefined,
          description: bDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Buku fisik baru berhasil didaftarkan.' });
        setShowAddBookModal(false);
        fetchBooks();
        fetchDashboardData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menambahkan buku.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat menyimpan buku.' });
    } finally {
      setIsBookSubmitting(false);
    }
  };

  const openEditBook = (b: any) => {
    setSelectedBook(b);
    setBCode(b.book_code);
    setBTitle(b.title);
    setBAuthor(b.author);
    setBPublisher(b.publisher || '');
    setBYear(b.publication_year ? String(b.publication_year) : '');
    setBIsbn(b.isbn || '');
    setBCategoryId(b.category_id);
    setBTotalStock(String(b.total_stock));
    setBShelf(b.shelf_location || '');
    setBDescription(b.description || '');
    setShowEditBookModal(true);
  };

  const handleEditBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    setIsBookSubmitting(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/library/books/${selectedBook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_code: bCode.trim().toUpperCase(),
          title: bTitle.trim(),
          author: bAuthor.trim(),
          category_id: bCategoryId,
          publisher: bPublisher.trim() || null,
          publication_year: bYear ? parseInt(bYear, 10) : null,
          isbn: bIsbn.trim() || null,
          total_stock: parseInt(bTotalStock, 10) || 1,
          shelf_location: bShelf.trim() || null,
          description: bDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Data buku fisik berhasil diperbarui.' });
        setShowEditBookModal(false);
        fetchBooks();
        fetchDashboardData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal memperbarui buku.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat memperbarui buku.' });
    } finally {
      setIsBookSubmitting(false);
    }
  };

  const handleStockAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    setIsBookSubmitting(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/library/books/${selectedBook.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: stockAdjustmentType === 'subtract' ? 'reduce' : 'add',
          amount: parseInt(stockAdjustmentAmount, 10) || 1,
          notes: stockAdjustmentReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Stok buku berhasil disesuaikan.' });
        setShowStockModal(false);
        fetchBooks();
        fetchDashboardData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menyesuaikan stok buku.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Gagal menyesuaikan stok buku.' });
    } finally {
      setIsBookSubmitting(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!confirmDeleteBook) return;
    setIsBookSubmitting(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/library/books/${confirmDeleteBook.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Buku berhasil dihapus dari katalog.' });
        setConfirmDeleteBook(null);
        fetchBooks();
        fetchDashboardData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menghapus buku.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat menghapus buku.' });
    } finally {
      setIsBookSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: KATEGORI FISIK CRUD
  // --------------------------------------------------------------------------
  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim() || !catFormCode.trim()) {
      setFeedback({ type: 'error', message: 'Nama dan kode kategori wajib diisi.' });
      return;
    }
    setIsCatSubmitting(true);
    clearFeedback();

    try {
      const payload = {
        name: catFormName.trim(),
        code: catFormCode.trim().toUpperCase(),
        description: catFormDesc.trim() || undefined,
      };

      const res = editingCat
        ? await fetch(`/api/library/categories/${editingCat.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/library/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: editingCat ? 'Kategori berhasil diperbarui.' : 'Kategori baru berhasil ditambahkan.',
        });
        setShowAddCatModal(false);
        setEditingCat(null);
        fetchPhysicalCategories();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal memproses kategori.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem saat menyimpan kategori.' });
    } finally {
      setIsCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!confirmDeleteCat) return;
    setIsCatSubmitting(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/library/categories/${confirmDeleteCat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Kategori berhasil dihapus.' });
        setConfirmDeleteCat(null);
        fetchPhysicalCategories();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menghapus kategori.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat menghapus kategori.' });
    } finally {
      setIsCatSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: TRANSAKSI PEMINJAMAN BARU
  // --------------------------------------------------------------------------
  const handleAddLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanSelectedMemberId || !loanSelectedBookId || !loanDueDate) {
      setFeedback({ type: 'error', message: 'Peminjam, buku, dan batas pengembalian wajib diisi.' });
      return;
    }

    setIsLoanSubmitting(true);
    clearFeedback();

    try {
      const payload: any = {
        member_type: loanMemberType,
        book_id: loanSelectedBookId,
        due_date: loanDueDate,
        notes: loanNotes.trim() || undefined,
      };
      if (loanMemberType === 'SISWA') payload.student_id = loanSelectedMemberId;
      else payload.user_id = loanSelectedMemberId;

      const res = await fetch('/api/library/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Transaksi peminjaman berhasil dicatat.' });
        setShowAddLoanModal(false);
        fetchLoans();
        fetchDashboardData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal memproses peminjaman.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem saat memproses peminjaman.' });
    } finally {
      setIsLoanSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: PENGEMBALIAN & HILANG
  // --------------------------------------------------------------------------
  const handleProcessReturn = async () => {
    if (!returnModalLoan) return;
    setIsProcessingAction(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/library/loans/${returnModalLoan.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: returnNotes.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `Pengembalian buku "${returnModalLoan.book_title}" berhasil dicatat.${
            data.fineAmount > 0 ? ` Total denda: Rp ${data.fineAmount.toLocaleString('id-ID')}` : ''
          }`,
        });
        setReturnModalLoan(null);
        setReturnNotes('');
        fetchLoans();
        fetchDashboardData();
        fetchBooks();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal memproses pengembalian.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem saat memproses pengembalian.' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleProcessLost = async () => {
    if (!lostModalLoan) return;
    setIsProcessingAction(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/library/loans/${lostModalLoan.id}/lost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fine_amount: parseInt(lostFineAmount, 10) || 0,
          notes: lostNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `Status buku hilang berhasil dicatat. Denda ganti rugi: Rp ${parseInt(
            lostFineAmount,
            10
          ).toLocaleString('id-ID')}`,
        });
        setLostModalLoan(null);
        setLostNotes('');
        fetchLoans();
        fetchDashboardData();
        fetchBooks();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal mencatat status buku hilang.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem saat memproses status hilang.' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // 14 Menus Config
  const menuItems = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'katalog', label: '2. Katalog Buku', icon: BookOpen },
    { id: 'kategori', label: '3. Kategori Buku', icon: FolderTree },
    { id: 'anggota', label: '4. Anggota Perpustakaan', icon: Users },
    { id: 'peminjaman', label: '5. Peminjaman', icon: ArrowUpRight },
    { id: 'pengembalian', label: '6. Pengembalian', icon: ArrowDownLeft },
    { id: 'riwayat', label: '7. Riwayat Sirkulasi', icon: History },
    { id: 'ebooks', label: '8. Buku Elektronik', icon: Tablet },
    { id: 'ebook-categories', label: '9. Kategori E-Book', icon: FolderTree },
    { id: 'statistik', label: '10. Statistik', icon: BarChart3 },
    { id: 'laporan', label: '11. Laporan', icon: Printer },
    { id: 'notifikasi', label: '12. Notifikasi', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-black text-emerald-600 leading-none">
                SIM Perpustakaan
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                SMAN 18 BOMBANA
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">13. Pengaturan Akun</span>
            </Link>
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">
                {user.nip ? `NIP: ${user.nip}` : `@${user.username}`} • Kepala Perpustakaan
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex gap-6">
        {/* Desktop Sidebar Navigation (14 Menus) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-4 print:hidden">
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu Perpustakaan
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as LibraryTab);
                    clearFeedback();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-100 space-y-1">
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Galeri &amp; Dokumentasi</span>
              </button>
              <Link
                href="/dashboard/profile"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                <User className="w-4 h-4" />
                <span>13. Pengaturan Akun</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden flex">
            <div className="w-72 bg-white h-full p-4 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Navigasi Menu
                </span>
                <button onClick={() => setIsMobileNavOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as LibraryTab);
                      setIsMobileNavOpen(false);
                      clearFeedback();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setIsGalleryModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Galeri &amp; Dokumentasi</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileNavOpen(false)} />
          </div>
        )}

        {/* Main Workspace Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Global Alert Notification */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm print:hidden ${
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

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Portal Perpustakaan Terpadu</span>
                  </span>
                  <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                    Selamat Datang, {user.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed">
                    Sistem otomasi perpustakaan terhubung langsung ke Master Data Siswa & Tenaga Pendidik. Sirkulasi peminjaman fisik dan e-book siap dipantau secara real-time.
                  </p>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <p className="text-xs font-semibold text-slate-500">Total Koleksi Fisik</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {dashboardData?.stats?.total_titles || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">judul</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Total stok: {dashboardData?.stats?.total_stock || 0} eksemplar
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <p className="text-xs font-semibold text-emerald-700">Stok Tersedia</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {dashboardData?.stats?.available_stock || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">buku</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dipinjam: {dashboardData?.stats?.borrowed_stock || 0} buku
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <p className="text-xs font-semibold text-blue-700">Peminjaman Aktif</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">
                    {dashboardData?.stats?.active_loans || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">transaksi</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kembali hari ini: {dashboardData?.stats?.returned_today || 0}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <p className="text-xs font-semibold text-red-700">Overdue / Terlambat</p>
                  <p className="text-2xl font-black text-red-600 mt-1">
                    {dashboardData?.stats?.overdue_loans || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">pinjaman</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Total denda: Rp {(dashboardData?.stats?.total_fines || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Alert Overdue Loans & Low Stock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Urgent Overdue Alert */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Peringatan Keterlambatan Mendesak</span>
                    </h3>
                    <span className="text-xs text-red-600 font-bold">
                      {dashboardData?.urgent_overdue_loans?.length || 0} item
                    </span>
                  </div>

                  {!dashboardData?.urgent_overdue_loans || dashboardData.urgent_overdue_loans.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      Tidak ada peminjaman yang melewati batas waktu pengembalian.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData.urgent_overdue_loans.map((ov: any) => (
                        <div
                          key={ov.id}
                          className="p-3 rounded-xl bg-red-50/60 border border-red-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-red-950">{ov.book_title}</p>
                            <p className="text-red-700 text-[11px]">
                              Peminjam: {ov.borrower_name} ({ov.member_type}) • Jatuh tempo:{' '}
                              {new Date(ov.due_date).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                            {ov.days_late} hari
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <PackagePlus className="w-4 h-4 text-amber-600" />
                      <span>Koleksi Menipis / Stok Kosong</span>
                    </h3>
                    <span className="text-xs text-amber-600 font-bold">
                      {dashboardData?.low_stock_books?.length || 0} item
                    </span>
                  </div>

                  {!dashboardData?.low_stock_books || dashboardData.low_stock_books.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      Semua stok buku dalam batas aman operasional.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData.low_stock_books.map((b: any) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{b.title}</p>
                            <p className="text-slate-500 text-[11px]">
                              Kode: {b.book_code} • Rak: {b.shelf_location || '-'}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10px]">
                            Sisa {b.available_stock}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5 Transaksi Peminjaman Terbaru */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>5 Transaksi Sirkulasi Terkini</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('riwayat')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Lihat Semua Riwayat
                  </button>
                </div>

                {!dashboardData?.recent_loans || dashboardData.recent_loans.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    Belum ada data transaksi sirkulasi yang tercatat.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">No. Transaksi</th>
                          <th className="p-2.5">Judul Buku</th>
                          <th className="p-2.5">Peminjam</th>
                          <th className="p-2.5">Tgl Pinjam</th>
                          <th className="p-2.5">Jatuh Tempo</th>
                          <th className="p-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {dashboardData.recent_loans.map((l: any) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-bold text-slate-800">{l.loan_code}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{l.book_title}</td>
                            <td className="p-2.5">
                              {l.borrower_name} ({l.member_type})
                            </td>
                            <td className="p-2.5">{new Date(l.loan_date).toLocaleDateString('id-ID')}</td>
                            <td className="p-2.5">{new Date(l.due_date).toLocaleDateString('id-ID')}</td>
                            <td className="p-2.5 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  l.status === 'Dipinjam'
                                    ? 'bg-blue-50 text-blue-700'
                                    : l.status === 'Kembali'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : l.status === 'Terlambat'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {l.status}
                              </span>
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

          {/* TAB 2: KATALOG BUKU FISIK */}
          {activeTab === 'katalog' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Katalog Buku Fisik</h2>
                  <p className="text-xs text-slate-500">Kelola master data koleksi buku cetak dan inventaris stok.</p>
                </div>
                <button
                  onClick={openAddBook}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Buku Baru</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => {
                      setBookSearch(e.target.value);
                      setBookPage(1);
                    }}
                    placeholder="Cari kode buku, judul, pengarang, atau ISBN..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedBookCategory}
                    onChange={(e) => {
                      setSelectedBookCategory(e.target.value);
                      setBookPage(1);
                    }}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="all">Semua Kategori</option>
                    {physicalCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>

                  <select
                    value={bookStockStatus}
                    onChange={(e) => {
                      setBookStockStatus(e.target.value);
                      setBookPage(1);
                    }}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="all">Semua Stok</option>
                    <option value="available">Stok Tersedia</option>
                    <option value="low">Stok Menipis (≤1)</option>
                    <option value="empty">Stok Kosong</option>
                  </select>
                </div>
              </div>

              {/* Table Buku */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {isLoadingBooks ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Memuat katalog buku...</p>
                  </div>
                ) : books.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Katalog Buku Masih Kosong</p>
                    <p className="text-xs text-slate-500 mt-1">Belum ada buku fisik yang terdaftar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Kode</th>
                          <th className="py-3.5 px-4">Judul & Pengarang</th>
                          <th className="py-3.5 px-4">Kategori</th>
                          <th className="py-3.5 px-4 text-center">Total</th>
                          <th className="py-3.5 px-4 text-center">Tersedia</th>
                          <th className="py-3.5 px-4">Rak</th>
                          <th className="py-3.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {books.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-emerald-700">{b.book_code}</td>
                            <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                              <p className="font-bold text-slate-900 line-clamp-1">{b.title}</p>
                              <p className="text-slate-500 text-[11px]">
                                {b.author} {b.publication_year ? `(${b.publication_year})` : ''}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                {b.category?.name || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold">{b.total_stock}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  b.available_stock > 1
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.available_stock === 1
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {b.available_stock}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">{b.shelf_location || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedBook(b);
                                    setStockAdjustmentType('add');
                                    setStockAdjustmentAmount('1');
                                    setStockAdjustmentReason('');
                                    setShowStockModal(true);
                                  }}
                                  className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                  title="Kelola Stok"
                                >
                                  <PackagePlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditBook(b)}
                                  className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
                                  title="Edit Buku"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteBook(b)}
                                  className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100"
                                  title="Hapus Buku"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

          {/* TAB 3: KATEGORI BUKU FISIK */}
          {activeTab === 'kategori' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Kategori Buku Fisik</h2>
                  <p className="text-xs text-slate-500">Kelola klasifikasi koleksi buku perpustakaan fisik.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCat(null);
                    setCatFormName('');
                    setCatFormCode('');
                    setCatFormDesc('');
                    setShowAddCatModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Kode</th>
                      <th className="py-3 px-4">Nama Kategori</th>
                      <th className="py-3 px-4">Deskripsi</th>
                      <th className="py-3 px-4 text-center">Jumlah Buku</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {physicalCategories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">{c.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 text-slate-500">{c.description || '-'}</td>
                        <td className="py-3 px-4 text-center font-bold">{c._count?.books || 0}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCat(c);
                                setCatFormName(c.name);
                                setCatFormCode(c.code);
                                setCatFormDesc(c.description || '');
                                setShowAddCatModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCat(c)}
                              className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ANGGOTA PERPUSTAKAAN */}
          {activeTab === 'anggota' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Anggota Perpustakaan</h2>
                  <p className="text-xs text-slate-500">
                    Terhubung langsung ke Master Data Siswa & Master Data Dewan Guru/Staf (Read-Only).
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setMemberTypeTab('all');
                      setMemberPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      memberTypeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => {
                      setMemberTypeTab('student');
                      setMemberPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      memberTypeTab === 'student' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Siswa
                  </button>
                  <button
                    onClick={() => {
                      setMemberTypeTab('teacher');
                      setMemberPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      memberTypeTab === 'teacher' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Guru / Staf
                  </button>
                </div>
              </div>

              {/* Search Member */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setMemberPage(1);
                    }}
                    placeholder="Cari anggota berdasarkan nama, NIS, atau NIP..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Member Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {isLoadingMembers ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Memuat data anggota...</p>
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Tidak Ada Anggota Ditemukan</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Nama Lengkap</th>
                          <th className="py-3 px-4">Tipe Anggota</th>
                          <th className="py-3 px-4">Identitas (NIS/NIP)</th>
                          <th className="py-3 px-4">Kelas / Jabatan</th>
                          <th className="py-3 px-4 text-center">Pinjaman Aktif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {members.map((m) => (
                          <tr key={`${m.member_type}-${m.id}`} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.member_type === 'SISWA'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {m.member_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs">{m.identifier}</td>
                            <td className="py-3 px-4 text-slate-600">{m.class_name || m.role_label || '-'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-emerald-700">{m.active_loans_count || 0}</span>
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

          {/* TAB 5, 6, 7: SIRKULASI (PEMINJAMAN, PENGEMBALIAN, RIWAYAT) */}
          {(activeTab === 'peminjaman' || activeTab === 'pengembalian' || activeTab === 'riwayat') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {activeTab === 'peminjaman'
                      ? 'Pencatatan Peminjaman Buku'
                      : activeTab === 'pengembalian'
                      ? 'Pengembalian & Denda'
                      : 'Riwayat Seluruh Sirkulasi'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Otomasi pencatatan peminjaman, pengembalian, status hilang, dan denda.
                  </p>
                </div>
                {activeTab === 'peminjaman' && (
                  <button
                    onClick={() => {
                      fetchMembers();
                      fetchBooks();
                      setShowAddLoanModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Pinjaman Baru</span>
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loanSearch}
                    onChange={(e) => {
                      setLoanSearch(e.target.value);
                      setLoanPage(1);
                    }}
                    placeholder="Cari transaksi berdasarkan kode pinjam, nama, atau judul buku..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={loanStatusFilter}
                    onChange={(e) => {
                      setLoanStatusFilter(e.target.value);
                      setLoanPage(1);
                    }}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="all">Semua Status</option>
                    <option value="Dipinjam">Dipinjam</option>
                    <option value="Kembali">Kembali</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Hilang">Hilang</option>
                  </select>
                </div>
              </div>

              {/* Loans Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {isLoadingLoans ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Memuat transaksi peminjaman...</p>
                  </div>
                ) : loans.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Belum Ada Transaksi Peminjaman</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">No. Transaksi</th>
                          <th className="py-3 px-4">Judul Buku</th>
                          <th className="py-3 px-4">Peminjam</th>
                          <th className="py-3 px-4">Tgl Pinjam</th>
                          <th className="py-3 px-4">Jatuh Tempo</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {loans.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">{l.loan_code}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{l.book?.title}</td>
                            <td className="py-3 px-4">
                              {l.borrower_name}{' '}
                              <span className="text-[10px] text-slate-400">({l.member_type})</span>
                            </td>
                            <td className="py-3 px-4">{new Date(l.loan_date).toLocaleDateString('id-ID')}</td>
                            <td className="py-3 px-4">{new Date(l.due_date).toLocaleDateString('id-ID')}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  l.status === 'Dipinjam'
                                    ? 'bg-blue-100 text-blue-800'
                                    : l.status === 'Kembali'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : l.status === 'Terlambat'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-200 text-slate-800'
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {l.status === 'Dipinjam' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setReturnModalLoan(l);
                                        setReturnNotes('');
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold"
                                    >
                                      Kembalikan
                                    </button>
                                    <button
                                      onClick={() => {
                                        setLostModalLoan(l);
                                        setLostFineAmount('50000');
                                        setLostNotes('');
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold"
                                    >
                                      Hilang
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setDetailLoan(l)}
                                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                                  title="Detail"
                                >
                                  <FileText className="w-4 h-4" />
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

          {/* TAB 8: BUKU ELEKTRONIK */}
          {activeTab === 'ebooks' && <EBookManagementView user={user} />}

          {/* TAB 9: KATEGORI E-BOOK */}
          {activeTab === 'ebook-categories' && <EBookManagementView user={user} />}

          {/* TAB 10: STATISTIK */}
          {activeTab === 'statistik' && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Statistik & Analisis Koleksi</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 10 Buku Paling Sering Dipinjam */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Top 10 Buku Terpopuler</span>
                  </h3>
                  {!statsData?.popularBooks || statsData.popularBooks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">Belum ada data peminjaman buku.</p>
                  ) : (
                    <div className="space-y-3">
                      {statsData.popularBooks.map((b: any, idx: number) => (
                        <div key={b.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 max-w-xs truncate">
                            <span className="w-5 h-5 rounded-full bg-slate-100 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">{b.title}</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-700">{b._count?.loans || 0}x pinjam</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Distribusi Kategori Buku */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-blue-600" />
                    <span>Distribusi Berdasarkan Kategori</span>
                  </h3>
                  {!statsData?.categoryDistribution || statsData.categoryDistribution.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">Belum ada kategori buku.</p>
                  ) : (
                    <div className="space-y-2">
                      {statsData.categoryDistribution.map((cat: any) => (
                        <div key={cat.id} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{cat.name}</span>
                          <span className="font-mono font-bold text-slate-900">{cat._count?.books || 0} judul</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: LAPORAN (PRINT FRIENDLY) */}
          {activeTab === 'laporan' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between print:hidden">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Laporan & Rekapitulasi</h2>
                  <p className="text-xs text-slate-500">Cetak rekapitulasi inventaris dan sirkulasi perpustakaan.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan</span>
                </button>
              </div>

              {/* Lembar Laporan Cetak */}
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-2xs space-y-8 text-slate-900">
                {/* Kop Sekolah Dinamis */}
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">
                    PEMERINTAH PROVINSI SULAWESI TENGGARA
                  </h2>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    SMA NEGERI 18 BOMBANA
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    LAPORAN STATUS DAN SIRKULASI PERPUSTAKAAN SEKOLAH
                  </p>
                </div>

                {/* Ringkasan Angka */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-500">Total Judul Buku</p>
                    <p className="text-lg font-bold">{dashboardData?.stats?.total_titles || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-500">Total Stok Fisik</p>
                    <p className="text-lg font-bold">{dashboardData?.stats?.total_stock || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-500">Buku Dipinjam</p>
                    <p className="text-lg font-bold">{dashboardData?.stats?.borrowed_stock || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-500">Total Denda Tercatat</p>
                    <p className="text-lg font-bold">
                      Rp {(dashboardData?.stats?.total_fines || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Tanda Tangan */}
                <div className="pt-12 flex justify-between text-xs">
                  <div className="text-center space-y-16">
                    <p>Mengetahui,<br />Kepala Sekolah</p>
                    <p className="font-bold underline">{principalName}</p>
                  </div>
                  <div className="text-center space-y-16">
                    <p>Bombana, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br />Kepala Perpustakaan</p>
                    <div>
                      <p className="font-bold underline">{user.name}</p>
                      {user.nip && <p className="text-[10px] text-slate-500">NIP. {user.nip}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: NOTIFIKASI */}
          {activeTab === 'notifikasi' && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Notifikasi & Pengumuman Sekolah</h2>
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
                {isLoadingAnnounce ? (
                  <p className="text-xs text-slate-400">Memuat pengumuman...</p>
                ) : announcements.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Belum ada pengumuman resmi yang diterbitkan.</p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {a.category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(a.published_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: TAMBAH BUKU BARU                                            */}
      {/* ------------------------------------------------------------------- */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-extrabold text-slate-900">Tambah Buku Fisik Baru</h3>
              <button onClick={() => setShowAddBookModal(false)} className="p-1 rounded-lg hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBookSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Kode Buku *</label>
                  <input
                    type="text"
                    required
                    value={bCode}
                    onChange={(e) => setBCode(e.target.value)}
                    placeholder="BIO-001"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Kategori *</label>
                  <select
                    required
                    value={bCategoryId}
                    onChange={(e) => setBCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {physicalCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Judul Buku *</label>
                <input
                  type="text"
                  required
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="Judul lengkap buku"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Pengarang *</label>
                  <input
                    type="text"
                    required
                    value={bAuthor}
                    onChange={(e) => setBAuthor(e.target.value)}
                    placeholder="Nama pengarang"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={bPublisher}
                    onChange={(e) => setBPublisher(e.target.value)}
                    placeholder="Penerbit"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    value={bYear}
                    onChange={(e) => setBYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Total Stok *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bTotalStock}
                    onChange={(e) => setBTotalStock(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Rak Lokasi</label>
                  <input
                    type="text"
                    value={bShelf}
                    onChange={(e) => setBShelf(e.target.value)}
                    placeholder="Rak A-1"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">ISBN</label>
                <input
                  type="text"
                  value={bIsbn}
                  onChange={(e) => setBIsbn(e.target.value)}
                  placeholder="978-..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={bDescription}
                  onChange={(e) => setBDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBookSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: FORM PEMINJAMAN BARU                                        */}
      {/* ------------------------------------------------------------------- */}
      {showAddLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Peminjaman Buku Baru</h3>
              <button onClick={() => setShowAddLoanModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLoanSubmit} className="space-y-4">
              <div>
                <label className="block font-bold mb-1">Tipe Peminjam *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="mtype"
                      checked={loanMemberType === 'SISWA'}
                      onChange={() => {
                        setLoanMemberType('SISWA');
                        setLoanSelectedMemberId('');
                      }}
                    />
                    <span>Siswa</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="mtype"
                      checked={loanMemberType === 'GURU'}
                      onChange={() => {
                        setLoanMemberType('GURU');
                        setLoanSelectedMemberId('');
                      }}
                    />
                    <span>Guru / Tenaga Pendidik</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Pilih Anggota *</label>
                <select
                  required
                  value={loanSelectedMemberId}
                  onChange={(e) => setLoanSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="">-- Pilih {loanMemberType === 'SISWA' ? 'Siswa' : 'Guru'} --</option>
                  {members
                    .filter((m) => (loanMemberType === 'SISWA' ? m.member_type === 'SISWA' : m.member_type === 'GURU'))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.identifier})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Pilih Buku *</label>
                <select
                  required
                  value={loanSelectedBookId}
                  onChange={(e) => setLoanSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="">-- Pilih Buku Tersedia --</option>
                  {books
                    .filter((b) => b.available_stock > 0)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (Sisa: {b.available_stock})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Jatuh Tempo Pengembalian *</label>
                <input
                  type="date"
                  required
                  value={loanDueDate}
                  onChange={(e) => setLoanDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Catatan Peminjaman</label>
                <textarea
                  rows={2}
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLoanModal(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoanSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  Simpan Pinjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: PENGEMBALIAN BUKU                                           */}
      {/* ------------------------------------------------------------------- */}
      {returnModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Pengembalian Buku</h3>
            <p className="text-slate-600">
              Buku: <strong>{returnModalLoan.book?.title}</strong>
              <br />
              Peminjam: <strong>{returnModalLoan.borrower_name}</strong>
              <br />
              Jatuh Tempo:{' '}
              <strong>{new Date(returnModalLoan.due_date).toLocaleDateString('id-ID')}</strong>
            </p>
            <div>
              <label className="block font-bold mb-1">Catatan Pengembalian (Opsional)</label>
              <textarea
                rows={2}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Kondisi buku baik / rusak ringan..."
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnModalLoan(null)}
                className="px-4 py-2 border rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleProcessReturn}
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
              >
                Proses Pengembalian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: BUKU HILANG                                                 */}
      {/* ------------------------------------------------------------------- */}
      {lostModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="text-base font-extrabold text-slate-900 text-red-600">
              Pencatatan Buku Hilang
            </h3>
            <p className="text-slate-600">
              Buku: <strong>{lostModalLoan.book?.title}</strong>
              <br />
              Peminjam: <strong>{lostModalLoan.borrower_name}</strong>
            </p>
            <div>
              <label className="block font-bold mb-1">Denda Ganti Rugi (Rp)</label>
              <input
                type="number"
                min="0"
                value={lostFineAmount}
                onChange={(e) => setLostFineAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Catatan</label>
              <textarea
                rows={2}
                value={lostNotes}
                onChange={(e) => setLostNotes(e.target.value)}
                placeholder="Alasan hilang..."
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLostModalLoan(null)}
                className="px-4 py-2 border rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleProcessLost}
                className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl"
              >
                Tetapkan Hilang
              </button>
            </div>
          </div>
        </div>
      )}

      <GalleryManagementModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        userRole={user.role}
      />
    </div>
  );
}
