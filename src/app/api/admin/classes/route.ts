import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'administrator',
    'kepala_sekolah',
    'wakasek_kurikulum',
    'wakasek_kesiswaan',
    'guru_bk',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const [classes, waliKelasUsers, teachers] = await Promise.all([
      prisma.class.findMany({
        include: {
          homeroom_teacher: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              students: { where: { is_active: true } },
            },
          },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
      prisma.user.findMany({
        where: {
          role: 'wali_kelas',
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
      prisma.user.findMany({
        where: {
          role: { in: ['guru_mapel', 'guru', 'wali_kelas'] },
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
    ]);

    // Ambil daftar tahun ajaran unik
    const academicYears = Array.from(new Set(classes.map((c) => c.academic_year)));

    return NextResponse.json({
      success: true,
      classes,
      waliKelasUsers,
      allTeachers: teachers,
      academicYears,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/classes:', error);
    return NextResponse.json(
      { error: 'Gagal memuat master data kelas.' },
      { status: 500 }
    );
  }
}

// POST: Buat kelas baru oleh Administrator jika belum ada kelas
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
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

    const trimmedName = name.trim();
    const finalYear = academic_year?.trim() || '2026/2027';

    // Cek duplikasi nama kelas pada tahun ajaran yang sama
    const existing = await prisma.class.findUnique({
      where: {
        name_academic_year: {
          name: trimmedName,
          academic_year: finalYear,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Kelas ${trimmedName} untuk tahun ajaran ${finalYear} sudah ada.` },
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name: trimmedName,
        grade: grade.trim(),
        academic_year: finalYear,
        homeroom_teacher_id: homeroom_teacher_id || null,
      },
      include: {
        homeroom_teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Kelas ${newClass.name} berhasil dibuat.`,
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/classes:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat data kelas.' },
      { status: 500 }
    );
  }
}
