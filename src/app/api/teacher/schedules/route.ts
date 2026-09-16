import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_mapel',
    'guru',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const schedules = await prisma.teachingSchedule.findMany({
      where: session?.role === 'administrator' || session?.role === 'kepala_sekolah'
        ? {}
        : { teacher_id: session!.id },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error: any) {
    console.error('Error in GET /api/teacher/schedules:', error);
    return NextResponse.json(
      { error: 'Gagal memuat jadwal mengajar.' },
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
    const { class_id, subject, day, start_time, end_time, room } = body;

    if (!class_id || !subject || !day || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Kelas, mata pelajaran, hari, jam mulai, dan jam selesai wajib diisi.' },
        { status: 400 }
      );
    }

    const schedule = await prisma.teachingSchedule.create({
      data: {
        teacher_id: session!.id,
        class_id,
        subject: subject.trim(),
        day: day.trim(),
        start_time: start_time.trim(),
        end_time: end_time.trim(),
        room: room?.trim() || null,
      },
      include: {
        class: { select: { id: true, name: true } },
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
