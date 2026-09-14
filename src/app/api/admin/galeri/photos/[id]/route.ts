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
    const { title, description, image, album_id } = body;

    const existing = await prisma.galleryPhoto.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Foto tidak ditemukan.' }, { status: 404 });
    }

    // Jika gambar diubah, hapus gambar lama dari storage
    if (image && existing.image && existing.image !== image) {
      await deleteUploadedFile(existing.image);
    }

    const updated = await prisma.galleryPhoto.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? description?.trim() : existing.description,
        image: image || existing.image,
        album_id: album_id !== undefined ? album_id : existing.album_id,
      },
    });

    return NextResponse.json({ success: true, photo: updated, message: 'Foto berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengubah foto.' }, { status: 500 });
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

    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: params.id },
    });

    if (photo) {
      if (photo.image) {
        await deleteUploadedFile(photo.image);
      }
      await prisma.galleryPhoto.delete({
        where: { id: params.id },
      });
    }

    return NextResponse.json({ success: true, message: 'Foto berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus foto.' }, { status: 500 });
  }
}
