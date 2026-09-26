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
        where: { is_published: true },
        include: {
          _count: {
            select: { photos: { where: { is_published: true } } },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.galleryPhoto.findMany({
        where: {
          is_published: true,
          album: { is_published: true },
        },
        include: {
          album: {
            select: { title: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);
  } catch (err) {
    console.error('Error fetching gallery data for public page:', err);
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
