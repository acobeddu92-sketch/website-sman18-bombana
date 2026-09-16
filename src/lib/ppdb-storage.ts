import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { put } from '@vercel/blob';

export interface PpdbUploadResult {
  success: boolean;
  url?: string;
  applicantId?: string;
  category?: string;
  fileName?: string;
  originalName?: string;
  sizeBytes?: number;
  mimeType?: string;
  error?: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const EXTENSION_MAP: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Menyimpan berkas persyaratan calon peserta didik PPDB.
 * Menggunakan Vercel Blob Storage dengan path khusus: ppdb/{applicantId}/...
 * Terisolasi penuh dari galeri sekolah dan aset lainnya.
 */
export async function savePpdbDocument(
  file: File,
  category: string,
  applicantId: string = 'pendaftar-baru'
): Promise<PpdbUploadResult> {
  try {
    if (!file || typeof file.arrayBuffer !== 'function') {
      return { success: false, error: 'Berkas tidak valid atau kosong.' };
    }

    // 1. Validasi Ukuran File (Maks 5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: `Ukuran berkas melebihi batas maksimal (5 MB). Ukuran saat ini: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
      };
    }

    // 2. Validasi MIME Type
    const mimeType = file.type?.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        error: `Format berkas (${file.type || 'tidak diketahui'}) tidak diizinkan. Gunakan format PDF, JPG, PNG, atau WEBP.`,
      };
    }

    // 3. Tentukan ekstensi aman
    const safeExt =
      EXTENSION_MAP[mimeType] ||
      path.extname(file.name).toLowerCase() ||
      '.pdf';

    // 4. Sanitasi Applicant ID dan Kategori Dokumen (hanya karakter aman)
    const sanitizedId = applicantId.replace(/[^a-zA-Z0-9_-]/g, '') || 'pendaftar';
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9_-]/g, '') || 'berkas';

    // 5. Buat nama file acak unik untuk keamanan dan privasi
    const uniqueToken = crypto.randomUUID().slice(0, 12);
    const fileName = `${sanitizedCategory}-${uniqueToken}${safeExt}`;
    const blobPathname = `ppdb/${sanitizedId}/${fileName}`;

    // 6. Cek Vercel Blob Token
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const isVercelEnv = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

    if (blobToken || isVercelEnv) {
      if (!blobToken) {
        console.error('[PPDB Storage Error] BLOB_READ_WRITE_TOKEN belum dikonfigurasi di environment Vercel.');
        return {
          success: false,
          error: 'Penyimpanan cloud Vercel Blob belum terkonfigurasi. Pastikan BLOB_READ_WRITE_TOKEN telah disetel di environment.',
        };
      }

      // Upload langsung ke Vercel Blob Storage
      const blob = await put(blobPathname, file, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: false,
        token: blobToken,
      });

      return {
        success: true,
        url: blob.url,
        applicantId: sanitizedId,
        category: sanitizedCategory,
        fileName,
        originalName: file.name,
        sizeBytes: file.size,
        mimeType,
      };
    }

    // 7. Fallback untuk Pengembangan Lokal jika tanpa Token Vercel
    console.warn(
      `[PPDB Storage] BLOB_READ_WRITE_TOKEN tidak terdeteksi. Menyimpan berkas PPDB ke penyimpanan lokal development: public/uploads/ppdb/${sanitizedId}`
    );

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ppdb', sanitizedId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const targetFilePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = `/uploads/ppdb/${sanitizedId}/${fileName}`;

    return {
      success: true,
      url: publicUrl,
      applicantId: sanitizedId,
      category: sanitizedCategory,
      fileName,
      originalName: file.name,
      sizeBytes: file.size,
      mimeType,
    };
  } catch (error: any) {
    console.error('[PPDB Storage Error saat menyimpan berkas]:', error);
    return {
      success: false,
      error: error.message || 'Gagal menyimpan berkas PPDB ke sistem penyimpanan.',
    };
  }
}
