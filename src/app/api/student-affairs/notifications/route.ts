import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const [announcements, urgentViolations] = await Promise.all([
      prisma.announcement.findMany({
        where: { is_published: true },
        orderBy: { published_at: 'desc' },
        take: 10,
      }),
      prisma.pelanggaranSiswa.findMany({
        where: { status: { in: ['Dilaporkan', 'Perlu Tindak Lanjut'] } },
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          student: { select: { name: true, class: { select: { name: true } } } },
          reporter: { select: { name: true } },
        },
      }),
    ]);

    const notifications = [
      ...urgentViolations.map((v) => ({
        id: `v-${v.id}`,
        type: 'violation',
        title: `Kasus Baru: ${v.violation_type}`,
        message: `${v.student.name} (${v.student.class?.name || v.class_at_incident}) dilaporkan oleh ${v.reporter.name}. Uraian: ${v.description.slice(0, 100)}...`,
        date: v.date.toISOString(),
        status: v.status,
        badgeColor: 'amber',
      })),
      ...announcements.map((a) => ({
        id: `a-${a.id}`,
        type: 'announcement',
        title: a.title,
        message: a.content.slice(0, 120) + (a.content.length > 120 ? '...' : ''),
        date: a.published_at.toISOString(),
        category: a.category,
        badgeColor: 'emerald',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/notifications:', error);
    return NextResponse.json(
      { error: 'Gagal memuat notifikasi kesiswaan.' },
      { status: 500 }
    );
  }
}
