import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
    'kepala_sekolah',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id')?.trim();
  const classId = searchParams.get('class_id')?.trim();
  const statusFilter = searchParams.get('status')?.trim();
  const search = searchParams.get('q')?.trim() || '';

  try {
    const [teachers, schedules, materials, classes] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: ['guru', 'guru_mapel', 'guru_bk', 'wali_kelas'] },
          is_active: true,
        },
        select: { id: true, name: true, username: true, role: true },
        orderBy: { name: 'asc' },
      }),
      prisma.teachingSchedule.findMany({
        include: {
          teacher: { select: { id: true, name: true } },
          class: { select: { id: true, name: true, grade: true } },
        },
        orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
      }),
      prisma.learningMaterial.findMany({
        select: {
          id: true,
          teacher_id: true,
          class_id: true,
          subject: true,
          title: true,
        },
      }),
      prisma.class.findMany({
        select: { id: true, name: true, grade: true },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
    ]);

    // Pemetaan monitoring berdasarkan kombinasi [Guru, Kelas, Mapel]
    interface MonitoringItem {
      id: string;
      teacherId: string;
      teacherName: string;
      teacherRole: string;
      classId: string | null;
      className: string;
      subject: string;
      scheduleDetails: string[];
      scheduleCount: number;
      materialCount: number;
      status: 'Lengkap' | 'Perlu Perhatian' | 'Belum Ada Data';
      statusReason: string;
    }

    const itemsMap = new Map<string, MonitoringItem>();

    // 1. Masukkan seluruh jadwal mengajar aktif
    for (const sch of schedules) {
      const key = `${sch.teacher_id}_${sch.class_id}_${sch.subject.toLowerCase()}`;
      const scheduleSlot = `${sch.day} (${sch.start_time} - ${sch.end_time})${sch.room ? ` @ ${sch.room}` : ''}`;

      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          id: key,
          teacherId: sch.teacher_id,
          teacherName: sch.teacher.name,
          teacherRole: sch.teacher ? 'Guru' : '',
          classId: sch.class_id,
          className: sch.class?.name || 'Tanpa Kelas',
          subject: sch.subject,
          scheduleDetails: [scheduleSlot],
          scheduleCount: 1,
          materialCount: 0,
          status: 'Perlu Perhatian',
          statusReason: '',
        });
      } else {
        const existing = itemsMap.get(key)!;
        existing.scheduleDetails.push(scheduleSlot);
        existing.scheduleCount += 1;
      }
    }

    // 2. Petakan materi ajar ke item monitoring yang sesuai
    for (const mat of materials) {
      const keyExact = `${mat.teacher_id}_${mat.class_id}_${mat.subject.toLowerCase()}`;
      if (itemsMap.has(keyExact)) {
        itemsMap.get(keyExact)!.materialCount += 1;
      } else {
        // Cek apakah ada jadwal guru tersebut untuk mata pelajaran yang sama
        let matched = false;
        itemsMap.forEach((item) => {
          if (
            !matched &&
            item.teacherId === mat.teacher_id &&
            item.subject.toLowerCase() === mat.subject.toLowerCase()
          ) {
            item.materialCount += 1;
            matched = true;
          }
        });
        if (!matched && mat.teacher_id) {
          const teacherObj = teachers.find((t) => t.id === mat.teacher_id);
          const customKey = `${mat.teacher_id}_none_${mat.subject.toLowerCase()}`;
          if (!itemsMap.has(customKey)) {
            itemsMap.set(customKey, {
              id: customKey,
              teacherId: mat.teacher_id,
              teacherName: teacherObj?.name || 'Guru',
              teacherRole: teacherObj?.role || 'Guru',
              classId: mat.class_id || null,
              className: mat.class_id ? 'Spesifik' : 'Umum / Semua Rombel',
              subject: mat.subject,
              scheduleDetails: [],
              scheduleCount: 0,
              materialCount: 1,
              status: 'Perlu Perhatian',
              statusReason: 'Materi tersedia namun belum dialokasikan ke jadwal tetap',
            });
          } else {
            itemsMap.get(customKey)!.materialCount += 1;
          }
        }
      }
    }

    // 3. Masukkan guru yang sama sekali belum memiliki jadwal atau materi
    for (const teacher of teachers) {
      const hasAnyItem = Array.from(itemsMap.values()).some(
        (item) => item.teacherId === teacher.id
      );
      if (!hasAnyItem) {
        const emptyKey = `${teacher.id}_empty`;
        itemsMap.set(emptyKey, {
          id: emptyKey,
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherRole: teacher.role,
          classId: null,
          className: '—',
          subject: 'Belum Ditentukan',
          scheduleDetails: [],
          scheduleCount: 0,
          materialCount: 0,
          status: 'Belum Ada Data',
          statusReason: 'Belum ada jadwal mengajar maupun perangkat pembelajaran terdaftar',
        });
      }
    }

    // 4. Hitung Status Transparan
    const allItems = Array.from(itemsMap.values()).map((item) => {
      if (item.scheduleCount > 0 && item.materialCount > 0) {
        item.status = 'Lengkap';
        item.statusReason = 'Jadwal dan perangkat pembelajaran telah lengkap';
      } else if (item.scheduleCount > 0 && item.materialCount === 0) {
        item.status = 'Perlu Perhatian';
        item.statusReason = 'Jadwal aktif namun perangkat ajar belum diunggah';
      } else if (item.scheduleCount === 0 && item.materialCount > 0) {
        item.status = 'Perlu Perhatian';
        item.statusReason = 'Perangkat ajar ada tetapi belum ada slot jadwal';
      } else {
        item.status = 'Belum Ada Data';
        item.statusReason = 'Belum terdaftar jadwal maupun materi ajar';
      }
      return item;
    });

    // 5. Filter hasil
    let filteredItems = allItems;

    if (teacherId && teacherId !== 'all') {
      filteredItems = filteredItems.filter((i) => i.teacherId === teacherId);
    }

    if (classId && classId !== 'all') {
      filteredItems = filteredItems.filter((i) => i.classId === classId);
    }

    if (statusFilter && statusFilter !== 'all') {
      filteredItems = filteredItems.filter((i) => i.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (i) =>
          i.teacherName.toLowerCase().includes(q) ||
          i.subject.toLowerCase().includes(q) ||
          i.className.toLowerCase().includes(q)
      );
    }

    // Ringkasan Status
    const completeCount = allItems.filter((i) => i.status === 'Lengkap').length;
    const attentionCount = allItems.filter((i) => i.status === 'Perlu Perhatian').length;
    const emptyCount = allItems.filter((i) => i.status === 'Belum Ada Data').length;

    return NextResponse.json({
      success: true,
      count: filteredItems.length,
      summary: {
        totalItems: allItems.length,
        completeCount,
        attentionCount,
        emptyCount,
      },
      items: filteredItems,
      filterOptions: {
        teachers,
        classes,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/monitoring:', error);
    return NextResponse.json(
      { error: 'Gagal memuat matriks monitoring pembelajaran.' },
      { status: 500 }
    );
  }
}
