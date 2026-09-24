import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyHomeroomAccess, verifyStudentBelongsToHomeroom } from '@/lib/homeroom-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();
  const search = searchParams.get('q')?.trim();
  const category = searchParams.get('category')?.trim();
  const status = searchParams.get('status')?.trim();
  const dateFrom = searchParams.get('date_from')?.trim();
  const dateTo = searchParams.get('date_to')?.trim();

  // 1. Verifikasi Akses & Kepemilikan Rombel (Anti-IDOR)
  const { errorResponse, homeroomClass, hasNoClass } = await verifyHomeroomAccess(
    request,
    requestedClassId
  );

  if (errorResponse) return errorResponse;

  if (hasNoClass || !homeroomClass) {
    return NextResponse.json({
      success: true,
      hasHomeroomClass: false,
      message: 'Anda belum memiliki kelas sebagai wali kelas.',
      violations: [],
      countsByStatus: {},
    });
  }

  try {
    const classId = homeroomClass.id;
    const whereClause: any = {
      student: { class_id: classId },
    };

    if (category && category !== 'all') {
      whereClause.violation_type = { contains: category, mode: 'insensitive' };
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) whereClause.date.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    if (search) {
      whereClause.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { nis: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [violations, rawCounts] = await Promise.all([
      prisma.pelanggaranSiswa.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        include: {
          student: {
            select: { id: true, name: true, nis: true, gender: true },
          },
          reporter: { select: { id: true, name: true } },
          handler: { select: { id: true, name: true } },
          _count: { select: { follow_ups: true } },
        },
      }),
      prisma.pelanggaranSiswa.groupBy({
        by: ['status'],
        where: { student: { class_id: classId } },
        _count: { _all: true },
      }),
    ]);

    const countsByStatus: Record<string, number> = {
      Dilaporkan: 0,
      'Dalam Penanganan': 0,
      'Perlu Tindak Lanjut': 0,
      Selesai: 0,
    };

    for (const c of rawCounts) {
      countsByStatus[c.status] = c._count._all;
    }

    return NextResponse.json({
      success: true,
      hasHomeroomClass: true,
      homeroomClass: {
        id: homeroomClass.id,
        name: homeroomClass.name,
        grade: homeroomClass.grade,
      },
      violations,
      totalCount: violations.length,
      countsByStatus,
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/violations:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar pelanggaran kelas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();

  // 1. Verifikasi Akses & Kepemilikan Rombel
  const { session, errorResponse, homeroomClass, hasNoClass } = await verifyHomeroomAccess(
    request,
    requestedClassId
  );

  if (errorResponse) return errorResponse;

  if (hasNoClass || !homeroomClass) {
    return NextResponse.json(
      { error: 'Anda belum memiliki kelas sebagai wali kelas.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { student_id, violation_type, description, location, date } = body;

    if (!student_id || !violation_type || !description) {
      return NextResponse.json(
        { error: 'Siswa, jenis pelanggaran, dan deskripsi wajib diisi.' },
        { status: 400 }
      );
    }

    // 2. VALIDASI IDOR KETAT: Pastikan siswa adalah anggota kelas wali kelas ini
    const { isAuthorized, notFound } = await verifyStudentBelongsToHomeroom(
      student_id,
      homeroomClass.id
    );

    if (notFound) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda hanya dapat mencatat pelanggaran untuk siswa di kelas Anda.' },
        { status: 403 }
      );
    }

    // 3. Simpan Pelanggaran: reporter_id OTOMATIS dari session.id
    const newViolation = await prisma.pelanggaranSiswa.create({
      data: {
        student_id,
        violation_type,
        description,
        location: location?.trim() || 'Lingkungan Sekolah',
        date: date ? new Date(date) : new Date(),
        status: 'Dilaporkan',
        reporter_id: session!.id,
        class_at_incident: homeroomClass.name,
      },
      include: {
        student: { select: { id: true, name: true, nis: true } },
        reporter: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pelanggaran untuk siswa ${newViolation.student.name} berhasil dicatat.`,
      violation: newViolation,
    });
  } catch (error: any) {
    console.error('Error in POST /api/homeroom/violations:', error);
    return NextResponse.json(
      { error: 'Gagal mencatat pelanggaran siswa.' },
      { status: 500 }
    );
  }
}
