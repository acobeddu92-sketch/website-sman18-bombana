import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'all' | 'published' | 'draft'

    const whereClause: any = {};
    if (status === 'published') whereClause.is_published = true;
    if (status === 'draft') whereClause.is_published = false;

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: { published_at: 'desc' },
    });

    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil data informasi.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Hanya untuk Administrator.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, image, category, published_at, is_published } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul informasi wajib diisi.' }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Isi informasi wajib diisi.' }, { status: 400 });
    }

    const item = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        image: image || null,
        category: category || 'pengumuman',
        published_at: published_at ? new Date(published_at) : new Date(),
        is_published: is_published !== undefined ? is_published : true,
      },
    });

    return NextResponse.json({
      success: true,
      announcement: item,
      message: 'Informasi berhasil dibuat.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal membuat informasi.' },
      { status: 500 }
    );
  }
}
