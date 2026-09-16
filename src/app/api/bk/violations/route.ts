import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar seluruh pelanggaran siswa terpusat
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'guru_bk',
    'kepala_sekolah',
    'administrator',
    'wakasek_kesiswaan',
    'guru_mapel',
    'guru',
    'wali_kelas',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status')?.trim() || '';
  const classId = searchParams.get('class_id')?.trim() || '';
  const search = searchParams.get('q')?.trim() || '';

  try {
    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (classId && classId !== 'all') {
      whereClause.student = { class_id: classId };
    }

    if (search) {
      whereClause.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { violation_type: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const violations = await prisma.pelanggaranSiswa.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            class: { select: { id: true, name: true } },
          },
        },
        reporter: {
          select: { id: true, name: true, role: true },
        },
        handler: {
          select: { id: true, name: true, role: true },
        },
        follow_ups: {
          orderBy: { action_date: 'desc' },
          include: { actor: { select: { id: true, name: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, violations });
  } catch (error: any) {
    console.error('Error in GET /api/bk/violations:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data riwayat pelanggaran terpusat.' },
      { status: 500 }
    );
  }
}

// POST: Laporkan kasus pelanggaran siswa baru (dapat dilakukan oleh Guru Mapel / Piket / BK)
export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_bk',
    'guru_mapel',
    'guru',
    'wali_kelas',
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const {
      student_id,
      violation_type,
      description,
      class_at_incident,
      date,
      time,
      location,
      initial_action,
      picket_report_id,
    } = body;

    if (!student_id || !violation_type || !description) {
      return NextResponse.json(
        { error: 'Siswa, jenis pelanggaran, dan kronologi kejadian wajib diisi.' },
        { status: 400 }
      );
    }

    // Jika class_at_incident belum diisi, ambil dari kelas siswa saat ini
    let finalClass = class_at_incident;
    if (!finalClass) {
      const student = await prisma.student.findUnique({
        where: { id: student_id },
        include: { class: true },
      });
      finalClass = student?.class?.name || 'Tanpa Kelas';
    }

    const newViolation = await prisma.pelanggaranSiswa.create({
      data: {
        student_id,
        class_at_incident: finalClass,
        date: date ? new Date(date) : new Date(),
        time: time || null,
        violation_type: violation_type.trim(),
        description: description.trim(),
        location: location?.trim() || null,
        reporter_id: session!.id, // Pelapor adalah user yang sedang login
        initial_action: initial_action?.trim() || null,
        status: 'Dilaporkan',
        picket_report_id: picket_report_id || null,
      },
      include: {
        student: {
          select: { id: true, name: true, class: { select: { name: true } } },
        },
        reporter: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pelanggaran siswa berhasil dilaporkan.',
        violation: newViolation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/bk/violations:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal melaporkan kasus pelanggaran.' },
      { status: 500 }
    );
  }
}
