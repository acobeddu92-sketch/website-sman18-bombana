import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Jadwal Mengajar Guru / Jadwal Kelas (Membaca dari Master Data TeachingSchedule)
export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_mapel',
    'guru',
    'wali_kelas',
    'wakasek_kurikulum',
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('class_id') || searchParams.get('classId');
  const day = searchParams.get('day');

  try {
    const whereClause: any = {};

    // 1. Filter Berdasarkan Otoritas dan Konteks
    if (session?.role === 'administrator' || session?.role === 'kepala_sekolah' || session?.role === 'wakasek_kurikulum') {
      if (classId) {
        whereClause.class_id = classId;
      }
    } else if (session?.role === 'wali_kelas' && classId) {
      // Wali Kelas dapat melihat jadwal rombel kelas binaannya
      whereClause.class_id = classId;
    } else {
      // Guru Mapel / Guru: Mutlak membaca jadwal pribadi yang telah ditetapkan oleh Kurikulum
      whereClause.teacher_id = session!.id;
      if (classId) {
        whereClause.class_id = classId;
      }
    }

    // 2. Filter Hari jika ada
    if (day && day !== 'all') {
      whereClause.day = day;
    }

    const schedules = await prisma.teachingSchedule.findMany({
      where: whereClause,
      include: {
        class: { select: { id: true, name: true, grade: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error: any) {
    console.error('Error in GET /api/teacher/schedules:', error);
    return NextResponse.json(
      { error: 'Gagal memuat jadwal mengajar.' },
      { status: 500 }
    );
  }
}

// POST: Pembuatan Jadwal dibatasi secara tegas untuk Wakasek Kurikulum / Admin
// Guru Mapel tidak diizinkan membuat jadwal sendiri
export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);

  if (errorResponse) {
    if (!session) {
      return errorResponse;
    }
    return NextResponse.json(
      {
        error: 'Akses ditolak. Guru tidak dapat membuat jadwal sendiri. Seluruh jadwal pelajaran ditetapkan oleh Wakasek Kurikulum sebagai Master Data Sekolah.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { teacher_id, class_id, subject, day, start_time, end_time, room } = body;

    const targetTeacherId = teacher_id || session!.id;

    if (!class_id || !subject || !day || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Kelas, mata pelajaran, hari, jam mulai, dan jam selesai wajib diisi.' },
        { status: 400 }
      );
    }

    const schedule = await prisma.teachingSchedule.create({
      data: {
        teacher_id: targetTeacherId,
        class_id,
        subject: subject.trim(),
        day: day.trim(),
        start_time: start_time.trim(),
        end_time: end_time.trim(),
        room: room?.trim() || null,
      },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, schedule }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/teacher/schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan jadwal mengajar.' },
      { status: 500 }
    );
  }
}
