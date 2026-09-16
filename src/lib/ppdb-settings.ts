import fs from 'fs';
import path from 'path';

export interface PpdbQuotas {
  zonasi: number;
  afirmasi: number;
  prestasi: number;
  perpindahan: number;
}

export interface PpdbSettings {
  registrationUrl: string; // URL Pendaftaran Online (jika kosong = "Link pendaftaran belum tersedia")
  registrationStatus: 'open' | 'closed' | 'coming_soon';
  academicYear: string;
  startDate: string;
  endDate: string;
  announcementDate: string;
  reRegistrationDate: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  quotas: PpdbQuotas;
}

const DEFAULT_PPDB_SETTINGS: PpdbSettings = {
  registrationUrl: '', // Default kosong, sehingga tampil "Link pendaftaran belum tersedia"
  registrationStatus: 'coming_soon',
  academicYear: '2026/2027',
  startDate: '2026-06-15',
  endDate: '2026-07-10',
  announcementDate: '2026-07-15',
  reRegistrationDate: '2026-07-16 s/d 2026-07-20',
  contactPhone: '+62 821-9988-7766',
  contactEmail: 'ppdb@sman18bombana.sch.id',
  notes: 'Pendaftaran PPDB SMA Negeri 18 Bombana Tahun Ajaran 2026/2027 dapat dilakukan secara daring maupun langsung di sekretariat panitia sekolah.',
  quotas: {
    zonasi: 50,
    afirmasi: 15,
    prestasi: 30,
    perpindahan: 5,
  },
};

// In-memory cache untuk mendukung serverless
let memoryCache: PpdbSettings = { ...DEFAULT_PPDB_SETTINGS };

function getFilePath(): string {
  return path.join(process.cwd(), 'src', 'lib', 'ppdb-settings.json');
}

/**
 * Mengambil pengaturan konfigurasi PPDB saat ini
 */
export function getPpdbSettings(): PpdbSettings {
  try {
    const filePath = getFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      memoryCache = {
        ...DEFAULT_PPDB_SETTINGS,
        ...parsed,
        quotas: {
          ...DEFAULT_PPDB_SETTINGS.quotas,
          ...(parsed.quotas || {}),
        },
      };
      return memoryCache;
    }
  } catch (err) {
    console.warn('[PPDB Settings] Menggunakan memory cache fallback:', err);
  }
  return memoryCache;
}

/**
 * Memperbarui pengaturan konfigurasi PPDB oleh Administrator
 */
export function updatePpdbSettings(newSettings: Partial<PpdbSettings>): PpdbSettings {
  const current = getPpdbSettings();
  const updated: PpdbSettings = {
    ...current,
    ...newSettings,
    quotas: {
      zonasi: newSettings.quotas?.zonasi ?? current.quotas.zonasi,
      afirmasi: newSettings.quotas?.afirmasi ?? current.quotas.afirmasi,
      prestasi: newSettings.quotas?.prestasi ?? current.quotas.prestasi,
      perpindahan: newSettings.quotas?.perpindahan ?? current.quotas.perpindahan,
    },
  };

  memoryCache = updated;

  try {
    const filePath = getFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[PPDB Settings] Tidak dapat menulis ke filesystem (mungkin serverless), cache memori diperbarui:', err);
  }

  return updated;
}
