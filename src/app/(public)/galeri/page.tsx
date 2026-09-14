import React from 'react';
import { prisma } from '@/lib/prisma';
import GalleryClient from '@/components/public/GalleryClient';

export const dynamic = 'force-dynamic';

export default async function GaleriPage() {
  let albums: any[] = [];
  let photos: any[] = [];

  try {
    [albums, photos] = await Promise.all([
      prisma.galleryAlbum.findMany({
        include: {
          _count: {
            select: { photos: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.galleryPhoto.findMany({
        include: {
          album: {
            select: { title: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);
  } catch (err) {
    console.error(err);
  }

  // Fallback jika belum ada foto
  if (photos.length === 0) {
    photos = [
      {
        id: '1',
        title: 'Upacara Bendera Hari Pendidikan',
        description: 'Semangat kebangsaan dan kedisiplinan seluruh siswa dan guru.',
        image: '/images/gallery-1.jpg',
        album_id: albums[0]?.id || null,
        album: albums[0] ? { title: albums[0].title } : null,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Penghijauan Sekolah Hijau (Green School)',
        description: 'Aksi penanaman bibit pohon buah dan tanaman peneduh.',
        image: '/images/gallery-2.jpg',
        album_id: albums[0]?.id || null,
        album: albums[0] ? { title: albums[0].title } : null,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Laboratorium Komputer & Sains',
        description: 'Fasilitas pembelajaran modern untuk literasi digital.',
        image: '/images/gallery-3.jpg',
        album_id: albums[1]?.id || null,
        album: albums[1] ? { title: albums[1].title } : null,
        created_at: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'Juara Lomba Debat & Olimpiade Sains',
        description: 'Pencapaian gemilang siswa-siswi SMAN 18 Bombana.',
        image: '/images/gallery-4.jpg',
        album_id: albums[2]?.id || null,
        album: albums[2] ? { title: albums[2].title } : null,
        created_at: new Date().toISOString(),
      },
    ];
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Halaman */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            Dokumentasi Sekolah
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Galeri Album &amp; Kegiatan
          </h1>
          <p className="text-base text-slate-600 mt-3">
            Rekam jejak kebersamaan, aksi lingkungan hidup, dan pencapaian civitas akademika SMA Negeri 18 Bombana.
          </p>
          <div className="w-16 h-1 bg-emerald-600 rounded-full mx-auto mt-4" />
        </div>

        {/* Gallery Client Component */}
        <GalleryClient albums={albums} photos={photos} />
      </div>
    </div>
  );
}
