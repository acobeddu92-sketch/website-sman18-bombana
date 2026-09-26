'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import GalleryManagementModal from '@/components/dashboard/GalleryManagementModal';
import { ArrowLeft, Image as ImageIcon, Sparkles, FolderPlus, UploadCloud } from 'lucide-react';

interface Props {
  user: {
    id: string;
    name: string;
    role: string;
    username: string;
    email: string;
  };
}

export default function GalleryDashboardClient({ user }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-slate-900">
                Pusat Pengelolaan Galeri &amp; Dokumentasi
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Kelola Galeri</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Info */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-sm">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Pengelolaan Dokumentasi Foto &amp; Album Sekolah
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mt-2 leading-relaxed">
          Sebagai <strong>{user.name}</strong> ({user.role}), Anda memiliki hak untuk membuat album kegiatan baru, mengunggah dokumentasi foto aktivitas sekolah, dan mengelola koleksi galeri.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Buka Panel Galeri &amp; Unggah Foto</span>
          </button>
          <Link
            href="/galeri"
            target="_blank"
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Lihat Galeri Publik</span>
          </Link>
        </div>
      </main>

      <GalleryManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userRole={user.role}
      />
    </div>
  );
}
