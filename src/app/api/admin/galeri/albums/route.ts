import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME, GALLERY_CREATOR_ROLES } from '@/lib/constants';
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
    if (!session || !GALLERY_CREATOR_ROLES.includes(session.role as any)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda tidak memiliki izin untuk membuat album galeri.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, is_published } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Nama album wajib diisi.' }, { status: 400 });
    }

    const album = await prisma.galleryAlbum.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        created_by_id: session.id,
        is_published: is_published !== undefined ? Boolean(is_published) : true,
      },
    });

    return NextResponse.json({ success: true, album, message: 'Album berhasil dibuat.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal membuat album.' }, { status: 500 });
  }
}
