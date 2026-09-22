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
  const search = searchParams.get('q')?.trim() || '';
  const role = searchParams.get('role')?.trim() || 'all';

  try {
    const whereClause: any = {
      role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] },
      is_active: true,
    };

    if (role && role !== 'all') {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const teachers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        teaching_schedules: {
          select: {
            id: true,
            subject: true,
            day: true,
            start_time: true,
            end_time: true,
            class: { select: { id: true, name: true, grade: true } },
          },
        },
        homeroom_classes: {
          select: { id: true, name: true, grade: true, academic_year: true },
        },
        learning_materials: {
          select: { id: true, title: true, subject: true, created_at: true },
        },
        _count: {
          select: {
            teaching_schedules: true,
            learning_materials: true,
            assignments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Ringkasan Pembagian Tugas Guru
    const totalTeachers = teachers.length;
    const teachersWithAssignments = teachers.filter(
      (t) => t.teaching_schedules.length > 0
    );
    const teachersWithoutAssignments = teachers.filter(
      (t) => t.teaching_schedules.length === 0
    );

    // Hitung total jam pelajaran / slot jadwal yang terdaftar
    const totalScheduleSlots = teachers.reduce(
      (sum, t) => sum + t.teaching_schedules.length,
      0
    );

    return NextResponse.json({
      success: true,
      count: totalTeachers,
      teachersWithTasksCount: teachersWithAssignments.length,
      teachersWithoutTasksCount: teachersWithoutAssignments.length,
      totalScheduleSlots,
      teachers,
    });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/teachers:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data tenaga pendidik kurikulum.' },
      { status: 500 }
    );
  }
}
