import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import PrincipalView from '@/components/dashboard/PrincipalView';
import TeacherView from '@/components/dashboard/TeacherView';
import BKView from '@/components/dashboard/BKView';
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

  // Ambil data akun User yang sedang login langsung dari tabel User Prisma (satu sumber data konsisten)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      email: true,
      is_active: true,
    },
  });

  if (!dbUser || !dbUser.is_active) {
    redirect('/login?error=Akun Anda tidak aktif atau tidak ditemukan.');
  }

  const currentUser = {
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    role: dbUser.role as any,
    email: dbUser.email,
  };

  // Ambil data komprehensif untuk Kepala Sekolah
  if (session.role === 'kepala_sekolah') {
    let dashboardData = {
      stats: {
        totalTeachers: 0,
        totalStudents: 0,
        totalWaliKelas: 0,
        totalActivities: 0,
        totalAnnouncements: 0,
      },
      schoolProfile: null as any,
      principalProfile: null as any,
      announcements: [] as any[],
      galleryAlbums: [] as any[],
      teachers: [] as any[],
      students: [] as any[],
    };

    try {
      const [
        totalTeachers,
        totalStudents,
        totalAnnouncements,
        schoolProfile,
        principalProfile,
        announcements,
        galleryAlbums,
        teachers,
        students,
      ] = await Promise.all([
        prisma.user.count({ where: { role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] }, is_active: true } }),
        prisma.user.count({ where: { role: 'siswa', is_active: true } }),
        prisma.announcement.count({ where: { is_published: true } }),
        prisma.schoolProfile.findFirst(),
        prisma.principalProfile.findFirst(),
        prisma.announcement.findMany({
          orderBy: { published_at: 'desc' },
          take: 20,
        }),
        prisma.galleryAlbum.findMany({
          include: { photos: true },
          orderBy: { created_at: 'desc' },
          take: 12,
        }),
        prisma.user.findMany({
          where: { role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] } },
          select: { id: true, name: true, email: true, username: true, is_active: true, created_at: true },
          orderBy: { name: 'asc' },
        }),
        prisma.user.findMany({
          where: { role: 'siswa' },
          select: { id: true, name: true, email: true, username: true, is_active: true, created_at: true },
          orderBy: { name: 'asc' },
          take: 100,
        }),
      ]);

      const totalActivities =
        galleryAlbums.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0) +
        announcements.filter((a) => a.category === 'agenda').length;

      const totalWaliKelas = Math.min(totalTeachers, 6);

      dashboardData = {
        stats: {
          totalTeachers,
          totalStudents,
          totalWaliKelas,
          totalActivities,
          totalAnnouncements,
        },
        schoolProfile: schoolProfile
          ? {
              ...schoolProfile,
              updated_at: schoolProfile.updated_at.toISOString(),
            }
          : null,
        principalProfile: principalProfile
          ? {
              ...principalProfile,
              updated_at: principalProfile.updated_at.toISOString(),
            }
          : null,
        announcements: announcements.map((a) => ({
          ...a,
          published_at: a.published_at.toISOString(),
          created_at: a.created_at.toISOString(),
          updated_at: a.updated_at.toISOString(),
        })),
        galleryAlbums: galleryAlbums.map((alb) => ({
          ...alb,
          created_at: alb.created_at.toISOString(),
          updated_at: alb.updated_at.toISOString(),
          photos: alb.photos.map((p) => ({
            ...p,
            created_at: p.created_at.toISOString(),
            updated_at: p.updated_at.toISOString(),
          })),
        })),
        teachers: teachers.map((t) => ({
          ...t,
          created_at: t.created_at.toISOString(),
        })),
        students: students.map((s) => ({
          ...s,
          created_at: s.created_at.toISOString(),
        })),
      };
    } catch (e) {
      console.error('Error fetching principal dashboard data:', e);
    }

    return <PrincipalView user={currentUser} data={dashboardData} />;
  }

  if (session.role === 'guru_bk') {
    return <BKView user={currentUser} />;
  }

  if (session.role === 'guru_mapel' || session.role === 'guru') {
    return <TeacherView user={currentUser} />;
  }

  // Default: siswa
  return <StudentView user={currentUser} />;
}
