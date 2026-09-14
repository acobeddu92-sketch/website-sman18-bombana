import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { deleteUploadedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

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
    const { image, is_active } = body;

    if (!image) {
      return NextResponse.json({ error: 'URL/file gambar background wajib disertakan.' }, { status: 400 });
    }

    let bg = await prisma.homeBackground.findFirst({ orderBy: { updated_at: 'desc' } });

    // Hapus file lama jika ada dan berbeda
    if (bg && bg.image && bg.image !== image) {
      await deleteUploadedFile(bg.image);
    }

    if (bg) {
      bg = await prisma.homeBackground.update({
        where: { id: bg.id },
        data: {
          image,
          is_active: is_active !== undefined ? is_active : true,
        },
      });
    } else {
      bg = await prisma.homeBackground.create({
        data: {
          image,
          is_active: is_active !== undefined ? is_active : true,
        },
      });
    }

    // Invalidate cache halaman Home agar perubahan langsung tayang
    revalidatePath('/', 'page');
    revalidatePath('/');

    return NextResponse.json({ success: true, background: bg, message: 'Background Home berhasil disimpan.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menyimpan background.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Hanya untuk Administrator.' }, { status: 403 });
    }

    const body = await req.json();
    const { is_active } = body;

    const bg = await prisma.homeBackground.findFirst({ orderBy: { updated_at: 'desc' } });
    if (!bg) {
      return NextResponse.json({ error: 'Background belum pernah disetel.' }, { status: 404 });
    }

    const updated = await prisma.homeBackground.update({
      where: { id: bg.id },
      data: { is_active: Boolean(is_active) },
    });

    // Invalidate cache halaman Home
    revalidatePath('/', 'page');
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      background: updated,
      message: `Background Home berhasil ${updated.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengubah status background.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Hanya untuk Administrator.' }, { status: 403 });
    }

    const bg = await prisma.homeBackground.findFirst({ orderBy: { updated_at: 'desc' } });
    if (bg) {
      if (bg.image) {
        await deleteUploadedFile(bg.image);
      }
      await prisma.homeBackground.delete({
        where: { id: bg.id },
      });
    }

    // Invalidate cache halaman Home
    revalidatePath('/', 'page');
    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Background Home berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus background.' }, { status: 500 });
  }
}
