import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getPpdbSettings } from '@/lib/ppdb-settings';
import PpdbPortalClient, { AnnouncementItem } from '@/components/public/PpdbPortalClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PPDB - Penerimaan Peserta Didik Baru | SMA Negeri 18 Bombana',
  description:
    'Portal resmi Penerimaan Peserta Didik Baru (PPDB) SMA Negeri 18 Bombana. Akses informasi jadwal, persyaratan, formulir pendaftaran, upload berkas, dan layanan bantuan.',
};

export default async function PpdbPublicPage() {
  // 1. Ambil pengaturan PPDB
  const settings = getPpdbSettings();

  // 2. Ambil profil sekolah untuk kontak
  let schoolProfile = null;
  try {
    schoolProfile = await prisma.schoolProfile.findFirst({
      select: {
        school_name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
      },
    });
  } catch (err) {
    console.error('Error fetching school profile in PPDB page:', err);
  }

  // 3. Ambil pengumuman berkategori PPDB dari database
  let announcements: AnnouncementItem[] = [];
  try {
    const rawAnnouncements = await prisma.announcement.findMany({
      where: {
        is_published: true,
        category: 'ppdb',
      },
      orderBy: { published_at: 'desc' },
    });

    announcements = rawAnnouncements.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      image: item.image,
      category: item.category,
      published_at: item.published_at.toISOString(),
    }));
  } catch (err) {
    console.error('Error fetching announcements in PPDB page:', err);
  }

  return (
    <PpdbPortalClient
      initialSettings={settings}
      announcements={announcements}
      schoolProfile={schoolProfile}
    />
  );
}
