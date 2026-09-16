import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'guru_bk',
    'kepala_sekolah',
    'administrator',
    'wakasek_kesiswaan',
    'guru_mapel',
    'guru',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim() || '';
  const classId = searchParams.get('class_id')?.trim() || '';

  try {
    const whereClause: any = {
      is_active: true,
    };

    if (classId && classId !== 'all') {
      whereClause.class_id = classId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        nis: true,
        nisn: true,
        name: true,
        gender: true,
        class_id: true,
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            homeroom_teacher: { select: { name: true } },
          },
        },
        _count: {
          select: {
            violations: true,
            counselings: true,
          },
        },
      },
      orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    console.error('Error in /api/bk/students:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data siswa.' },
      { status: 500 }
    );
  }
}

// POST: Tambah data siswa baru (khusus Guru BK atau Administrator)
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'guru_bk',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, nis, nisn, gender, class_id, parent_name, parent_phone, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama siswa wajib diisi.' },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        nis: nis?.trim() || null,
        nisn: nisn?.trim() || null,
        gender: gender || null,
        class_id: class_id || null,
        parent_name: parent_name?.trim() || null,
        parent_phone: parent_phone?.trim() || null,
        address: address?.trim() || null,
        is_active: true,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating student in /api/bk/students:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan data siswa.' },
      { status: 500 }
    );
  }
}
