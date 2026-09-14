import { prisma } from './prisma';

/**
 * Menghitung hari ke-N dalam setahun (1 - 366)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Algoritma Pseudo-Acak Deterministik:
 * Menghasilkan indeks yang konsisten sepanjang hari untuk tanggal yang sama,
 * dan teracak secara merata antar hari berdekatan tanpa repetisi yang membosankan.
 */
export function getDeterministicIndex(date: Date, totalCount: number): number {
  if (totalCount <= 1) return 0;
  const year = date.getFullYear();
  const day = getDayOfYear(date);
  // Linear Congruential Hash sederhana berbasis tanggal
  const hash = Math.abs((year * 397 + day * 1013) % 1000003);
  return hash % totalCount;
}

/**
 * Mengambil kata-kata harian untuk tanggal hari ini dari database.
 * Jika database belum siap, mengembalikan pesan inspiratif fallback.
 */
export async function getDailyMessage(targetDate: Date = new Date()) {
  try {
    const activeMessages = await prisma.dailyMessage.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });

    if (!activeMessages || activeMessages.length === 0) {
      return {
        id: 'fallback',
        content: 'Mari kita jadikan sekolah sebagai tempat untuk tumbuh, belajar, berkarya, dan mempersiapkan masa depan.',
        category: 'motivasi',
        author: 'SMA Negeri 18 Bombana',
      };
    }

    const index = getDeterministicIndex(targetDate, activeMessages.length);
    return activeMessages[index];
  } catch (err) {
    console.error('Error saat mengambil kata-kata harian:', err);
    return {
      id: 'fallback',
      content: 'Kesuksesan bukan tentang siapa yang paling cepat, tetapi siapa yang tidak berhenti melangkah.',
      category: 'motivasi',
      author: 'Motivasi SMAN 18',
    };
  }
}
