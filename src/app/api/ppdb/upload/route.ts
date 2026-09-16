import { NextRequest, NextResponse } from 'next/server';
import { savePpdbDocument } from '@/lib/ppdb-storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'dokumen-pendukung';
    const applicantId = (formData.get('applicantId') as string) || `pendaftar-${Date.now()}`;

    if (!file) {
      return NextResponse.json(
        { error: 'Berkas upload tidak ditemukan. Pastikan Anda telah memilih dokumen.' },
        { status: 400 }
      );
    }

    const result = await savePpdbDocument(file, category, applicantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Gagal mengunggah berkas.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Berkas persyaratan berhasil diunggah.',
      data: {
        url: result.url,
        applicantId: result.applicantId,
        category: result.category,
        fileName: result.fileName,
        originalName: result.originalName,
        sizeBytes: result.sizeBytes,
        mimeType: result.mimeType,
      },
    });
  } catch (error: any) {
    console.error('API PPDB Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat memproses unggahan dokumen.' },
      { status: 500 }
    );
  }
}
