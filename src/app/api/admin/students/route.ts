import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil master data siswa untuk Administrator
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim() || '';
  const classId = searchParams.get('class_id')?.trim() || '';
  const academicYear = searchParams.get('academic_year')?.trim() || '';
  const isActiveParam = searchParams.get('is_active');

  try {
    const whereClause: any = {};

    if (isActiveParam !== null && isActiveParam !== 'all') {
      whereClause.is_active = isActiveParam === 'true';
    }

    if (classId && classId !== 'all') {
      whereClause.class_id = classId;
    }

    if (academicYear && academicYear !== 'all') {
      whereClause.class = {
        ...(whereClause.class || {}),
        academic_year: academicYear,
      };
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
      include: {
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
                email: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            attendance_items: true,
            violations: true,
            counselings: true,
          },
        },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/students:', error);
    return NextResponse.json(
      { error: 'Gagal memuat master data siswa.' },
      { status: 500 }
    );
  }
}

// POST: Tambah satu data siswa oleh Administrator
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const {
      name,
      nis,
      nisn,
      gender,
      class_id,
      parent_name,
      parent_phone,
      address,
      is_active = true,
    } = body;

    // 1. Validasi Kolom Wajib
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama siswa wajib diisi.' },
        { status: 400 }
      );
    }

    if (!class_id) {
      return NextResponse.json(
        { error: 'Kelas wajib dipilih dari master kelas.' },
        { status: 400 }
      );
    }

    // 2. Pastikan kelas benar-benar ada di tabel master Class
    const targetClass = await prisma.class.findUnique({
      where: { id: class_id },
      include: { homeroom_teacher: { select: { id: true, name: true } } },
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: 'Kelas yang dipilih tidak ditemukan dalam database.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const cleanNIS = nis?.trim() || null;
    const cleanNISN = nisn?.trim() || null;

    // 3. Pencegahan Duplikasi NIS / NISN
    if (cleanNIS) {
      const existingNIS = await prisma.student.findUnique({
        where: { nis: cleanNIS },
      });
      if (existingNIS) {
        return NextResponse.json(
          { error: `NIS "${cleanNIS}" sudah terdaftar atas nama siswa: ${existingNIS.name}.` },
          { status: 400 }
        );
      }
    }

    if (cleanNISN) {
      const existingNISN = await prisma.student.findUnique({
        where: { nisn: cleanNISN },
      });
      if (existingNISN) {
        return NextResponse.json(
          { error: `NISN "${cleanNISN}" sudah terdaftar atas nama siswa: ${existingNISN.name}.` },
          { status: 400 }
        );
      }
    }

    // 4. Pencegahan Duplikasi Nama pada Kelas yang Sama
    const duplicateInClass = await prisma.student.findFirst({
      where: {
        class_id,
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });

    if (duplicateInClass) {
      return NextResponse.json(
        {
          error: `Siswa bernama "${trimmedName}" sudah terdaftar di kelas ${targetClass.name}. Harap gunakan pembeda nama atau periksa data kembali.`,
        },
        { status: 400 }
      );
    }

    // 5. Simpan ke database
    const newStudent = await prisma.student.create({
      data: {
        name: trimmedName,
        nis: cleanNIS,
        nisn: cleanNISN,
        gender: gender || null,
        class_id,
        parent_name: parent_name?.trim() || null,
        parent_phone: parent_phone?.trim() || null,
        address: address?.trim() || null,
        is_active: Boolean(is_active),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academic_year: true,
            homeroom_teacher: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Siswa "${newStudent.name}" berhasil ditambahkan ke kelas ${targetClass.name}.`,
        student: newStudent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/students:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan data siswa.' },
      { status: 500 }
    );
  }
}
