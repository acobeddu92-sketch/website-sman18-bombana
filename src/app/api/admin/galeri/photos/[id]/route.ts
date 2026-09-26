import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME, GALLERY_CREATOR_ROLES } from '@/lib/constants';
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
    if (!session || !GALLERY_CREATOR_ROLES.includes(session.role as any)) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk mengedit foto.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, image, album_id } = body;

    const existing = await prisma.galleryPhoto.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Foto tidak ditemukan.' }, { status: 404 });
    }

    // Ownership Rule: Administrator has ALL access. Non-admin MUST be owner (uploaded_by_id === session.id). If owner is NULL, non-admin = 403.
    if (session.role !== 'administrator') {
      if (!existing.uploaded_by_id || existing.uploaded_by_id !== session.id) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat mengedit foto milik Anda sendiri.' },
          { status: 403 }
        );
      }
    }

    // Jika gambar diubah, hapus gambar lama dari storage
    if (image && existing.image && existing.image !== image) {
      await deleteUploadedFile(existing.image);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (image !== undefined) updateData.image = image;
    if (album_id !== undefined) updateData.album_id = album_id;
    if (body.is_published !== undefined) updateData.is_published = Boolean(body.is_published);

    const updated = await prisma.galleryPhoto.update({
      where: { id: params.id },
      data: updateData,
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
    if (!session || !GALLERY_CREATOR_ROLES.includes(session.role as any)) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk menghapus foto.' }, { status: 403 });
    }

    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: params.id },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Foto tidak ditemukan.' }, { status: 404 });
    }

    // Ownership Rule: Administrator has ALL access. Non-admin MUST be owner (uploaded_by_id === session.id). If owner is NULL, non-admin = 403.
    if (session.role !== 'administrator') {
      if (!photo.uploaded_by_id || photo.uploaded_by_id !== session.id) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat menghapus foto milik Anda sendiri.' },
          { status: 403 }
        );
      }
    }

    if (photo.image) {
      await deleteUploadedFile(photo.image);
    }
    await prisma.galleryPhoto.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Foto berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus foto.' }, { status: 500 });
  }
}
