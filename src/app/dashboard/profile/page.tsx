import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import UserProfileView from '@/components/dashboard/UserProfileView';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login?error=Silakan login terlebih dahulu.');
  }

  const session = await verifySessionToken(token);
  if (!session) {
    redirect('/login?error=Sesi telah berakhir, silakan login kembali.');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      is_active: true,
      nip: true,
      nik: true,
      photo: true,
      phone: true,
      gender: true,
      birth_place: true,
      birth_date: true,
      address: true,
      force_password_change: true,
      created_at: true,
    },
  });

  if (!dbUser || !dbUser.is_active) {
    redirect('/login?error=Akun Anda tidak aktif atau tidak ditemukan.');
  }

  const forcedMode =
    Boolean(dbUser.force_password_change) || searchParams?.forceChange === 'true';

  const initialUser = {
    ...dbUser,
    birth_date: dbUser.birth_date ? dbUser.birth_date.toISOString() : null,
    created_at: dbUser.created_at.toISOString(),
  };

  return <UserProfileView initialUser={initialUser} forcedMode={forcedMode} />;
}
