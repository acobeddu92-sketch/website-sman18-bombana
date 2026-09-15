import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { put, del } from '@vercel/blob';

export interface UploadOptions {
  allowedMimeTypes?: string[];
  maxSizeMB?: number;
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

/**
 * Menyimpan file upload menggunakan Vercel Blob (kompatibel penuh dengan Vercel deployment)
 * Dilengkapi fallback lokal untuk kemudahan pengembangan offline/lokal jika token belum disetel.
 */
export async function saveUploadedFile(
  file: File,
  folder: string,
  options?: UploadOptions
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!file || typeof file.arrayBuffer !== 'function') {
      return { success: false, error: 'File tidak valid atau kosong.' };
    }

    const allowedTypes = options?.allowedMimeTypes || DEFAULT_ALLOWED_TYPES;
    const maxSizeMB = options?.maxSizeMB || 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // 1. Validasi Ukuran File
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        error: `Ukuran file melebihi batas maksimal (${maxSizeMB} MB).`,
      };
    }

    // 2. Validasi MIME Type
    const mimeType = file.type?.toLowerCase();
    if (!allowedTypes.includes(mimeType)) {
      return {
        success: false,
        error: `Format file tidak diizinkan (${file.type}). Gunakan format JPG, PNG, WEBP, atau SVG.`,
      };
    }

    // 3. Tentukan ekstensi yang aman
    const safeExt =
      EXTENSION_MAP[mimeType] ||
      path.extname(file.name).toLowerCase() ||
      '.jpg';

    // 4. Bersihkan nama folder target
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';

    // 5. Buat nama file unik menggunakan UUID
    const randomName = `${crypto.randomUUID()}${safeExt}`;
    const blobPathname = `${sanitizedFolder}/${randomName}`;

    // 6. Cek lingkungan Vercel & token Vercel Blob
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const isVercelEnv = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

    // Di environment Vercel atau jika BLOB_READ_WRITE_TOKEN disediakan:
    if (blobToken || isVercelEnv) {
      if (!blobToken) {
        console.error('Storage Error: BLOB_READ_WRITE_TOKEN belum disetel di environment Vercel.');
        return {
          success: false,
          error:
            'Penyimpanan cloud (Vercel Blob) belum terkonfigurasi. Pastikan BLOB_READ_WRITE_TOKEN telah disetel di dashboard Vercel.',
        };
      }

      // Simpan ke Vercel Blob Storage
      const blob = await put(blobPathname, file, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: false,
        token: blobToken,
      });

      return { success: true, url: blob.url };
    }

    // 7. Fallback untuk Local Development tanpa token Vercel Blob
    console.warn(
      '[Storage] BLOB_READ_WRITE_TOKEN tidak ditemukan. Menyimpan ke folder publik lokal untuk development.'
    );
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const targetFilePath = path.join(uploadDir, randomName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = `/uploads/${sanitizedFolder}/${randomName}`;
    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Storage Error saat menyimpan file:', error);
    return {
      success: false,
      error: error.message || 'Gagal menyimpan file ke sistem penyimpanan.',
    };
  }
}

/**
 * Menghapus file upload secara aman:
 * - Menghapus dari Vercel Blob jika URL berasal dari Vercel Storage
 * - Menghapus file lokal legacy (/uploads/...) jika ada
 * - Menjaga file statis bawaan sistem (/images/...) agar tidak terhapus
 */
export async function deleteUploadedFile(fileUrl?: string | null): Promise<boolean> {
  try {
    if (!fileUrl) {
      return false;
    }

    // 1. Jangan hapus aset bawaan sistem (/images/...)
    if (fileUrl.startsWith('/images/')) {
      return false;
    }

    // 2. Jika merupakan file Vercel Blob Storage
    if (fileUrl.includes('blob.vercel-storage.com')) {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      try {
        await del(fileUrl, blobToken ? { token: blobToken } : undefined);
        return true;
      } catch (blobErr) {
        console.warn('Storage Warning: Gagal menghapus blob di Vercel Storage:', blobErr);
        return false;
      }
    }

    // 3. Jika merupakan file lokal legacy (/uploads/...)
    if (fileUrl.startsWith('/uploads/')) {
      // Cegah path traversal
      const relativePath = fileUrl.replace(/^\/uploads\//, '');
      const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
      const absolutePath = path.join(process.cwd(), 'public', 'uploads', safePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        return true;
      }
      return false;
    }

    return false;
  } catch (error) {
    console.error('Storage Error saat menghapus file:', error);
    return false;
  }
}
