'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Folder, Calendar } from 'lucide-react';
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
  album?: { title: string } | null;
  created_at: string | Date;
}

interface GalleryClientProps {
  albums: Album[];
  photos: Photo[];
}

export default function GalleryClient({ albums, photos }: GalleryClientProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');

  const filteredPhotos =
    selectedAlbum === 'all'
      ? photos
      : photos.filter((p) => p.album_id === selectedAlbum);

  return (
    <div className="space-y-8">
      {/* Tab Filter Album */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedAlbum('all')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            selectedAlbum === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          Semua Foto ({photos.length})
        </button>

        {albums.map((alb) => (
          <button
            key={alb.id}
            type="button"
            onClick={() => setSelectedAlbum(alb.id)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              selectedAlbum === alb.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>{alb.title}</span>
            {alb._count?.photos !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {alb._count.photos}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid Foto */}
      {filteredPhotos.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Belum ada foto dalam album ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPhotos.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col"
            >
              {/* Box Gambar */}
              <div className="relative h-60 bg-slate-100 overflow-hidden">
                <SafeImage
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-800 text-white p-4">
                      <ImageIcon className="w-10 h-10 mb-2 text-emerald-300" />
                      <span className="text-xs font-semibold">Foto Galeri</span>
                    </div>
                  }
                />
                {item.album && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-xs shadow-xs">
                    {item.album.title}
                  </span>
                )}
              </div>

              {/* Konten Foto */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-emerald-800 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
