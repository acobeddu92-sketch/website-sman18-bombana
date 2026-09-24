import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';
import { analyzeDocxTemplate } from '@/lib/docx-template';
import { saveSKFile } from '@/lib/sk-storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. RBAC: Hanya Wakasek Kurikulum dan Administrator
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json(
        { error: 'Berkas template wajib diunggah.' },
        { status: 400 }
      );
    }

    // 2. Validasi Ekstensi & MIME
    const fileName = file.name || 'template.docx';
    const isDocxExt = fileName.toLowerCase().endsWith('.docx');
    if (!isDocxExt) {
      if (fileName.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          {
            error:
              'Format PDF dapat disimpan sebagai lampiran referensi, tetapi generate otomatis SK wajib menggunakan template Microsoft Word (.docx).',
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Format berkas tidak valid. Harap unggah berkas Microsoft Word (.docx).' },
        { status: 400 }
      );
    }

    // 3. Validasi Ukuran (Maksimal 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran berkas template melebihi batas maksimal 10 MB.' },
        { status: 400 }
      );
    }

    // 4. Konversi ke Buffer & Analisis Struktur DOCX + Ekstraksi Placeholder
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const analysis = analyzeDocxTemplate(buffer);
    if (!analysis.valid) {
      return NextResponse.json(
        { error: analysis.error || 'Berkas template tidak valid atau rusak.' },
        { status: 400 }
      );
    }

    // 5. Simpan Template ke Penyimpanan (Vercel Blob / Local Storage)
    const saveResult = await saveSKFile(buffer, fileName, 'template');
    if (!saveResult.success || !saveResult.url) {
      return NextResponse.json(
        { error: saveResult.error || 'Gagal menyimpan berkas template ke penyimpanan.' },
        { status: 500 }
      );
    }

    // 6. Ambil Data Petunjuk Otomatis (Kepala Sekolah & Wakasek) dari Database
    const [principal, currentUser] = await Promise.all([
      prisma.principalProfile.findFirst({ select: { name: true } }),
      prisma.user.findUnique({
        where: { id: session.id },
        select: { name: true, nip: true },
      }),
    ]);

    // Cari juga jika ada user kepala_sekolah dengan NIP
    const userKepsek = await prisma.user.findFirst({
      where: { role: 'kepala_sekolah', is_active: true },
      select: { name: true, nip: true },
    });

    const schoolHints = {
      NAMA_KEPALA_SEKOLAH: principal?.name || userKepsek?.name || '',
      NIP_KEPALA_SEKOLAH: userKepsek?.nip || '',
      NAMA_WAKASEK_KURIKULUM: currentUser?.name || session.name || '',
      NIP_WAKASEK_KURIKULUM: currentUser?.nip || '',
    };

    return NextResponse.json({
      success: true,
      message: 'Template berhasil diunggah dan dianalisis.',
      templateUrl: saveResult.url,
      templateFileName: saveResult.filename || fileName,
      originalFileName: fileName,
      placeholders: analysis.placeholders,
      schoolHints,
    });
  } catch (error: any) {
    console.error('Error in POST /api/curriculum/sk/upload-template:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat memproses template.' },
      { status: 500 }
    );
  }
}
