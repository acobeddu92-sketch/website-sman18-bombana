import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      include: {
        _count: {
          select: { photos: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ albums });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil album galeri.' },
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
    const { title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Nama album wajib diisi.' }, { status: 400 });
    }

    const album = await prisma.galleryAlbum.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, album, message: 'Album berhasil dibuat.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal membuat album.' }, { status: 500 });
  }
}
