import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { saveUploadedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const ALLOWED_MATERIAL_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, [
    'guru_mapel',
    'guru',
    'guru_bk',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File upload tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Gunakan folder khusus 'materi' (tidak mencampur dengan galeri)
    const result = await saveUploadedFile(file, 'materi', {
      maxSizeMB: 20,
      allowedMimeTypes: ALLOWED_MATERIAL_MIMES,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Gagal mengupload file materi.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      message: 'File materi berhasil diunggah.',
    });
  } catch (error: any) {
    console.error('Error in /api/teacher/upload:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat upload file materi.' },
      { status: 500 }
    );
  }
}
