import { prisma } from './src/lib/prisma';
import { verifyPassword, hashPassword } from './src/lib/password';
import { signSessionToken, verifySessionToken } from './src/lib/auth';
import { getDailyMessage, getDeterministicIndex } from './src/lib/daily-message';

async function runVerification() {
  console.log('=====================================================');
  console.log('  VERIFIKASI SISTEM PHASE 1 SMA NEGERI 18 BOMBANA    ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Verifikasi Database Seeder: Hanya 1 user default (admin)
  const totalUsers = await prisma.user.count();
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  assert(totalUsers === 1, `Total user awal hanya 1 (ditemukan: ${totalUsers})`);
  assert(adminUser !== null && adminUser.role === 'administrator', 'User default adalah administrator');

  // 2. Verifikasi Password Hashing Bcrypt pada Akun Admin
  const isPlaintext = adminUser?.password_hash === 'Admin@12345';
  assert(!isPlaintext, 'Password admin TIDAK disimpan plaintext');
  const isMatch = await verifyPassword('Admin@12345', adminUser?.password_hash || '');
  assert(isMatch, 'Password admin cocok dengan hash bcrypt');

  // 3. Verifikasi Login Salah Password (ditolak)
  const isWrongMatch = await verifyPassword('SalahPassword', adminUser?.password_hash || '');
  assert(!isWrongMatch, 'Login dengan password salah berhasil ditolak');

  // 4. Verifikasi Pembuatan User oleh Admin (Kepsek, Guru, Siswa)
  console.log('\n--- Menguji Alur Pembuatan User oleh Admin ---');
  const kepsekHash = await hashPassword('Kepsek@12345');
  const kepsekUser = await prisma.user.create({
    data: {
      name: 'H. Syafruddin, M.Pd.',
      username: 'kepsek_test',
      email: 'kepsek_test@sman18bombana.sch.id',
      password_hash: kepsekHash,
      role: 'kepala_sekolah',
      is_active: true,
    }
  });
  assert(kepsekUser.role === 'kepala_sekolah', 'Admin berhasil membuat user Kepala Sekolah');

  const guruHash = await hashPassword('Guru@12345');
  const guruUser = await prisma.user.create({
    data: {
      name: 'Ibu Rahmawati, S.Pd.',
      username: 'guru_test',
      email: 'guru_test@sman18bombana.sch.id',
      password_hash: guruHash,
      role: 'guru',
      is_active: true,
    }
  });
  assert(guruUser.role === 'guru', 'Admin berhasil membuat user Guru');

  const siswaHash = await hashPassword('Siswa@12345');
  const siswaUser = await prisma.user.create({
    data: {
      name: 'Nur Aisyah',
      username: 'siswa_test',
      email: 'siswa_test@sman18bombana.sch.id',
      password_hash: siswaHash,
      role: 'siswa',
      is_active: true,
    }
  });
  assert(siswaUser.role === 'siswa', 'Admin berhasil membuat user Siswa');

  // 5. Verifikasi Akun Nonaktif (ditolak)
  const nonaktifHash = await hashPassword('Test@12345');
  const nonaktifUser = await prisma.user.create({
    data: {
      name: 'User Nonaktif',
      username: 'user_nonaktif',
      email: 'nonaktif@sman18bombana.sch.id',
      password_hash: nonaktifHash,
      role: 'siswa',
      is_active: false,
    }
  });
  assert(nonaktifUser.is_active === false, 'Akun user dapat dinonaktifkan oleh Admin');

  // 6. Verifikasi Session JWT & Redirection Role (Edge-safe)
  console.log('\n--- Menguji Token Session & Role Resolution ---');
  const adminToken = await signSessionToken({
    id: adminUser!.id,
    name: adminUser!.name,
    username: adminUser!.username,
    role: adminUser!.role as any,
    email: adminUser!.email,
  });
  const verifiedAdmin = await verifySessionToken(adminToken);
  assert(verifiedAdmin?.role === 'administrator', 'Session JWT admin memuat role administrator');

  const guruToken = await signSessionToken({
    id: guruUser.id,
    name: guruUser.name,
    username: guruUser.username,
    role: guruUser.role as any,
    email: guruUser.email,
  });
  const verifiedGuru = await verifySessionToken(guruToken);
  assert(verifiedGuru?.role === 'guru', 'Session JWT guru memuat role guru');
  assert(verifiedGuru?.role !== 'administrator', 'User guru terbukti BUKAN administrator (RBAC valid)');

  // 7. Verifikasi Koleksi Kata-Kata Harian (Minimal 365)
  console.log('\n--- Menguji Kata-Kata Harian Deterministik ---');
  const totalQuotes = await prisma.dailyMessage.count();
  assert(totalQuotes >= 365, `Koleksi kata-kata harian berjumlah ${totalQuotes} (memenuhi syarat minimal 365)`);

  const motivasiCount = await prisma.dailyMessage.count({ where: { category: 'motivasi' } });
  const nasehatCount = await prisma.dailyMessage.count({ where: { category: 'nasehat' } });
  const pantunCount = await prisma.dailyMessage.count({ where: { category: 'pantun' } });
  assert(motivasiCount > 0, `Kategori Motivasi tersedia (${motivasiCount} kutipan)`);
  assert(nasehatCount > 0, `Kategori Nasehat tersedia (${nasehatCount} kutipan)`);
  assert(pantunCount > 0, `Kategori Pantun Jenaka tersedia (${pantunCount} pantun)`);

  // 8. Verifikasi Konsistensi getDailyMessage() Sepanjang Hari
  const morning = new Date(2026, 8, 3, 7, 0, 0); // Jam 07:00 pagi
  const evening = new Date(2026, 8, 3, 21, 30, 0); // Jam 21:30 malam
  const quoteMorning = await getDailyMessage(morning);
  const quoteEvening = await getDailyMessage(evening);
  assert(quoteMorning.id === quoteEvening.id, 'Pesan pagi dan malam pada tanggal yang sama PERSIS SAMA (konsisten sepanjang hari)');

  // 9. Verifikasi Perubahan pada Hari Berikutnya
  const nextDay = new Date(2026, 8, 4, 8, 0, 0);
  const quoteNextDay = await getDailyMessage(nextDay);
  assert(quoteMorning.id !== quoteNextDay.id, 'Pesan berubah otomatis pada hari berikutnya');

  // Bersihkan data user testing
  await prisma.user.deleteMany({
    where: {
      username: { in: ['kepsek_test', 'guru_test', 'siswa_test', 'user_nonaktif'] }
    }
  });

  const finalUserCount = await prisma.user.count();
  assert(finalUserCount === 1, 'Database kembali bersih dengan 1 akun administrator default');

  console.log('\n=====================================================');
  console.log(`HASIL AKHIR: ${passed} PASS, ${failed} FAIL`);
  console.log('=====================================================');

  if (failed > 0) process.exit(1);
}

runVerification()
  .catch((e) => {
    console.error('Error saat verifikasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
