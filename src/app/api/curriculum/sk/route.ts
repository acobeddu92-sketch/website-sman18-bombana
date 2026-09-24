import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';
import { generateDocxDocument } from '@/lib/docx-template';
import { saveSKFile } from '@/lib/sk-storage';
import { getSKList, getSKByNomor, saveSK } from '@/lib/sk-archive-store';

export const dynamic = 'force-dynamic';

// GET: Penarikan Daftar Arsip SK Kurikulum & School Hints
export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim();
  const year = searchParams.get('year')?.trim();
  const month = searchParams.get('month')?.trim();

  try {
    const [skList, principal, currentUser, userKepsek] = await Promise.all([
      getSKList(search, year, month),
      prisma.principalProfile.findFirst({ select: { name: true } }),
      prisma.user.findUnique({
        where: { id: session.id },
        select: { name: true, nip: true },
      }),
      prisma.user.findFirst({
        where: { role: 'kepala_sekolah', is_active: true },
        select: { name: true, nip: true },
      }),
    ]);

    const schoolHints = {
      NAMA_KEPALA_SEKOLAH: principal?.name || userKepsek?.name || '',
      NIP_KEPALA_SEKOLAH: userKepsek?.nip || '',
      NAMA_WAKASEK_KURIKULUM: currentUser?.name || session.name || '',
      NIP_WAKASEK_KURIKULUM: currentUser?.nip || '',
    };

    return NextResponse.json({
      success: true,
      count: skList.length,
      skList,
      schoolHints,
    });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/sk:', error);
    return NextResponse.json(
      { error: 'Gagal memuat arsip Surat Keputusan.' },
      { status: 500 }
    );
  }
}

// POST: Pembuatan Dokumen SK Baru Berdasarkan Template DOCX dan Penyimpanan ke Arsip
export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      nomor,
      tanggal,
      tentang,
      templateUrl,
      templateFileName,
      placeholderValues,
    } = body;

    // 1. Validasi Input Wajib
    if (!nomor || !nomor.trim()) {
      return NextResponse.json(
        { error: 'Nomor SK wajib diisi.' },
        { status: 400 }
      );
    }
    if (!tanggal || !tanggal.trim()) {
      return NextResponse.json(
        { error: 'Tanggal SK wajib diisi.' },
        { status: 400 }
      );
    }
    if (!tentang || !tentang.trim()) {
      return NextResponse.json(
        { error: 'Tentang / Judul SK wajib diisi.' },
        { status: 400 }
      );
    }
    if (!templateUrl || !templateUrl.trim()) {
      return NextResponse.json(
        { error: 'Berkas template DOCX belum diunggah.' },
        { status: 400 }
      );
    }

    // 2. Validasi Nomor SK Unik (Cek apakah nomor sudah pernah digunakan)
    const existingSK = await getSKByNomor(nomor);
    if (existingSK) {
      return NextResponse.json(
        {
          error: `Nomor SK '${nomor}' sudah terdaftar dalam arsip (${existingSK.tentang}). Harap gunakan nomor yang berbeda.`,
        },
        { status: 400 }
      );
    }

    // 3. Baca Buffer Berkas Template
    let templateBuffer: Buffer;
    if (templateUrl.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), 'public', templateUrl);
      if (!fs.existsSync(localPath)) {
        return NextResponse.json(
          { error: 'Berkas template tidak ditemukan di server.' },
          { status: 404 }
        );
      }
      templateBuffer = fs.readFileSync(localPath);
    } else {
      const res = await fetch(templateUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Gagal mengunduh berkas template dari penyimpanan cloud.' },
          { status: 502 }
        );
      }
      const arrayBuffer = await res.arrayBuffer();
      templateBuffer = Buffer.from(arrayBuffer);
    }

    // 4. Siapkan Data Penggantian Placeholder
    const dataToRender: Record<string, string> = {
      ...(placeholderValues || {}),
      NOMOR_SK: nomor.trim(),
      TANGGAL_SK: tanggal.trim(),
      TENTANG: tentang.trim(),
    };

    // 5. Generate Dokumen Word (.docx) Menggunakan docxtemplater
    const genResult = generateDocxDocument(templateBuffer, dataToRender);
    if (!genResult.success || !genResult.buffer) {
      return NextResponse.json(
        { error: genResult.error || 'Gagal menghasilkan dokumen SK dari template.' },
        { status: 500 }
      );
    }

    // 6. Simpan Dokumen SK Hasil ke Folder /sk/documents/
    const safeDocName = `SK_${nomor.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
    const docSaveResult = await saveSKFile(genResult.buffer, safeDocName, 'document');
    if (!docSaveResult.success || !docSaveResult.url) {
      return NextResponse.json(
        { error: docSaveResult.error || 'Gagal menyimpan berkas dokumen hasil SK ke penyimpanan.' },
        { status: 500 }
      );
    }

    // 7. Simpan Metadata ke Database / Arsip (created_by murni dari session.id)
    const newRecord = await saveSK({
      nomor: nomor.trim(),
      tanggal: tanggal.trim(),
      tentang: tentang.trim(),
      template_file_name: templateFileName || 'template.docx',
      template_file_url: templateUrl,
      document_file_name: docSaveResult.filename || safeDocName,
      document_file_url: docSaveResult.url,
      placeholders_used: JSON.stringify(dataToRender),
      created_by_id: session.id,
      creator: {
        id: session.id,
        name: session.name,
        role: session.role,
        username: session.username,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Surat Keputusan (SK) berhasil dibuat, digenerate, dan disimpan ke arsip resmi.',
      sk: newRecord,
      documentUrl: docSaveResult.url,
      documentFileName: docSaveResult.filename || safeDocName,
    });
  } catch (error: any) {
    console.error('Error in POST /api/curriculum/sk:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat membuat SK.' },
      { status: 500 }
    );
  }
}
