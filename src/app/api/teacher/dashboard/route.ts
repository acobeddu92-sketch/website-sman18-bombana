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
    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayName = dayNames[today.getDay()];

    const [
      schedulesToday,
      allSchedules,
      latestAttendances,
      activeAssignments,
      announcements,
      todayPicket,
    ] = await Promise.all([
      // Jadwal hari ini
      prisma.teachingSchedule.findMany({
        where: {
          teacher_id: session!.id,
          day: currentDayName,
        },
        include: {
          class: { select: { id: true, name: true } },
        },
        orderBy: { start_time: 'asc' },
      }),
      // Semua jadwal untuk hitung kelas unik & mapel
      prisma.teachingSchedule.findMany({
        where: { teacher_id: session!.id },
        select: { class_id: true, subject: true },
      }),
      // Rekap absen terbaru
      prisma.monthlyAttendance.findMany({
        where: { teacher_id: session!.id },
        include: {
          class: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 3,
      }),
      // Tugas yang aktif
      prisma.assignment.findMany({
        where: {
          teacher_id: session!.id,
          is_active: true,
          deadline: { gte: today },
        },
        include: {
          class: { select: { id: true, name: true } },
        },
        orderBy: { deadline: 'asc' },
        take: 5,
      }),
      // Pengumuman sekolah
      prisma.announcement.findMany({
        where: { is_published: true },
        orderBy: { published_at: 'desc' },
        take: 3,
      }),
      // Status piket hari ini
      prisma.picketReport.findFirst({
        where: {
          picket_teacher_id: session!.id,
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
          },
        },
      }),
    ]);

    const uniqueClassIds = new Set(allSchedules.map((s) => s.class_id));
    const uniqueSubjects = Array.from(new Set(allSchedules.map((s) => s.subject)));

    return NextResponse.json({
      success: true,
      currentDay: currentDayName,
      subjects: uniqueSubjects,
      classesTaughtCount: uniqueClassIds.size,
      schedulesToday,
      latestAttendances,
      activeAssignments,
      announcements,
      todayPicket,
    });
  } catch (error: any) {
    console.error('Error in GET /api/teacher/dashboard:', error);
    return NextResponse.json(
      { error: 'Gagal memuat ringkasan dashboard guru.' },
      { status: 500 }
    );
  }
}
