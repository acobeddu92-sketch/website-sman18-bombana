'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { UserRole } from '@/lib/constants';
import {
  GraduationCap,
  Award,
  Calendar,
  BookOpen,
  Sparkles,
  User,
  Search,
  RefreshCw,
  Loader2,
  Download,
  Eye,
  X,
  FileText,
  Tablet,
  Home,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    email: string;
  };
}

interface StudentEBook {
  id: string;
  title: string;
  author: string;
  publisher?: string | null;
  year?: number | null;
  isbn?: string | null;
  description?: string | null;
  mime_type: string;
  cover_image?: string | null;
  download_count: number;
  category: {
    id: string;
    name: string;
    code: string;
  };
}

export default function StudentView({ user }: Props) {
  const [activeTab, setActiveTab] = useState<'beranda' | 'ebooks'>('beranda');

  // E-Book Data States
  const [ebooks, setEbooks] = useState<StudentEBook[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingEbooks, setIsLoadingEbooks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Reader Modal
  const [readerEBook, setReaderEBook] = useState<StudentEBook | null>(null);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/library/ebook-categories');
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  }, []);

  // Fetch Published E-Books (Server automatically restricts siswa to published only)
  const fetchEbooks = useCallback(async () => {
    setIsLoadingEbooks(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory !== 'all') params.set('category_id', selectedCategory);
      params.set('limit', '50');

      const res = await fetch(`/api/library/ebooks?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEbooks(data.ebooks || []);
      } else {
        setEbooks([]);
      }
    } catch (e) {
      console.error('Error fetching ebooks for student:', e);
      setEbooks([]);
    } finally {
      setIsLoadingEbooks(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (activeTab === 'ebooks') {
      fetchCategories();
      fetchEbooks();
    }
  }, [activeTab, fetchCategories, fetchEbooks]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Profil Siswa */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-8 h-8 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  Peserta Didik
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                NIS / Username: @{user.username} • {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/dashboard/profile"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <User className="w-4 h-4" />
              <span>Profil Saya</span>
            </Link>
            <a
              href="/"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Lihat Website
            </a>
            <LogoutButton />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('beranda')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'beranda'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Beranda Belajar</span>
          </button>

          <button
            onClick={() => setActiveTab('ebooks')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ebooks'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Buku Elektronik (E-Book)</span>
          </button>
        </div>

        {/* TAB 1: BERANDA SISWA (EXISTING FEATURES PRESERVED) */}
        {activeTab === 'beranda' && (
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Portal Siswa SMAN 18 Bombana</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Halo {user.name}, Semangat Belajar Hari Ini!
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Jadilah siswa yang senantiasa menjaga adab, tekun menimba ilmu pengetahuan, dan aktif menjaga kebersihan lingkungan sekolah. Akun siswa Anda telah terhubung ke basis data resmi SMA Negeri 18 Bombana.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                <Calendar className="w-5 h-5 text-emerald-700 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Jadwal Pelajaran</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Akses jadwal pelajaran mingguan dan agenda kelas (Tahap Berikutnya).
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/60">
                <BookOpen className="w-5 h-5 text-teal-700 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Tugas & Materi</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unduh materi pembelajaran dan pantau batas pengumpulan tugas (Tahap Berikutnya).
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                <Award className="w-5 h-5 text-amber-700 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Capaian & Rapor</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Laporan nilai akademik dan catatan prestasi peserta didik (Tahap Berikutnya).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUKU ELEKTRONIK SISWA */}
        {activeTab === 'ebooks' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul e-book, mata pelajaran, atau penulis..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="p-2 text-xs rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                  title="Reset Filter"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* E-Books Grid Cards */}
            {isLoadingEbooks ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">Memuat katalog buku elektronik...</p>
              </div>
            ) : ebooks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 text-slate-400 space-y-2">
                <Tablet className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-800">Belum Ada Buku Elektronik yang Terbit</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Perpustakaan digital sedang mempersiapkan koleksi buku bacaan terbitan untuk peserta didik. Silakan periksa kembali berkala.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ebooks.map((eb) => (
                  <div
                    key={eb.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover Image Container */}
                      <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                        {eb.cover_image ? (
                          <SafeImage
                            src={eb.cover_image}
                            alt={eb.title}
                            className="w-full h-full object-cover"
                            fallback={<BookOpen className="w-10 h-10 text-slate-400" />}
                          />
                        ) : (
                          <BookOpen className="w-10 h-10 text-slate-400" />
                        )}
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-900/80 text-white backdrop-blur-xs">
                          {eb.mime_type.includes('pdf') ? 'PDF' : 'EPUB'}
                        </span>
                      </div>

                      {/* Content Info */}
                      <div className="p-4 space-y-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {eb.category.name}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                          {eb.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {eb.author} {eb.year ? `(${eb.year})` : ''}
                        </p>
                        {eb.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {eb.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => setReaderEBook(eb)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Baca Buku</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODAL: PROTECTED E-BOOK READER UNTUK SISWA                        */}
        {/* ----------------------------------------------------------------- */}
        {readerEBook && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
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
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

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
                      <h4 className="text-lg font-bold text-white">Buku Format EPUB</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Buku ini berformat EPUB. Unduh dan baca berkas melalui aplikasi pembaca buku di gawai Anda.
                      </p>
                    </div>
                    <a
                      href={`/api/library/ebooks/${readerEBook.id}/read`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition"
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
    </div>
  );
}
