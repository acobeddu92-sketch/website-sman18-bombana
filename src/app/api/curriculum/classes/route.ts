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
  const classId = searchParams.get('class_id')?.trim();

  try {
    // Jika ada request detail kelas spesifik beserta daftar siswa aktif
    if (classId) {
      const targetClass = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          homeroom_teacher: {
            select: { id: true, name: true, email: true, username: true },
          },
          students: {
            where: { is_active: true },
            select: {
              id: true, // student_id sebagai identifier unik
              name: true,
              nis: true,
              nisn: true,
              gender: true,
              is_active: true,
              created_at: true,
            },
            orderBy: { name: 'asc' },
          },
          schedules: {
            include: {
              teacher: { select: { id: true, name: true } },
            },
            orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
          },
          _count: {
            select: {
              students: { where: { is_active: true } },
              schedules: true,
            },
          },
        },
      });

      if (!targetClass) {
        return NextResponse.json(
          { error: 'Kelas tidak ditemukan.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, class: targetClass });
    }

    // Ambil seluruh daftar kelas beserta ringkasan jumlah siswa aktif
    const classes = await prisma.class.findMany({
      include: {
        homeroom_teacher: {
          select: { id: true, name: true, email: true, username: true },
        },
        _count: {
          select: {
            students: { where: { is_active: true } },
            schedules: true,
          },
        },
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/classes:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data kelas dan rombel.' },
      { status: 500 }
    );
  }
}
