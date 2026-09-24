import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyHomeroomAccess } from '@/lib/homeroom-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();

  // 1. Verifikasi Akses & Kepemilikan Rombel
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
      notifications: [],
      totalCount: 0,
    });
  }

  try {
    const classId = homeroomClass.id;
    const notifications: any[] = [];

    // 2. Alert Pelanggaran yang Perlu Tindak Lanjut
    const pendingViolations = await prisma.pelanggaranSiswa.findMany({
      where: {
        student: { class_id: classId },
        status: { in: ['Dilaporkan', 'Perlu Tindak Lanjut'] },
      },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        student: { select: { id: true, name: true, nis: true } },
      },
    });

    for (const pv of pendingViolations) {
      notifications.push({
        id: `viol-${pv.id}`,
        type: 'violation',
        title: `Pelanggaran Perlu Perhatian: ${pv.student.name}`,
        message: `${pv.violation_type}: "${pv.description}". Status: ${pv.status}`,
        date: pv.date.toISOString(),
        severity: pv.status === 'Perlu Tindak Lanjut' ? 'high' : 'medium',
      });
    }

    // 3. Pengumuman Sekolah Terbaru
    const announcements = await prisma.announcement.findMany({
      where: { is_published: true },
      orderBy: { published_at: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        published_at: true,
      },
    });

    for (const ann of announcements) {
      notifications.push({
        id: `ann-${ann.id}`,
        type: 'announcement',
        title: `Pengumuman: ${ann.title}`,
        message: ann.content.substring(0, 140) + (ann.content.length > 140 ? '...' : ''),
        date: ann.published_at.toISOString(),
        severity: 'info',
      });
    }

    return NextResponse.json({
      success: true,
      hasHomeroomClass: true,
      homeroomClass: {
        id: homeroomClass.id,
        name: homeroomClass.name,
      },
      notifications,
      totalCount: notifications.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/notifications:', error);
    return NextResponse.json(
      { error: 'Gagal memuat notifikasi wali kelas.' },
      { status: 500 }
    );
  }
}
