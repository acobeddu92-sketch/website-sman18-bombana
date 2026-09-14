import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { deleteUploadedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const album = await prisma.galleryAlbum.update({
      where: { id: params.id },
      data: {
        title: title?.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, album, message: 'Album berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengubah album.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Hanya untuk Administrator.' }, { status: 403 });
    }

    // 1. Cari semua foto di dalam album ini untuk menghapus filenya dari storage
    const photos = await prisma.galleryPhoto.findMany({
      where: { album_id: params.id },
      select: { image: true },
    });

    for (const p of photos) {
      if (p.image) {
        await deleteUploadedFile(p.image);
      }
    }

    // 2. Hapus album dari database (cascade delete akan menghapus baris foto)
    await prisma.galleryAlbum.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Album dan seluruh foto di dalamnya berhasil dihapus.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus album.' }, { status: 500 });
  }
}
