import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyEbookReadAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// GET: Baca / Alirkan (Stream) dokumen e-book secara terproteksi
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  // 1. Verifikasi Autentikasi & RBAC (Siswa, Administrator, Kepala Perpustakaan)
  const { session, errorResponse } = await verifyEbookReadAccess(request);
  if (errorResponse || !session) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID e-book wajib disertakan.' }, { status: 400 });
  }

  try {
    // 2. Lookup EBook by ID
    const ebook = await prisma.eBook.findUnique({
      where: { id },
    });

    if (!ebook) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 3. Siswa HANYA boleh membaca yang is_published = true
    if (session.role === 'siswa' && !ebook.is_published) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak ditemukan atau belum dipublikasikan.' },
        { status: 404 }
      );
    }

    // 4. Ambil berkas dari media penyimpanan (Cloud Storage atau Local Fallback)
    let fileBuffer: Buffer | ArrayBuffer;

    if (ebook.file_url.startsWith('http://') || ebook.file_url.startsWith('https://')) {
      // Remote Vercel Blob Storage
      const storageRes = await fetch(ebook.file_url);
      if (!storageRes.ok) {
        return NextResponse.json(
          { error: 'Gagal mengambil berkas e-book dari media penyimpanan cloud.' },
          { status: 502 }
        );
      }
      fileBuffer = await storageRes.arrayBuffer();
    } else if (ebook.file_url.startsWith('/uploads/')) {
      // Local Storage Fallback
      const relativePath = ebook.file_url.replace(/^\/uploads\//, '');
      const safeRelativePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
      const localFilePath = path.join(process.cwd(), 'public', 'uploads', safeRelativePath);

      if (!fs.existsSync(localFilePath)) {
        return NextResponse.json(
          { error: 'Berkas e-book tidak ditemukan pada media penyimpanan lokal.' },
          { status: 404 }
        );
      }
      fileBuffer = fs.readFileSync(localFilePath);
    } else {
      return NextResponse.json(
        { error: 'Konfigurasi path berkas e-book tidak valid.' },
        { status: 500 }
      );
    }

    // 5. Atomic Counter: Naikkan download_count secara atomic setelah berkas terverifikasi
    await prisma.eBook.update({
      where: { id: ebook.id },
      data: {
        download_count: { increment: 1 },
      },
    });

    // 6. Siapkan Header HTTP Streaming
    const isPdf = ebook.mime_type === 'application/pdf';
    // PDF ditampilkan secara inline agar reader peramban dapat merender langsung
    // EPUB disajikan sebagai attachment unduh
    const dispositionType = isPdf ? 'inline' : 'attachment';
    const safeFileName = encodeURIComponent(ebook.file_name);

    const headers = new Headers();
    headers.set('Content-Type', ebook.mime_type || (isPdf ? 'application/pdf' : 'application/octet-stream'));
    headers.set(
      'Content-Disposition',
      `${dispositionType}; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`
    );
    headers.set(
      'Content-Length',
      String(Buffer.isBuffer(fileBuffer) ? fileBuffer.length : fileBuffer.byteLength)
    );
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/ebooks/[id]/read:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses pembacaan berkas e-book.' },
      { status: 500 }
    );
  }
}
