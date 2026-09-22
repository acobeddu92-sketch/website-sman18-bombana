import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
    'kepala_sekolah',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const [teachers, classes, schedules, materials, assignments, studentsCount] =
      await Promise.all([
        prisma.user.findMany({
          where: {
            role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] },
            is_active: true,
          },
          select: {
            id: true,
            name: true,
            role: true,
            _count: {
              select: {
                teaching_schedules: true,
                learning_materials: true,
                assignments: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.class.findMany({
          include: {
            homeroom_teacher: { select: { id: true, name: true } },
            _count: {
              select: {
                students: { where: { is_active: true } },
                schedules: true,
                assignments: true,
                learning_materials: true,
              },
            },
          },
          orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        }),
        prisma.teachingSchedule.findMany({
          select: {
            id: true,
            subject: true,
            day: true,
            teacher_id: true,
            class_id: true,
          },
        }),
        prisma.learningMaterial.findMany({
          select: {
            id: true,
            subject: true,
            teacher_id: true,
            class_id: true,
          },
        }),
        prisma.assignment.findMany({
          select: {
            id: true,
            subject: true,
            teacher_id: true,
            class_id: true,
            is_active: true,
          },
        }),
        prisma.student.count({ where: { is_active: true } }),
      ]);

    // 1. Rekapitulasi Global
    const totals = {
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalStudents: studentsCount,
      totalSchedules: schedules.length,
      totalMaterials: materials.length,
      totalAssignments: assignments.length,
    };

    // 2. Distribusi Jadwal Berdasarkan Hari
    const dayDistribution: Record<string, number> = {
      Senin: 0,
      Selasa: 0,
      Rabu: 0,
      Kamis: 0,
      Jumat: 0,
      Sabtu: 0,
    };
    for (const s of schedules) {
      if (dayDistribution[s.day] !== undefined) {
        dayDistribution[s.day] += 1;
      }
    }

    // 3. Distribusi Mata Pelajaran Terbanyak
    const subjectCountMap = new Map<string, number>();
    for (const s of schedules) {
      const subj = s.subject.trim();
      subjectCountMap.set(subj, (subjectCountMap.get(subj) || 0) + 1);
    }
    const topSubjects = Array.from(subjectCountMap.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. Rekapitulasi Beban per Guru
    const teacherBreakdown = teachers.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      scheduleCount: t._count.teaching_schedules,
      materialCount: t._count.learning_materials,
      assignmentCount: t._count.assignments,
    }));

    // 5. Rekapitulasi per Rombel / Kelas
    const classBreakdown = classes.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      homeroomTeacher: c.homeroom_teacher?.name || 'Belum Ditugaskan',
      studentCount: c._count.students,
      scheduleCount: c._count.schedules,
      assignmentCount: c._count.assignments,
      materialCount: c._count.learning_materials,
    }));

    return NextResponse.json({
      success: true,
      totals,
      dayDistribution,
      topSubjects,
      teacherBreakdown,
      classBreakdown,
    });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/statistics:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekapitulasi data akademik.' },
      { status: 500 }
    );
  }
}
