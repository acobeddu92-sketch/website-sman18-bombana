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
    // Mengambil kegiatan kesiswaan dari model Announcement dengan kategori 'agenda' atau 'pengumuman'
    const announcements = await prisma.announcement.findMany({
      where: {
        is_published: true,
      },
      orderBy: { published_at: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        image: true,
        published_at: true,
        created_at: true,
      },
    });

    const activities = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.content,
      category: a.category,
      date: a.published_at.toISOString(),
      image: a.image,
    }));

    return NextResponse.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/activities:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data kegiatan kesiswaan.' },
      { status: 500 }
    );
  }
}
