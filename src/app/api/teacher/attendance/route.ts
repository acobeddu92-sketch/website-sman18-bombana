import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_mapel',
    'guru',
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
  const classId = searchParams.get('class_id') || undefined;
  const status = searchParams.get('status') || undefined;

  try {
    const whereClause: any = {};

    // Jika bukan wakasek/kepsek/admin, batasi hanya untuk guru yang bersangkutan
    if (!['wakasek_kesiswaan', 'kepala_sekolah', 'administrator'].includes(session!.role)) {
      whereClause.teacher_id = session!.id;
    }

    if (year) whereClause.year = year;
    if (month) whereClause.month = month;
    if (classId && classId !== 'all') whereClause.class_id = classId;
    if (status && status !== 'all') whereClause.status = status;

    const attendances = await prisma.monthlyAttendance.findMany({
      where: whereClause,
      include: {
        class: { select: { id: true, name: true, grade: true } },
        teacher: { select: { id: true, name: true } },
        verifier: { select: { id: true, name: true } },
        items: {
          include: {
            student: { select: { id: true, name: true, nis: true } },
          },
          orderBy: { student: { name: 'asc' } },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { created_at: 'desc' }],
    });

    return NextResponse.json({ success: true, attendances });
  } catch (error: any) {
    console.error('Error in GET /api/teacher/attendance:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekap absen bulanan.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_mapel',
    'guru',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const {
      id,
      year,
      month,
      class_id,
      subject,
      status = 'Draft',
      notes,
      items = [],
    } = body;

    const numYear = parseInt(year);
    const numMonth = parseInt(month);

    if (!numYear || !numMonth || !class_id || !subject) {
      return NextResponse.json(
        { error: 'Tahun, bulan, kelas, dan mata pelajaran wajib diisi.' },
        { status: 400 }
      );
    }

    if (numMonth < 1 || numMonth > 12) {
      return NextResponse.json(
        { error: 'Bulan harus antara 1 sampai 12.' },
        { status: 400 }
      );
    }

    // Validasi item absen: angka tidak boleh negatif
    for (const item of items) {
      const h = parseInt(item.present) || 0;
      const s = parseInt(item.sick) || 0;
      const i = parseInt(item.permission) || 0;
      const a = parseInt(item.unexcused) || 0;

      if (h < 0 || s < 0 || i < 0 || a < 0) {
        return NextResponse.json(
          { error: 'Angka kehadiran tidak boleh bernilai negatif.' },
          { status: 400 }
        );
      }
    }

    if (id) {
      const existing = await prisma.monthlyAttendance.findUnique({
        where: { id },
      });
      if (!existing) {
        return NextResponse.json(
          { error: 'Rekap absen bulanan tidak ditemukan.' },
          { status: 404 }
        );
      }
      if (
        session!.role !== 'administrator' &&
        existing.teacher_id !== session!.id
      ) {
        return NextResponse.json(
          { error: 'Akses ditolak. Anda tidak berhak mengubah rekap absen guru lain.' },
          { status: 403 }
        );
      }
      if (
        session!.role !== 'administrator' &&
        existing.status !== 'Draft'
      ) {
        return NextResponse.json(
          { error: 'Rekap absen yang sudah dikirim atau disetujui tidak dapat diubah lagi.' },
          { status: 400 }
        );
      }
    }

    const savedAttendance = await prisma.$transaction(async (tx) => {
      // 1. Upsert Header Rekap Absen Bulanan
      const attendance = await tx.monthlyAttendance.upsert({
        where: id
          ? { id }
          : {
              year_month_class_id_subject_teacher_id: {
                year: numYear,
                month: numMonth,
                class_id,
                subject: subject.trim(),
                teacher_id: session!.id,
              },
            },
        create: {
          year: numYear,
          month: numMonth,
          class_id,
          subject: subject.trim(),
          teacher_id: session!.id,
          status,
          notes: notes?.trim() || null,
          submitted_at: status === 'Dikirim' ? new Date() : null,
        },
        update: {
          status,
          notes: notes?.trim() || null,
          submitted_at: status === 'Dikirim' ? new Date() : undefined,
        },
      });

      // 2. Simpan Item Detail Absen Siswa (Total Dihitung Otomatis: H + S + I + A)
      for (const item of items) {
        if (!item.student_id) continue;
        const present = Math.max(0, parseInt(item.present) || 0);
        const sick = Math.max(0, parseInt(item.sick) || 0);
        const permission = Math.max(0, parseInt(item.permission) || 0);
        const unexcused = Math.max(0, parseInt(item.unexcused) || 0);
        const total = present + sick + permission + unexcused;

        await tx.monthlyAttendanceItem.upsert({
          where: {
            attendance_id_student_id: {
              attendance_id: attendance.id,
              student_id: item.student_id,
            },
          },
          create: {
            attendance_id: attendance.id,
            student_id: item.student_id,
            present,
            sick,
            permission,
            unexcused,
            total,
            notes: item.notes?.trim() || null,
          },
          update: {
            present,
            sick,
            permission,
            unexcused,
            total,
            notes: item.notes?.trim() || null,
          },
        });
      }

      return attendance;
    });

    return NextResponse.json({
      success: true,
      message:
        status === 'Dikirim'
          ? 'Rekap absen bulanan berhasil dikirim ke Wakasek Kesiswaan.'
          : 'Draft rekap absen bulanan berhasil disimpan.',
      attendance: savedAttendance,
    });
  } catch (error: any) {
    console.error('Error in POST /api/teacher/attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan rekap absen bulanan.' },
      { status: 500 }
    );
  }
}
