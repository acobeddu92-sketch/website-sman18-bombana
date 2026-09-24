import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { put, del } from '@vercel/blob';

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Menyimpan berkas SK (Template atau Hasil Dokumen) ke Vercel Blob dengan partisi folder berbasis tahun.
 * Dilengkapi fallback lokal untuk kemudahan pengembangan offline.
 */
export async function saveSKFile(
  buffer: Buffer,
  originalFilename: string,
  type: 'template' | 'document'
): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
  try {
    if (!buffer || buffer.length === 0) {
      return { success: false, error: 'Buffer berkas kosong.' };
    }

    const year = new Date().getFullYear().toString();
    const cleanBaseName = path.basename(originalFilename, path.extname(originalFilename))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const uniqueSuffix = crypto.randomUUID().slice(0, 8);
    const savedFilename = `${cleanBaseName}_${uniqueSuffix}.docx`;

    // Folder: /sk/templates/2026/ atau /sk/documents/2026/
    const subFolder = type === 'template' ? 'templates' : 'documents';
    const blobPathname = `sk/${subFolder}/${year}/${savedFilename}`;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const isVercelEnv = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

    // Di environment Vercel atau jika token tersedia: simpan ke Vercel Blob
    if (blobToken || isVercelEnv) {
      if (!blobToken) {
        console.error('Storage Error: BLOB_READ_WRITE_TOKEN belum disetel.');
        return {
          success: false,
          error: 'Penyimpanan cloud Vercel Blob belum terkonfigurasi token BLOB_READ_WRITE_TOKEN.',
        };
      }

      const blob = await put(blobPathname, buffer, {
        access: 'public',
        contentType: DOCX_MIME_TYPE,
        addRandomSuffix: false,
        token: blobToken,
      });

      return {
        success: true,
        url: blob.url,
        filename: savedFilename,
      };
    }

    // Fallback pengembangan lokal (Offline development)
    const localDir = path.join(process.cwd(), 'public', 'uploads', 'sk', subFolder, year);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    const localFilePath = path.join(localDir, savedFilename);
    fs.writeFileSync(localFilePath, buffer);

    const localUrl = `/uploads/sk/${subFolder}/${year}/${savedFilename}`;
    return {
      success: true,
      url: localUrl,
      filename: savedFilename,
    };
  } catch (error: any) {
    console.error('Error in saveSKFile:', error);
    return {
      success: false,
      error: error.message || 'Gagal menyimpan berkas SK.',
    };
  }
}

/**
 * Menghapus berkas dari Vercel Blob atau penyimpanan lokal
 */
export async function deleteSKFile(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl) return false;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (fileUrl.includes('blob.vercel-storage.com') && blobToken) {
      await del(fileUrl, { token: blobToken });
      return true;
    }

    if (fileUrl.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), 'public', fileUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        return true;
      }
    }

    return true;
  } catch (err) {
    console.error('Error deleting SK file:', err);
    return false;
  }
}
