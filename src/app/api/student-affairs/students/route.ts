import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim() || '';
  const classId = searchParams.get('class_id')?.trim() || '';
  const grade = searchParams.get('grade')?.trim() || '';

  try {
    const whereClause: any = {
      is_active: true,
    };

    if (classId && classId !== 'all') {
      whereClause.class_id = classId;
    }

    if (grade && grade !== 'all') {
      whereClause.class = {
        ...(whereClause.class || {}),
        grade: grade,
      };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, classes] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        orderBy: [
          { class: { name: 'asc' } },
          { name: 'asc' },
        ],
        select: {
          id: true,
          nis: true,
          nisn: true,
          name: true,
          gender: true,
          is_active: true,
          parent_name: true,
          address: true,
          class_id: true,
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              academic_year: true,
              homeroom_teacher: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              violations: true,
              attendance_items: true,
            },
          },
        },
      }),
      prisma.class.findMany({
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          grade: true,
          academic_year: true,
          academic_year_id: true,
          is_active: true,
          academic_year_rel: { select: { id: true, name: true, is_active: true } },
          homeroom_teacher: { select: { id: true, name: true } },
          _count: { select: { students: { where: { is_active: true } } } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      count: students.length,
      students,
      classes,
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/students:', error);
    return NextResponse.json(
      { error: 'Gagal memuat master data siswa.' },
      { status: 500 }
    );
  }
}
