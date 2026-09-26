import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME, GALLERY_CREATOR_ROLES } from '@/lib/constants';
import { saveUploadedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi Autentikasi & RBAC (Role Staf / Non-Siswa)
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Akses ditolak. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);
    if (!session || !GALLERY_CREATOR_ROLES.includes(session.role as any)) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda tidak memiliki izin untuk mengunggah file.' },
        { status: 403 }
      );
    }

    // 2. Baca FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'File upload tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Aturan khusus ukuran jika logo
    const isLogo = folder === 'logo';
    const result = await saveUploadedFile(file, folder, {
      maxSizeMB: isLogo ? 2 : 5,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Gagal mengupload file.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      message: 'File berhasil diupload.',
    });
  } catch (error: any) {
    console.error('API Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server saat upload file.' },
      { status: 500 }
    );
  }
}
