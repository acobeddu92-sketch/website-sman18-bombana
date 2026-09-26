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
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk mengedit album.' }, { status: 403 });
    }

    const existing = await prisma.galleryAlbum.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Album tidak ditemukan.' }, { status: 404 });
    }

    // Ownership Rule: Administrator has ALL access. Non-admin MUST be owner (created_by_id === session.id). If owner is NULL, non-admin = 403.
    if (session.role !== 'administrator') {
      if (!existing.created_by_id || existing.created_by_id !== session.id) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat mengedit album milik Anda sendiri.' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { title, description, is_published } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_published !== undefined) updateData.is_published = Boolean(is_published);

    const album = await prisma.galleryAlbum.update({
      where: { id: params.id },
      data: updateData,
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
    if (!session || !GALLERY_CREATOR_ROLES.includes(session.role as any)) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk menghapus album.' }, { status: 403 });
    }

    const existing = await prisma.galleryAlbum.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Album tidak ditemukan.' }, { status: 404 });
    }

    // Ownership Rule: Administrator has ALL access. Non-admin MUST be owner (created_by_id === session.id). If owner is NULL, non-admin = 403.
    if (session.role !== 'administrator') {
      if (!existing.created_by_id || existing.created_by_id !== session.id) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat menghapus album milik Anda sendiri.' },
          { status: 403 }
        );
      }
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
