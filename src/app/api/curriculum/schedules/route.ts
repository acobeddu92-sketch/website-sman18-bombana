import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Penarikan Seluruh Jadwal Pelajaran Sekolah (Master Data Jadwal Kurikulum)
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
    'kepala_sekolah',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const day = searchParams.get('day')?.trim();
  const teacherId = searchParams.get('teacher_id')?.trim();
  const classId = searchParams.get('class_id')?.trim() || searchParams.get('classId')?.trim();
  const grade = searchParams.get('grade')?.trim();
  const search = searchParams.get('q')?.trim() || '';

  try {
    const whereClause: any = {};

    if (day && day !== 'all') {
      whereClause.day = day;
    }

    if (teacherId && teacherId !== 'all') {
      whereClause.teacher_id = teacherId;
    }

    if (classId && classId !== 'all') {
      whereClause.class_id = classId;
    }

    if (grade && grade !== 'all') {
      whereClause.class = {
        ...(whereClause.class || {}),
        grade,
      };
    }

    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { teacher: { name: { contains: search, mode: 'insensitive' } } },
        { class: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [schedules, allTeachers, allClasses] = await Promise.all([
      prisma.teachingSchedule.findMany({
        where: whereClause,
        include: {
          class: { select: { id: true, name: true, grade: true, academic_year: true } },
          teacher: { select: { id: true, name: true, username: true, email: true, role: true } },
        },
        orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
      }),
      prisma.user.findMany({
        where: {
          role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] },
          is_active: true,
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.class.findMany({
        select: { id: true, name: true, grade: true },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return NextResponse.json({
      success: true,
      count: schedules.length,
      schedules,
      filterOptions: {
        days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        teachers: allTeachers,
        classes: allClasses,
        grades: ['X', 'XI', 'XII'],
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/schedules:', error);
    return NextResponse.json(
      { error: 'Gagal memuat seluruh jadwal pelajaran sekolah.' },
      { status: 500 }
    );
  }
}

// Helper: Konversi string "HH:mm" menjadi total menit dari jam 00:00
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

// Helper: Deteksi Overlap Interval Waktu [startA, endA) dan [startB, endB)
function isTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  // Interval bertabrakan jika max(startA, startB) < min(endA, endB)
  return Math.max(sA, sB) < Math.min(eA, eB);
}

// Helper: Validasi Komprehensif Bentrok Jadwal Mengajar (Guru, Kelas, Ruang)
async function checkScheduleConflict({
  day,
  start_time,
  end_time,
  teacher_id,
  class_id,
  room,
  excludeId,
}: {
  day: string;
  start_time: string;
  end_time: string;
  teacher_id: string;
  class_id: string;
  room?: string | null;
  excludeId?: string;
}): Promise<{ conflict: boolean; error?: string }> {
  // Ambil semua jadwal pada hari yang sama dari database
  // Jika sedang update (PUT), kecualikan jadwal yang sedang diedit
  const existingSchedules = await prisma.teachingSchedule.findMany({
    where: {
      day: day.trim(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: {
      teacher: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
    },
  });

  for (const existing of existingSchedules) {
    if (isTimeOverlap(start_time, end_time, existing.start_time, existing.end_time)) {
      // 1. Bentrok Guru: Guru yang sama mengajar di 2 tempat di waktu yang bertabrakan/overlap
      if (existing.teacher_id === teacher_id) {
        return {
          conflict: true,
          error: `Bentrok Jadwal Guru: ${existing.teacher?.name || 'Guru bersangkutan'} sudah memiliki jadwal mengajar mata pelajaran '${existing.subject}' di kelas ${existing.class?.name || '-'} pada hari ${day}, pukul ${existing.start_time} - ${existing.end_time} WITA.`,
        };
      }

      // 2. Bentrok Kelas: Kelas yang sama menerima 2 pelajaran di waktu yang bertabrakan/overlap
      if (existing.class_id === class_id) {
        return {
          conflict: true,
          error: `Bentrok Jadwal Kelas: Kelas ${existing.class?.name || '-'} sudah memiliki jadwal pelajaran '${existing.subject}' oleh ${existing.teacher?.name || 'Guru'} pada hari ${day}, pukul ${existing.start_time} - ${existing.end_time} WITA.`,
        };
      }

      // 3. Bentrok Ruang: Ruang yang sama digunakan oleh 2 kelas berbeda di waktu yang bertabrakan/overlap
      // Hanya dicek jika kolom ruang diisi pada kedua record
      if (room && room.trim() && existing.room && existing.room.trim()) {
        if (room.trim().toLowerCase() === existing.room.trim().toLowerCase()) {
          return {
            conflict: true,
            error: `Bentrok Ruangan: Ruang '${existing.room}' sudah dialokasikan untuk ${existing.subject} (${existing.class?.name || '-'}) pada hari ${day}, pukul ${existing.start_time} - ${existing.end_time} WITA.`,
          };
        }
      }
    }
  }

  return { conflict: false };
}

// POST: Pembuatan Jadwal Pelajaran Baru oleh Wakasek Kurikulum (Master Jadwal Sekolah)
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { teacher_id, class_id, subject, day, start_time, end_time, room } = body;

    if (!teacher_id || !class_id || !subject || !day || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Guru pengampu, kelas, mata pelajaran, hari, jam mulai, dan jam selesai wajib diisi.' },
        { status: 400 }
      );
    }

    // Validasi jam mulai harus lebih awal dari jam selesai
    if (timeToMinutes(start_time) >= timeToMinutes(end_time)) {
      return NextResponse.json(
        { error: `Jam mulai (${start_time}) harus lebih awal dari jam selesai (${end_time}).` },
        { status: 400 }
      );
    }

    // Validasi keberadaan Guru
    const teacher = await prisma.user.findUnique({
      where: { id: teacher_id },
      select: { id: true, name: true, is_active: true },
    });
    if (!teacher || !teacher.is_active) {
      return NextResponse.json(
        { error: 'Guru pengampu tidak ditemukan atau tidak aktif.' },
        { status: 400 }
      );
    }

    // Validasi keberadaan Kelas
    const targetClass = await prisma.class.findUnique({
      where: { id: class_id },
      select: { id: true, name: true },
    });
    if (!targetClass) {
      return NextResponse.json(
        { error: 'Kelas / rombel tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Validasi Bentrok Jadwal Mengajar (Guru, Kelas, Ruang & Overlap Waktu)
    const conflictCheck = await checkScheduleConflict({
      day: day.trim(),
      start_time: start_time.trim(),
      end_time: end_time.trim(),
      teacher_id,
      class_id,
      room: room?.trim() || null,
    });

    if (conflictCheck.conflict) {
      return NextResponse.json(
        { error: conflictCheck.error },
        { status: 409 }
      );
    }

    const schedule = await prisma.teachingSchedule.create({
      data: {
        teacher_id,
        class_id,
        subject: subject.trim(),
        day: day.trim(),
        start_time: start_time.trim(),
        end_time: end_time.trim(),
        room: room?.trim() || null,
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        teacher: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Jadwal ${schedule.subject} untuk ${schedule.teacher.name} di kelas ${schedule.class.name} berhasil dibuat.`,
        schedule,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/curriculum/schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan jadwal pelajaran baru.' },
      { status: 500 }
    );
  }
}

// PUT: Perubahan / Penyesuaian Jadwal Pelajaran oleh Wakasek Kurikulum
export async function PUT(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, teacher_id, class_id, subject, day, start_time, end_time, room } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID jadwal wajib disertakan untuk pembaruan.' },
        { status: 400 }
      );
    }

    const existingSchedule = await prisma.teachingSchedule.findUnique({
      where: { id },
    });
    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Jadwal pelajaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Validasi Guru jika diubah
    if (teacher_id) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacher_id },
        select: { id: true, is_active: true },
      });
      if (!teacher || !teacher.is_active) {
        return NextResponse.json(
          { error: 'Guru pengampu tidak ditemukan atau tidak aktif.' },
          { status: 400 }
        );
      }
    }

    // Validasi Kelas jika diubah
    if (class_id) {
      const targetClass = await prisma.class.findUnique({
        where: { id: class_id },
        select: { id: true },
      });
      if (!targetClass) {
        return NextResponse.json(
          { error: 'Kelas / rombel tidak ditemukan.' },
          { status: 400 }
        );
      }
    }

    // Nilai efektif yang akan tersimpan
    const targetDay = day !== undefined ? day.trim() : existingSchedule.day;
    const targetStartTime = start_time !== undefined ? start_time.trim() : existingSchedule.start_time;
    const targetEndTime = end_time !== undefined ? end_time.trim() : existingSchedule.end_time;
    const targetTeacherId = teacher_id !== undefined ? teacher_id : existingSchedule.teacher_id;
    const targetClassId = class_id !== undefined ? class_id : existingSchedule.class_id;
    const targetRoom = room !== undefined ? (room ? room.trim() : null) : existingSchedule.room;

    // Validasi jam mulai harus lebih awal dari jam selesai
    if (timeToMinutes(targetStartTime) >= timeToMinutes(targetEndTime)) {
      return NextResponse.json(
        { error: `Jam mulai (${targetStartTime}) harus lebih awal dari jam selesai (${targetEndTime}).` },
        { status: 400 }
      );
    }

    // Validasi Bentrok Jadwal Mengajar (Guru, Kelas, Ruang & Overlap Waktu)
    // Kecualikan ID jadwal ini agar tidak membandingkan dengan dirinya sendiri
    const conflictCheck = await checkScheduleConflict({
      day: targetDay,
      start_time: targetStartTime,
      end_time: targetEndTime,
      teacher_id: targetTeacherId,
      class_id: targetClassId,
      room: targetRoom,
      excludeId: id,
    });

    if (conflictCheck.conflict) {
      return NextResponse.json(
        { error: conflictCheck.error },
        { status: 409 }
      );
    }

    const updatedSchedule = await prisma.teachingSchedule.update({
      where: { id },
      data: {
        ...(teacher_id ? { teacher_id } : {}),
        ...(class_id ? { class_id } : {}),
        ...(subject ? { subject: subject.trim() } : {}),
        ...(day ? { day: day.trim() } : {}),
        ...(start_time ? { start_time: start_time.trim() } : {}),
        ...(end_time ? { end_time: end_time.trim() } : {}),
        ...(room !== undefined ? { room: room ? room.trim() : null } : {}),
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        teacher: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Jadwal pelajaran berhasil diperbarui.',
      schedule: updatedSchedule,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/curriculum/schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui jadwal pelajaran.' },
      { status: 500 }
    );
  }
}

// DELETE: Penghapusan Jadwal Pelajaran oleh Wakasek Kurikulum
export async function DELETE(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const idFromQuery = searchParams.get('id');

  let id = idFromQuery;
  if (!id) {
    try {
      const body = await request.json();
      id = body?.id;
    } catch {
      // no body
    }
  }

  if (!id) {
    return NextResponse.json(
      { error: 'ID jadwal wajib disertakan untuk penghapusan.' },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.teachingSchedule.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Jadwal pelajaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    await prisma.teachingSchedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Jadwal pelajaran berhasil dihapus dari master data.',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/curriculum/schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus jadwal pelajaran.' },
      { status: 500 }
    );
  }
}
