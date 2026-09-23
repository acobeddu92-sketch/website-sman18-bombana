import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { getActivePrincipal } from '@/lib/principal';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
    'kepala_sekolah',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const [teachers, classes, schedules, materials, announcements, activePrincipal, principalContent] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] },
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.class.findMany({
        include: {
          homeroom_teacher: { select: { id: true, name: true } },
          _count: {
            select: { students: { where: { is_active: true } } },
          },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
      prisma.teachingSchedule.findMany({
        include: {
          class: { select: { id: true, name: true, grade: true } },
          teacher: { select: { id: true, name: true } },
        },
        orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
      }),
      prisma.learningMaterial.findMany({
        select: {
          id: true,
          teacher_id: true,
          class_id: true,
          subject: true,
          created_at: true,
        },
      }),
      prisma.announcement.findMany({
        where: { is_published: true },
        orderBy: { published_at: 'desc' },
        take: 10,
      }),
      getActivePrincipal(),
      prisma.principalProfile.findFirst().catch(() => null),
    ]);

    // 1. Perhitungan Indikator Utama
    const totalTeachers = teachers.length;
    const totalClasses = classes.length;
    const totalActiveSchedules = schedules.length;

    // Guru yang sudah memiliki jadwal
    const teachersWithScheduleIds = new Set(schedules.map((s) => s.teacher_id));
    const teachersWithoutSchedule = teachers.filter(
      (t) => !teachersWithScheduleIds.has(t.id)
    ).length;

    // Kelas yang belum memiliki jadwal (atau belum terjadwal)
    const classesWithScheduleIds = new Set(schedules.map((s) => s.class_id));
    const classesWithoutSchedule = classes.filter(
      (c) => !classesWithScheduleIds.has(c.id)
    ).length;

    // Kelas tanpa wali kelas
    const classesWithoutHomeroom = classes.filter(
      (c) => !c.homeroom_teacher_id
    ).length;

    // Guru yang sudah mengunggah perangkat ajar
    const teachersWithMaterialIds = new Set(materials.map((m) => m.teacher_id));
    const teachersWithMaterialCount = teachers.filter((t) =>
      teachersWithMaterialIds.has(t.id)
    ).length;
    const materialsPercentage =
      totalTeachers > 0
        ? Math.round((teachersWithMaterialCount / totalTeachers) * 100)
        : 0;

    // Masalah Akademik: Dihitung secara transparan dari (Guru tanpa jadwal + Kelas tanpa jadwal + Kelas tanpa wali kelas)
    const academicIssuesCount =
      teachersWithoutSchedule + classesWithoutSchedule + classesWithoutHomeroom;

    // 2. Status Quick Monitoring Akademik (Berdasarkan Data Nyata)
    // Jadwal Pembelajaran
    let scheduleStatus: 'Normal' | 'Perlu Perhatian' | 'Belum Lengkap' | 'Belum Tersedia' = 'Normal';
    if (totalClasses === 0 || totalActiveSchedules === 0) {
      scheduleStatus = 'Belum Tersedia';
    } else if (classesWithoutSchedule > 0) {
      scheduleStatus = 'Belum Lengkap';
    } else if (teachersWithoutSchedule > 0) {
      scheduleStatus = 'Perlu Perhatian';
    }

    // Pembagian Tugas Guru
    let assignmentStatus: 'Normal' | 'Perlu Perhatian' | 'Belum Lengkap' | 'Belum Tersedia' = 'Normal';
    if (totalTeachers === 0) {
      assignmentStatus = 'Belum Tersedia';
    } else if (teachersWithoutSchedule === totalTeachers) {
      assignmentStatus = 'Belum Lengkap';
    } else if (teachersWithoutSchedule > 0) {
      assignmentStatus = 'Perlu Perhatian';
    }

    // Perangkat Pembelajaran
    let materialStatus: 'Normal' | 'Perlu Perhatian' | 'Belum Lengkap' | 'Belum Tersedia' = 'Normal';
    if (totalTeachers === 0) {
      materialStatus = 'Belum Tersedia';
    } else if (materials.length === 0) {
      materialStatus = 'Belum Lengkap';
    } else if (materialsPercentage < 70) {
      materialStatus = 'Perlu Perhatian';
    }

    // Kelas & Rombel
    let classStatus: 'Normal' | 'Perlu Perhatian' | 'Belum Lengkap' | 'Belum Tersedia' = 'Normal';
    if (totalClasses === 0) {
      classStatus = 'Belum Tersedia';
    } else if (classesWithoutHomeroom > 0) {
      classStatus = 'Perlu Perhatian';
    }

    // Masalah Akademik
    let issueStatus: 'Normal' | 'Perlu Perhatian' | 'Belum Lengkap' | 'Belum Tersedia' = 'Normal';
    if (academicIssuesCount > 0) {
      issueStatus = 'Perlu Perhatian';
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalTeachers,
        totalClasses,
        totalActiveSchedules,
        teachersWithoutSchedule,
        classesWithoutSchedule,
        classesWithoutHomeroom,
        materialsCount: materials.length,
        teachersWithMaterialCount,
        materialsPercentage,
        academicIssuesCount,
      },
      quickMonitoring: {
        schedule: {
          label: 'Jadwal Pembelajaran',
          status: scheduleStatus,
          detail: `${totalActiveSchedules} jadwal terdaftar di ${classesWithScheduleIds.size}/${totalClasses} rombel`,
        },
        teachingAssignment: {
          label: 'Pembagian Tugas Guru',
          status: assignmentStatus,
          detail: `${teachersWithScheduleIds.size}/${totalTeachers} guru telah memiliki jadwal mengajar`,
        },
        learningMaterials: {
          label: 'Perangkat Pembelajaran',
          status: materialStatus,
          detail: `${materials.length} perangkat dari ${teachersWithMaterialCount}/${totalTeachers} guru (${materialsPercentage}%)`,
        },
        classesCondition: {
          label: 'Kondisi Kelas & Rombel',
          status: classStatus,
          detail: `${totalClasses} rombel aktif, ${classesWithoutHomeroom} tanpa wali kelas`,
        },
        academicIssues: {
          label: 'Masalah Akademik',
          status: issueStatus,
          detail:
            academicIssuesCount === 0
              ? 'Seluruh parameter kurikulum dalam kondisi tertib'
              : `${academicIssuesCount} catatan perlu koordinasi tindak lanjut`,
        },
      },
      recentAnnouncements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.category,
        published_at: a.published_at.toISOString(),
      })),
      principal: {
        name: activePrincipal?.name || 'Belum ditetapkan',
        position: principalContent?.position || 'Belum ditetapkan',
        nip: activePrincipal?.nip
          ? activePrincipal.nip.startsWith('NIP')
            ? activePrincipal.nip
            : `NIP. ${activePrincipal.nip}`
          : 'NIP. -',
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/dashboard:', error);
    return NextResponse.json(
      { error: 'Gagal memuat ringkasan dashboard kurikulum.' },
      { status: 500 }
    );
  }
}
