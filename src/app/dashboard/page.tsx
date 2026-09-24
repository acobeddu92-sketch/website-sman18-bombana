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
import PembinaView from '@/components/dashboard/PembinaView';
import CurriculumView from '@/components/dashboard/CurriculumView';
import StudentAffairsView from '@/components/dashboard/StudentAffairsView';
import HomeroomView from '@/components/dashboard/HomeroomView';

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
      nip: true,
      is_active: true,
      force_password_change: true,
    },
  });

  if (!dbUser || !dbUser.is_active) {
    redirect('/login?error=Akun Anda tidak aktif atau tidak ditemukan.');
  }

  // Jika akun diwajibkan ganti password, cegah akses ke dashboard dan arahkan langsung ke profil
  if (dbUser.force_password_change) {
    redirect('/dashboard/profile?forceChange=true');
  }

  const currentUser = {
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    role: dbUser.role as any,
    email: dbUser.email,
    nip: dbUser.nip,
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
      classes: [] as any[],
    };

    try {
      const [
        totalTeachers,
        totalStudents,
        totalAnnouncements,
        totalWaliKelas,
        schoolProfile,
        principalProfile,
        announcements,
        galleryAlbums,
        teachers,
        rawStudents,
        rawClasses,
      ] = await Promise.all([
        prisma.user.count({ where: { role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] }, is_active: true } }),
        prisma.student.count({ where: { is_active: true } }),
        prisma.announcement.count({ where: { is_published: true } }),
        prisma.class.count({ where: { homeroom_teacher_id: { not: null } } }),
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
        prisma.student.findMany({
          where: { is_active: true },
          include: { class: true },
          orderBy: { name: 'asc' },
          take: 100,
        }),
        prisma.class.findMany({
          include: {
            homeroom_teacher: { select: { id: true, name: true } },
            _count: { select: { students: { where: { is_active: true } } } },
          },
          orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        }),
      ]);

      const students = rawStudents.map((s) => ({
        id: s.id,
        name: s.name,
        username: s.nisn || s.nis || 'siswa',
        email: s.class ? `Kelas ${s.class.name}` : '-',
        is_active: s.is_active,
        created_at: s.created_at,
      }));

      const totalActivities =
        galleryAlbums.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0) +
        announcements.filter((a) => a.category === 'agenda').length;

      dashboardData = {
        stats: {
          totalTeachers,
          totalStudents,
          totalWaliKelas,
          totalActivities,
          totalAnnouncements,
        },
        classes: rawClasses.map((c) => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          academic_year: c.academic_year,
          homeroom_teacher: c.homeroom_teacher,
          studentsCount: c._count?.students || 0,
        })),
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

  if (session.role === 'pembina_osis') {
    return <PembinaView user={currentUser} type="osis" />;
  }

  if (session.role === 'pembina_pramuka') {
    return <PembinaView user={currentUser} type="pramuka" />;
  }

  if (session.role === 'wakasek_kurikulum') {
    return <CurriculumView user={currentUser} />;
  }

  if (session.role === 'wakasek_kesiswaan') {
    return <StudentAffairsView user={currentUser} />;
  }

  if (session.role === 'wali_kelas') {
    return <HomeroomView user={currentUser} />;
  }

  if (
    [
      'guru_mapel',
      'guru',
      'kepala_perpustakaan',
    ].includes(session.role)
  ) {
    return <TeacherView user={currentUser} />;
  }

  // Default: siswa
  return <StudentView user={currentUser} />;
}
