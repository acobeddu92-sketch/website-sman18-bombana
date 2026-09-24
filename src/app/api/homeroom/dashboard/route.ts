import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyHomeroomAccess } from '@/lib/homeroom-auth';
import { getActivePrincipal } from '@/lib/principal';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  const now = new Date();
  const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
  const currentMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

  // 1. Verifikasi Akses & Kepemilikan Rombel Wali Kelas (Anti-IDOR)
  const { session, errorResponse, homeroomClass, assignedClasses, hasNoClass } =
    await verifyHomeroomAccess(request, requestedClassId);

  if (errorResponse) return errorResponse;

  // Jika guru belum ditetapkan sebagai wali kelas untuk rombel manapun
  if (hasNoClass || !homeroomClass) {
    const [activePrincipal, principalProfile, schoolProfile] = await Promise.all([
      getActivePrincipal(),
      prisma.principalProfile.findFirst().catch(() => null),
      prisma.schoolProfile.findFirst().catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      hasHomeroomClass: false,
      message: 'Anda belum memiliki kelas sebagai wali kelas.',
      assignedClasses: [],
      stats: null,
      principal: {
        name: activePrincipal?.name || 'Belum ditetapkan',
        position: principalProfile?.position || 'Kepala Sekolah',
        nip: activePrincipal?.nip
          ? (activePrincipal.nip.startsWith('NIP') ? activePrincipal.nip : `NIP. ${activePrincipal.nip}`)
          : 'NIP. -',
      },
      schoolProfile: {
        school_name: schoolProfile?.school_name || 'SMA NEGERI 18 BOMBANA',
        address:
          schoolProfile?.address ||
          'Jl. Poros Mata Osu - Bombana, Desa Wia wia, Kecamatan Matausu Kabupaten Bombana, Sulawesi Tenggara 93772',
        phone: schoolProfile?.phone || '+62 82298808246',
        email: schoolProfile?.email || 'info@sman18bombana.sch.id',
        website: schoolProfile?.website || 'https://website-sman18-bombana.vercel.app/',
      },
    });
  }

  try {
    const classId = homeroomClass.id;

    // 2. Kueri Data Siswa Kelas & Profil Sekolah/Kepala Sekolah
    const [
      totalStudents,
      maleCount,
      femaleCount,
      activePrincipal,
      principalProfile,
      schoolProfile,
    ] = await Promise.all([
      prisma.student.count({
        where: { class_id: classId, is_active: true },
      }),
      prisma.student.count({
        where: { class_id: classId, is_active: true, gender: 'L' },
      }),
      prisma.student.count({
        where: { class_id: classId, is_active: true, gender: 'P' },
      }),
      getActivePrincipal(),
      prisma.principalProfile.findFirst().catch(() => null),
      prisma.schoolProfile.findFirst().catch(() => null),
    ]);

    // 3. Kueri Rekap Kehadiran Kelas Periode Ini
    const attendanceHeaders = await prisma.monthlyAttendance.findMany({
      where: {
        class_id: classId,
        year: currentYear,
        month: currentMonth,
      },
      include: {
        items: {
          select: {
            present: true,
            sick: true,
            permission: true,
            unexcused: true,
            total: true,
          },
        },
      },
    });

    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;

    for (const h of attendanceHeaders) {
      for (const it of h.items) {
        hadir += it.present || 0;
        sakit += it.sick || 0;
        izin += it.permission || 0;
        alpa += it.unexcused || 0;
      }
    }

    const totalAttendanceRecords = hadir + sakit + izin + alpa;
    const attendanceRate =
      totalAttendanceRecords > 0
        ? Math.round((hadir / totalAttendanceRecords) * 100)
        : 0;

    // 4. Kueri Kasus Pelanggaran Siswa Kelas Ini
    const [totalViolations, activeViolations, resolvedViolations, recentViolations] =
      await Promise.all([
        prisma.pelanggaranSiswa.count({
          where: { student: { class_id: classId } },
        }),
        prisma.pelanggaranSiswa.count({
          where: {
            student: { class_id: classId },
            status: { in: ['Dilaporkan', 'Dalam Penanganan', 'Perlu Tindak Lanjut'] },
          },
        }),
        prisma.pelanggaranSiswa.count({
          where: {
            student: { class_id: classId },
            status: 'Selesai',
          },
        }),
        prisma.pelanggaranSiswa.findMany({
          where: { student: { class_id: classId } },
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            student: {
              select: { id: true, name: true, nis: true, gender: true },
            },
            reporter: { select: { id: true, name: true } },
            handler: { select: { id: true, name: true } },
            _count: { select: { follow_ups: true } },
          },
        }),
      ]);

    // 5. Siswa yang Membutuhkan Perhatian Khusus (Pelanggaran Aktif atau Alpa/Sakit berulang)
    const studentsWithActiveViolations = await prisma.student.findMany({
      where: {
        class_id: classId,
        is_active: true,
        violations: {
          some: {
            status: { in: ['Dilaporkan', 'Dalam Penanganan', 'Perlu Tindak Lanjut'] },
          },
        },
      },
      select: {
        id: true,
        name: true,
        nis: true,
        gender: true,
        _count: {
          select: {
            violations: {
              where: {
                status: { in: ['Dilaporkan', 'Dalam Penanganan', 'Perlu Tindak Lanjut'] },
              },
            },
          },
        },
      },
    });

    const needAttentionCount = studentsWithActiveViolations.length;

    // 6. Pengumuman / Agenda Sekolah Terkini
    const announcements = await prisma.announcement.findMany({
      where: { is_published: true },
      orderBy: { published_at: 'desc' },
      take: 4,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        published_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      hasHomeroomClass: true,
      currentUser: {
        id: session.id,
        name: session.name,
        role: session.role,
        nip: homeroomClass.homeroom_teacher?.nip || null,
      },
      homeroomClass: {
        id: homeroomClass.id,
        name: homeroomClass.name,
        grade: homeroomClass.grade,
        academic_year: homeroomClass.academic_year,
        homeroom_teacher: homeroomClass.homeroom_teacher,
      },
      assignedClasses: assignedClasses.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        academic_year: c.academic_year,
        studentCount: c._count?.students || 0,
      })),
      stats: {
        totalStudents,
        maleCount,
        femaleCount,
        hadir,
        sakit,
        izin,
        alpa,
        attendanceRate,
        totalViolations,
        activeViolations,
        resolvedViolations,
        needAttentionCount,
      },
      period: {
        year: currentYear,
        month: currentMonth,
      },
      principal: {
        name: activePrincipal?.name || 'Belum ditetapkan',
        position: principalProfile?.position || 'Kepala Sekolah',
        nip: activePrincipal?.nip
          ? (activePrincipal.nip.startsWith('NIP') ? activePrincipal.nip : `NIP. ${activePrincipal.nip}`)
          : 'NIP. -',
      },
      schoolProfile: {
        school_name: schoolProfile?.school_name || 'SMA NEGERI 18 BOMBANA',
        address:
          schoolProfile?.address ||
          'Jl. Poros Mata Osu - Bombana, Desa Wia wia, Kecamatan Matausu Kabupaten Bombana, Sulawesi Tenggara 93772',
        phone: schoolProfile?.phone || '+62 82298808246',
        email: schoolProfile?.email || 'info@sman18bombana.sch.id',
        website: schoolProfile?.website || 'https://website-sman18-bombana.vercel.app/',
      },
      recentViolations,
      needAttentionStudents: studentsWithActiveViolations,
      announcements,
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/dashboard:', error);
    return NextResponse.json(
      { error: 'Gagal memuat dashboard wali kelas.' },
      { status: 500 }
    );
  }
}
