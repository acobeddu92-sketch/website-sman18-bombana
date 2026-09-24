import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'guru_bk',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status')?.trim();
  const classId = searchParams.get('class_id')?.trim();
  const violationType = searchParams.get('violation_type')?.trim();
  const grade = searchParams.get('grade')?.trim();
  const search = searchParams.get('q')?.trim();
  const dateFrom = searchParams.get('date_from')?.trim();
  const dateTo = searchParams.get('date_to')?.trim();

  try {
    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (classId && classId !== 'all') {
      whereClause.student = { ...(whereClause.student || {}), class_id: classId };
    }

    if (grade && grade !== 'all') {
      whereClause.student = {
        ...(whereClause.student || {}),
        class: { grade },
      };
    }

    if (violationType && violationType !== 'all') {
      whereClause.violation_type = { contains: violationType, mode: 'insensitive' };
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
        { violation_type: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [violations, classes, statusStats] = await Promise.all([
      prisma.pelanggaranSiswa.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              gender: true,
              class: { select: { id: true, name: true, grade: true } },
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
            include: {
              actor: { select: { id: true, name: true, role: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.class.findMany({
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, grade: true },
      }),
      prisma.pelanggaranSiswa.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const countsByStatus: Record<string, number> = {
      Dilaporkan: 0,
      'Dalam Penanganan': 0,
      'Perlu Tindak Lanjut': 0,
      Selesai: 0,
    };

    for (const s of statusStats) {
      countsByStatus[s.status] = s._count.id;
    }

    return NextResponse.json({
      success: true,
      count: violations.length,
      countsByStatus,
      violations,
      classes,
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/violations:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar pelanggaran kesiswaan.' },
      { status: 500 }
    );
  }
}

// POST: Pencatatan Pelanggaran Siswa Langsung oleh Kesiswaan
export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'guru_bk',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const {
      student_id,
      class_at_incident,
      date,
      time,
      violation_type,
      description,
      location,
      initial_action,
      handler_id,
      status = 'Dilaporkan',
    } = body;

    if (!student_id || !violation_type || !description) {
      return NextResponse.json(
        { error: 'Siswa, jenis pelanggaran, dan deskripsi kejadian wajib diisi.' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: student_id },
      include: { class: { select: { name: true } } },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    const incidentClass = class_at_incident?.trim() || student.class?.name || 'Umum';

    const newViolation = await prisma.pelanggaranSiswa.create({
      data: {
        student_id,
        class_at_incident: incidentClass,
        date: date ? new Date(date) : new Date(),
        time: time?.trim() || null,
        violation_type: violation_type.trim(),
        description: description.trim(),
        location: location?.trim() || null,
        reporter_id: session!.id,
        initial_action: initial_action?.trim() || null,
        handler_id: handler_id || null,
        status,
      },
      include: {
        student: { select: { id: true, name: true, nis: true } },
        reporter: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pelanggaran siswa berhasil dicatat ke pusat data kesiswaan.',
      violation: newViolation,
    });
  } catch (error: any) {
    console.error('Error in POST /api/student-affairs/violations:', error);
    return NextResponse.json(
      { error: 'Gagal mencatat pelanggaran siswa.' },
      { status: 500 }
    );
  }
}
