import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export interface SKRecord {
  id: string;
  nomor: string;
  tanggal: string;
  tentang: string;
  template_file_name: string;
  template_file_url: string;
  document_file_name: string;
  document_file_url: string;
  placeholders_used: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
    role: string;
    username?: string;
  };
}

const FALLBACK_FILE_PATH = path.join(process.cwd(), 'public', 'uploads', 'sk', 'archive_fallback.json');

function readFallbackList(): SKRecord[] {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const raw = fs.readFileSync(FALLBACK_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading fallback archive:', e);
  }
  return [];
}

function writeFallbackList(list: SKRecord[]) {
  try {
    const dir = path.dirname(FALLBACK_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing fallback archive:', e);
  }
}

/**
 * Mengambil daftar arsip SK dari database Prisma atau fallback jika tabel belum di-push
 */
export async function getSKList(search?: string, year?: string, month?: string): Promise<SKRecord[]> {
  try {
    const whereClause: any = {};
    if (search && search.trim()) {
      whereClause.OR = [
        { nomor: { contains: search.trim(), mode: 'insensitive' } },
        { tentang: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const items = await (prisma as any).suratKeputusan.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { id: true, name: true, role: true, username: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    let result = items.map((i: any) => ({
      ...i,
      created_at: i.created_at.toISOString(),
      updated_at: i.updated_at.toISOString(),
    }));

    // Filter tanggal jika diberikan
    if (year && year !== 'all') {
      result = result.filter((i: any) => i.tanggal.includes(year) || i.created_at.startsWith(year));
    }

    return result;
  } catch (err: any) {
    // Fallback bila tabel database belum dimigrasikan
    console.warn('Tabel database surat_keputusan belum dimigrasikan, menggunakan repositori arsip aman:', err.message);
    let list = readFallbackList();
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => i.nomor.toLowerCase().includes(q) || i.tentang.toLowerCase().includes(q));
    }
    if (year && year !== 'all') {
      list = list.filter((i) => i.tanggal.includes(year) || i.created_at.startsWith(year));
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

/**
 * Mencari satu SK berdasarkan ID
 */
export async function getSKById(id: string): Promise<SKRecord | null> {
  try {
    const item = await (prisma as any).suratKeputusan.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, role: true, username: true },
        },
      },
    });
    if (item) {
      return {
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString(),
      };
    }
  } catch {
    // Fallback
  }

  const fallback = readFallbackList().find((i) => i.id === id);
  return fallback || null;
}

/**
 * Mencari SK berdasarkan nomor SK
 */
export async function getSKByNomor(nomor: string): Promise<SKRecord | null> {
  try {
    const item = await (prisma as any).suratKeputusan.findUnique({
      where: { nomor: nomor.trim() },
    });
    if (item) {
      return {
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString(),
      };
    }
  } catch {
    // Fallback
  }

  const fallback = readFallbackList().find(
    (i) => i.nomor.trim().toLowerCase() === nomor.trim().toLowerCase()
  );
  return fallback || null;
}

/**
 * Menyimpan SK baru
 */
export async function saveSK(record: Omit<SKRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SKRecord> {
  const now = new Date();
  try {
    const created = await (prisma as any).suratKeputusan.create({
      data: {
        nomor: record.nomor.trim(),
        tanggal: record.tanggal.trim(),
        tentang: record.tentang.trim(),
        template_file_name: record.template_file_name,
        template_file_url: record.template_file_url,
        document_file_name: record.document_file_name,
        document_file_url: record.document_file_url,
        placeholders_used: record.placeholders_used,
        created_by_id: record.created_by_id,
      },
      include: {
        creator: {
          select: { id: true, name: true, role: true, username: true },
        },
      },
    });

    return {
      ...created,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    };
  } catch (err: any) {
    console.warn('Gagal menyimpan ke tabel Prisma (menunggu migrasi), menyimpan ke fallback arsip:', err.message);
    const newRecord: SKRecord = {
      ...record,
      id: `sk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    const list = readFallbackList();
    list.unshift(newRecord);
    writeFallbackList(list);
    return newRecord;
  }
}

/**
 * Menghapus SK berdasarkan ID
 */
export async function deleteSK(id: string): Promise<boolean> {
  try {
    await (prisma as any).suratKeputusan.delete({
      where: { id },
    });
    return true;
  } catch {
    // Fallback
  }

  const list = readFallbackList();
  const filtered = list.filter((i) => i.id !== id);
  if (filtered.length !== list.length) {
    writeFallbackList(filtered);
    return true;
  }
  return false;
}
