import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const albumId = searchParams.get('album_id');

    const whereClause: any = {};
    if (albumId && albumId !== 'all') {
      whereClause.album_id = albumId;
    }

    const photos = await prisma.galleryPhoto.findMany({
      where: whereClause,
      include: {
        album: {
          select: { id: true, title: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ photos });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil foto galeri.' },
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
    const { title, description, image, album_id } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul foto wajib diisi.' }, { status: 400 });
    }
    if (!image) {
      return NextResponse.json({ error: 'File foto wajib diunggah.' }, { status: 400 });
    }

    const photo = await prisma.galleryPhoto.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        image,
        album_id: album_id || null,
      },
      include: {
        album: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, photo, message: 'Foto berhasil disimpan.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menyimpan foto.' }, { status: 500 });
  }
}
