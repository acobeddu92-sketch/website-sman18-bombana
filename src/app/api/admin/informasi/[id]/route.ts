import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME, ANNOUNCEMENT_MANAGER_ROLES } from '@/lib/constants';
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
    if (!session || !ANNOUNCEMENT_MANAGER_ROLES.includes(session.role as any)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Administrator dan Pembina OSIS yang dapat mengedit informasi.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, image, category, published_at, is_published } = body;

    const existing = await prisma.announcement.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
    }

    // Jika gambar diganti, hapus gambar lama dari storage
    if (image && existing.image && existing.image !== image) {
      await deleteUploadedFile(existing.image);
    }

    const updated = await prisma.announcement.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        content: content !== undefined ? content.trim() : existing.content,
        image: image !== undefined ? image : existing.image,
        category: category !== undefined ? category : existing.category,
        published_at: published_at ? new Date(published_at) : existing.published_at,
        is_published: is_published !== undefined ? is_published : existing.is_published,
      },
    });

    return NextResponse.json({
      success: true,
      announcement: updated,
      message: 'Informasi berhasil diperbarui.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengubah informasi.' },
      { status: 500 }
    );
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
    if (!session || !ANNOUNCEMENT_MANAGER_ROLES.includes(session.role as any)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Administrator dan Pembina OSIS yang dapat menghapus informasi.' },
        { status: 403 }
      );
    }

    const item = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (item) {
      if (item.image) {
        await deleteUploadedFile(item.image);
      }
      await prisma.announcement.delete({
        where: { id: params.id },
      });
    }

    return NextResponse.json({ success: true, message: 'Informasi berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus informasi.' },
      { status: 500 }
    );
  }
}
