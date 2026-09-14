'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Lightbulb,
  Sprout,
  Smile,
} from 'lucide-react';

interface DailyMsgItem {
  id: string;
  content: string;
  category: string;
  author: string | null;
  is_active: boolean;
  created_at: string;
}

export default function KataHarianManagementPage() {
  const [messages, setMessages] = useState<DailyMsgItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailyMsgItem | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    category: 'motivasi',
    author: '',
    is_active: true,
  });

  // Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (categoryFilter !== 'all') query.set('category', categoryFilter);
      if (searchTerm.trim()) query.set('search', searchTerm.trim());

      const res = await fetch(`/api/admin/kata-harian?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setTotalCount(data.totalCount || 0);
        setActiveCount(data.activeCount || 0);
      } else {
        setErrorMsg(data.error || 'Gagal memuat daftar kata harian.');
      }
    } catch (e) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      content: '',
      category: 'motivasi',
      author: 'Anonim',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: DailyMsgItem) => {
    setEditingItem(item);
    setFormData({
      content: item.content,
      category: item.category,
      author: item.author || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (editingItem) {
        // Edit
        const res = await fetch(`/api/admin/kata-harian/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg('Kata harian berhasil diperbarui.');
          setIsModalOpen(false);
          fetchMessages();
        } else {
          setErrorMsg(data.error || 'Gagal memperbarui kata harian.');
        }
      } else {
        // Create
        const res = await fetch('/api/admin/kata-harian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg('Kata harian baru berhasil ditambahkan.');
          setIsModalOpen(false);
          fetchMessages();
        } else {
          setErrorMsg(data.error || 'Gagal menambahkan kata harian.');
        }
      }
    } catch (e) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    }
  };

  const handleToggleActive = async (item: DailyMsgItem) => {
    try {
      const res = await fetch(`/api/admin/kata-harian/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (e) {
      setErrorMsg('Gagal mengubah status kata.');
    }
  };

  const handleDelete = async (item: DailyMsgItem) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kata harian ini?')) return;
    try {
      const res = await fetch(`/api/admin/kata-harian/${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg('Kata harian berhasil dihapus.');
        fetchMessages();
      }
    } catch (e) {
      setErrorMsg('Gagal menghapus kata.');
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'pantun':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Smile className="w-3 h-3" />
            <span>Pantun Jenaka</span>
          </span>
        );
      case 'nasehat':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <Sprout className="w-3 h-3" />
            <span>Nasehat</span>
          </span>
        );
      case 'motivasi':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <Lightbulb className="w-3 h-3" />
            <span>Motivasi</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquareQuote className="w-7 h-7 text-emerald-600" />
            <span>Koleksi Kata-Kata Harian</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Total koleksi: <strong>{totalCount}</strong> kata (<strong>{activeCount}</strong> aktif). Ditampilkan otomatis & konsisten setiap hari di Beranda.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Kata Baru</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter & Search */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kutipan, kata-kata..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">Semua Kategori</option>
            <option value="motivasi">Motivasi</option>
            <option value="nasehat">Nasehat</option>
            <option value="pantun">Pantun Jenaka</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Daftar Kartu Kata */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Memuat koleksi kata harian...
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Tidak ada kata harian yang ditemukan.
            </div>
          ) : (
            messages.slice(0, 100).map((item, idx) => (
              <div key={item.id} className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    {getCategoryBadge(item.category)}
                    {item.is_active ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line italic">
                    &ldquo;{item.content}&rdquo;
                  </p>
                  <p className="text-xs text-slate-400">
                    Penulis / Sumber: <strong>{item.author || 'Anonim'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      item.is_active
                        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Tambah / Edit Kata */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Kata Harian' : 'Tambah Kata Harian'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="motivasi">Motivasi</option>
                  <option value="nasehat">Nasehat</option>
                  <option value="pantun">Pantun Jenaka</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Kutipan / Pantun
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Ketik kata motivasi, nasehat, atau bait pantun..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penulis / Sumber
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Contoh: B.J. Habibie / Guru Teladan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modal_kata_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="modal_kata_active" className="text-xs font-medium text-slate-700">
                  Status Kata Aktif
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
