import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
 * Menyimpan file upload ke disk lokal (public/uploads/<folder>)
 * Dapat dengan mudah diganti ke S3/Cloud Storage di masa mendatang.
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

    // 4. Buat direktori target jika belum ada
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 5. Buat nama file unik menggunakan UUID
    const randomName = `${crypto.randomUUID()}${safeExt}`;
    const targetFilePath = path.join(uploadDir, randomName);

    // 6. Tulis file ke filesystem
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
 * Menghapus file dari direktori uploads lokal secara aman
 * Hanya menghapus file yang berada di dalam folder /uploads/
 */
export async function deleteUploadedFile(fileUrl?: string | null): Promise<boolean> {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      // Tidak menghapus jika bukan file upload pengguna (misal file bawaan /images/...)
      return false;
    }

    // Cegah path traversal
    const relativePath = fileUrl.replace(/^\/uploads\//, '');
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', safePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Storage Error saat menghapus file:', error);
    return false;
  }
}
