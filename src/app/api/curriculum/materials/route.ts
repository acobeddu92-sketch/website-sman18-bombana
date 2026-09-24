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

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id')?.trim();
  const classId = searchParams.get('class_id')?.trim();
  const period = searchParams.get('period')?.trim();
  const search = searchParams.get('q')?.trim() || '';

  try {
    const whereClause: any = {};

    if (teacherId && teacherId !== 'all') {
      whereClause.teacher_id = teacherId;
    }

    if (classId && classId !== 'all') {
      whereClause.class_id = classId;
    }

    if (period && period !== 'all') {
      const now = new Date();
      if (period === '7d') {
        whereClause.created_at = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (period === '30d') {
        whereClause.created_at = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      } else if (period === '90d') {
        whereClause.created_at = { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
      }
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { teacher: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [materials, allTeachers, allClasses] = await Promise.all([
      prisma.learningMaterial.findMany({
        where: whereClause,
        include: {
          teacher: { select: { id: true, name: true, email: true, username: true } },
          class: { select: { id: true, name: true, grade: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.findMany({
        where: {
          role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] },
          is_active: true,
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.class.findMany({
        select: { id: true, name: true, grade: true },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
    ]);

    // Hitung indikator kelengkapan perangkat ajar
    const totalTeachersCount = allTeachers.length;
    const teachersWithMaterialIds = new Set(materials.map((m) => m.teacher_id));
    const teachersWithMaterialsCount = allTeachers.filter((t) =>
      teachersWithMaterialIds.has(t.id)
    ).length;
    const teachersWithoutMaterialsCount =
      totalTeachersCount - teachersWithMaterialsCount;

    return NextResponse.json({
      success: true,
      count: materials.length,
      materials,
      summary: {
        totalMaterials: materials.length,
        totalTeachers: totalTeachersCount,
        teachersWithMaterialsCount,
        teachersWithoutMaterialsCount,
      },
      filterOptions: {
        teachers: allTeachers,
        classes: allClasses,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/materials:', error);
    return NextResponse.json(
      { error: 'Gagal memuat perangkat pembelajaran.' },
      { status: 500 }
    );
  }
}
