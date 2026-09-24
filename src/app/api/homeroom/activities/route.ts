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
      activities: [],
      totalCount: 0,
    });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      where: { is_published: true },
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
      hasHomeroomClass: true,
      homeroomClass: {
        id: homeroomClass.id,
        name: homeroomClass.name,
      },
      activities,
      totalCount: activities.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/activities:', error);
    return NextResponse.json(
      { error: 'Gagal memuat kegiatan dan agenda kelas.' },
      { status: 500 }
    );
  }
}
