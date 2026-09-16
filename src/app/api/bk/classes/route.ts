import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        grade: true,
        academic_year: true,
        homeroom_teacher: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, classes });
  } catch (error: any) {
    console.error('Error in /api/bk/classes:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar kelas.' },
      { status: 500 }
    );
  }
}

// POST: Buat kelas baru (Admin atau BK)
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'administrator',
    'guru_bk',
    'kepala_sekolah',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, grade, academic_year, homeroom_teacher_id } = body;

    if (!name || !name.trim() || !grade) {
      return NextResponse.json(
        { error: 'Nama kelas dan tingkat wajib diisi.' },
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        grade: grade.trim(),
        academic_year: academic_year?.trim() || '2026/2027',
        homeroom_teacher_id: homeroom_teacher_id || null,
      },
    });

    return NextResponse.json({ success: true, class: newClass }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/bk/classes:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat data kelas.' },
      { status: 500 }
    );
  }
}
