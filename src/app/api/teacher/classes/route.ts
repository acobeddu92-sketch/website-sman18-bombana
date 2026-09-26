import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_mapel',
    'guru',
    'wali_kelas',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    // Cari kelas dari jadwal mengajar guru atau semua kelas
    const schedules = await prisma.teachingSchedule.findMany({
      where: { teacher_id: session!.id },
      select: { class_id: true },
    });

    const classIds = schedules.map((s) => s.class_id);

    // Perbaikan Kebocoran Data (Information Leak):
    // Jika role pengajar (guru_mapel, guru, wali_kelas) belum memiliki jadwal mengajar,
    // jangan kembalikan semua kelas di sekolah (cegah kebocoran data siswa/rombel).
    const isSupervisory = session!.role === 'administrator' || session!.role === 'kepala_sekolah';
    if (!isSupervisory && classIds.length === 0) {
      return NextResponse.json({ success: true, classes: [] });
    }

    // Ambil kelas
    const whereClause: any = classIds.length > 0 ? { id: { in: classIds } } : {};

    const classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        academic_year_rel: { select: { id: true, name: true, is_active: true } },
        homeroom_teacher: { select: { id: true, name: true } },
        students: {
          where: { is_active: true },
          select: {
            id: true,
            name: true,
            nis: true,
            gender: true,
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, classes });
  } catch (error: any) {
    console.error('Error in GET /api/teacher/classes:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data kelas yang diajar.' },
      { status: 500 }
    );
  }
}
