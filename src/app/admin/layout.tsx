import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login?error=Silakan login dengan akun Administrator.');
  }

  const session = await verifySessionToken(token);
  if (!session || session.role !== 'administrator') {
    redirect('/dashboard');
  }

  let profile = null;
  try {
    profile = await prisma.schoolProfile.findFirst({ select: { logo: true } });
  } catch (err) {
    console.error(err);
  }

  return (
    <AdminLayoutClient adminUser={session} logo={profile?.logo}>
      {children}
    </AdminLayoutClient>
  );
}
