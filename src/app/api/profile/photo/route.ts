import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { saveUploadedFile, deleteUploadedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('photo')) as File | null;

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'File foto tidak ditemukan dalam permintaan.' }, { status: 400 });
    }

    // 1. Simpan foto baru menggunakan storage abstraction (Vercel Blob / local dev fallback)
    const uploadResult = await saveUploadedFile(file, 'profiles', {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSizeMB: 3,
    });

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        { error: uploadResult.error || 'Gagal mengunggah foto profil.' },
        { status: 400 }
      );
    }

    // 2. Ambil foto lama untuk dihapus setelah upload baru berhasil
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { photo: true },
    });

    const oldPhotoUrl = user?.photo;

    // 3. Simpan URL foto baru ke User.photo (Master SOT Foto Personal)
    await prisma.user.update({
      where: { id: session.id },
      data: { photo: uploadResult.url },
    });

    // 4. Hapus foto lama secara aman HANYA setelah foto baru berhasil tersimpan di DB
    if (oldPhotoUrl && oldPhotoUrl !== uploadResult.url) {
      await deleteUploadedFile(oldPhotoUrl);
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      message: 'Foto profil berhasil diperbarui.',
    });
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server saat mengunggah foto.' },
      { status: 500 }
    );
  }
}
