import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import PrincipalView from '@/components/dashboard/PrincipalView';
import TeacherView from '@/components/dashboard/TeacherView';
import StudentView from '@/components/dashboard/StudentView';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login?error=Silakan login terlebih dahulu.');
  }

  const session = await verifySessionToken(token);
  if (!session) {
    redirect('/login?error=Sesi telah berakhir, silakan login kembali.');
  }

  // Jika Administrator masuk ke /dashboard, arahkan ke /admin
  if (session.role === 'administrator') {
    redirect('/admin');
  }

  // Ambil data statistik untuk Kepala Sekolah
  let stats = {
    totalTeachers: 0,
    totalStudents: 0,
    totalAnnouncements: 0,
  };

  if (session.role === 'kepala_sekolah') {
    try {
      const [totalTeachers, totalStudents, totalAnnouncements] = await Promise.all([
        prisma.user.count({ where: { role: 'guru', is_active: true } }),
        prisma.user.count({ where: { role: 'siswa', is_active: true } }),
        prisma.announcement.count({ where: { is_published: true } }),
      ]);
      stats = { totalTeachers, totalStudents, totalAnnouncements };
    } catch (e) {
      console.error(e);
    }
  }

  // Render view berdasarkan role yang telah diverifikasi dari session database
  if (session.role === 'kepala_sekolah') {
    return <PrincipalView user={session} stats={stats} />;
  }

  if (session.role === 'guru') {
    return <TeacherView user={session} />;
  }

  // Default: siswa
  return <StudentView user={session} />;
}
