import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME, GALLERY_CREATOR_ROLES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import GalleryDashboardClient from './GalleryDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardGaleriPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login?error=Silakan login terlebih dahulu.');
  }

  const session = await verifySessionToken(token);
  if (!session) {
    redirect('/login?error=Sesi telah berakhir, silakan login kembali.');
  }

  // Role siswa dilarang mengelola galeri
  if (session.role === 'siswa' || !GALLERY_CREATOR_ROLES.includes(session.role as any)) {
    redirect('/dashboard?error=Akses ditolak: Anda tidak memiliki izin untuk mengelola galeri.');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, username: true, role: true, email: true },
  });

  return (
    <GalleryDashboardClient
      user={dbUser || { id: session.id, name: session.name || 'Pengguna', role: session.role, username: session.username, email: '' }}
    />
  );
}
