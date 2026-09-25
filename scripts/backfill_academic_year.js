/**
 * Script Backfill Aman & Atomik: Menghubungkan Class existing ke AcademicYear.
 * 
 * Aturan Ketat:
 * 1. Fail-Safe: Jika ditemukan Class tanpa academic_year (NULL / ''), BATALKAN seluruh proses.
 * 2. Pre-audit Duplikasi: Deteksi konflik nama, kode, dan wali kelas sebelum mutasi.
 * 3. Atomic: Seluruh operasi dijalankan di dalam prisma.$transaction (semua sukses atau semua rollback).
 * 4. No Hardcoded Active Year:
 *    - Jika sudah ada tahun aktif: pertahankan.
 *    - Jika belum ada dan HANYA ADA 1 tahun ajaran unik: jadikan aktif.
 *    - Jika belum ada dan ADA >1 tahun ajaran unik: STOP dan minta penentuan eksplisit.
 * 5. Validasi Pasca-Backfill menyeluruh (0 NULL, integritas Student & Class terjaga).
 * 6. Safety log komprehensif.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runBackfill() {
  console.log('================================================================');
  console.log('AUDIT & ATOMIC BACKFILL MASTER TAHUN AJARAN & KELAS');
  console.log('SMA NEGERI 18 BOMBANA - SINGLE SOURCE OF TRUTH');
  console.log('================================================================\n');

  // ============================================================================
  // TAHAP 1: PRE-FLIGHT AUDIT & SAFETY LOG (READ-ONLY)
  // ============================================================================
  console.log('--- TAHAP 1: PRE-FLIGHT AUDIT & INSPEKSI DATA ---');

  // 1. Ambil data awal Class & Student
  const initialClasses = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
      grade: true,
      code: true,
      academic_year: true,
      academic_year_id: true,
      homeroom_teacher_id: true,
    },
    orderBy: [{ grade: 'asc' }, { name: 'asc' }],
  });

  const initialAcademicYears = await prisma.academicYear.findMany();
  const initialStudentCount = await prisma.student.count();
  const initialStudentSnapshots = await prisma.student.findMany({
    select: { id: true, class_id: true },
  });

  console.log(`[SAFETY LOG] Jumlah Class sebelum backfill         : ${initialClasses.length}`);
  console.log(`[SAFETY LOG] Jumlah AcademicYear sebelum backfill  : ${initialAcademicYears.length}`);
  console.log(`[SAFETY LOG] Jumlah Student sebelum backfill       : ${initialStudentCount}`);

  if (initialClasses.length === 0) {
    console.log('\n[INFO] Tabel Class kosong. Tidak ada data yang perlu di-backfill.');
    return { success: true, count: 0 };
  }

  // 2. Deteksi Nilai academic_year NULL atau Kosong (FAIL-SAFE)
  const invalidClasses = initialClasses.filter(
    (c) => !c.academic_year || c.academic_year.trim() === ''
  );

  if (invalidClasses.length > 0) {
    console.error('\n================================================================');
    console.error('[ERROR] Ditemukan Class tanpa academic_year (NULL atau kosong).');
    console.error('Backfill dibatalkan secara otomatis (Fail-Safe).');
    console.error('Perbaiki data kelas berikut terlebih dahulu sebelum melanjutkan:');
    invalidClasses.forEach((c) => {
      console.error(`  - ID: ${c.id} | Nama: "${c.name}" | Tingkat: "${c.grade}" | academic_year: "${c.academic_year}"`);
    });
    console.error('================================================================\n');
    throw new Error('Backfill aborted: Invalid empty academic_year detected in classes.');
  }

  // 3. Kumpulkan Distinct academic_year dari Class
  const distinctYears = Array.from(
    new Set(initialClasses.map((c) => c.academic_year.trim()))
  );
  console.log(`[SAFETY LOG] Distinct academic_year ditemukan (${distinctYears.length}):`, distinctYears);

  // 4. Deteksi Konflik Duplikasi Sebelum Backfill (Audit Integrity)
  console.log('\n--- TAHAP 2: AUDIT INTEGRITAS & DETEKSI KONFLIK ---');
  let conflictCount = 0;

  // A. Duplikasi Nama Kelas dalam Satu Tahun Ajaran
  const nameYearMap = new Map();
  for (const c of initialClasses) {
    const key = `${c.name.trim().toLowerCase()}:::${c.academic_year.trim()}`;
    if (nameYearMap.has(key)) {
      console.error(`[KONFLIK] Duplikasi nama kelas "${c.name}" pada tahun ajaran "${c.academic_year}"! (ID 1: ${nameYearMap.get(key)}, ID 2: ${c.id})`);
      conflictCount++;
    } else {
      nameYearMap.set(key, c.id);
    }
  }

  // B. Duplikasi Kode Kelas dalam Satu Tahun Ajaran (jika kode diisi)
  const codeYearMap = new Map();
  for (const c of initialClasses) {
    if (c.code && c.code.trim() !== '') {
      const key = `${c.code.trim().toLowerCase()}:::${c.academic_year.trim()}`;
      if (codeYearMap.has(key)) {
        console.error(`[KONFLIK] Duplikasi kode kelas "${c.code}" pada tahun ajaran "${c.academic_year}"! (ID 1: ${codeYearMap.get(key)}, ID 2: ${c.id})`);
        conflictCount++;
      } else {
        codeYearMap.set(key, c.id);
      }
    }
  }

  // C. Duplikasi Wali Kelas dalam Satu Tahun Ajaran
  const homeroomYearMap = new Map();
  for (const c of initialClasses) {
    if (c.homeroom_teacher_id) {
      const key = `${c.homeroom_teacher_id}:::${c.academic_year.trim()}`;
      if (homeroomYearMap.has(key)) {
        console.error(`[KONFLIK] Wali kelas "${c.homeroom_teacher_id}" memegang lebih dari 1 kelas pada tahun ajaran "${c.academic_year}"! (ID 1: ${homeroomYearMap.get(key)}, ID 2: ${c.id})`);
        conflictCount++;
      } else {
        homeroomYearMap.set(key, c.id);
      }
    }
  }

  console.log(`[SAFETY LOG] Total konflik integritas ditemukan     : ${conflictCount}`);

  if (conflictCount > 0) {
    console.error('\n================================================================');
    console.error(`[ERROR] Ditemukan ${conflictCount} konflik integritas pada data Class.`);
    console.error('Backfill dibatalkan sebelum mutasi data dilakukan.');
    console.error('Selesaikan konflik data di atas sebelum mengaktifkan partial unique indexes.');
    console.error('================================================================\n');
    throw new Error(`Backfill aborted: ${conflictCount} data integrity conflicts detected.`);
  }

  // 5. Penentuan Status Aktif Tahun Ajaran Tanpa Hardcode
  const existingActiveAY = initialAcademicYears.find((ay) => ay.is_active);
  let yearToActivate = null;

  if (existingActiveAY) {
    console.log(`[INFO] Sudah terdapat AcademicYear aktif di database: "${existingActiveAY.name}". Status aktif tidak akan diubah.`);
  } else {
    if (distinctYears.length === 1) {
      yearToActivate = distinctYears[0];
      console.log(`[INFO] Belum ada tahun ajaran aktif. Seluruh kelas menggunakan TEPAT 1 tahun ajaran ("${yearToActivate}"). Tahun ini akan diset aktif.`);
    } else if (distinctYears.length > 1) {
      console.error('\n================================================================');
      console.error('[ERROR] Belum ada AcademicYear aktif di database, dan ditemukan >1 tahun ajaran:');
      distinctYears.forEach((y) => console.error(`  - "${y}"`));
      console.error('Sistem menolak menebak tahun ajaran mana yang harus aktif.');
      console.error('Silakan buat atau tentukan salah satu AcademicYear aktif secara eksplisit terlebih dahulu.');
      console.error('================================================================\n');
      throw new Error('Backfill aborted: Ambiguous active academic year with multiple candidate years.');
    }
  }

  // Hitung berapa AcademicYear yang perlu dibuat
  const existingNameSet = new Set(initialAcademicYears.map((ay) => ay.name));
  const yearsToCreate = distinctYears.filter((y) => !existingNameSet.has(y));
  console.log(`[SAFETY LOG] AcademicYear baru yang akan dibuat     : ${yearsToCreate.length}`);

  // Hitung berapa Class yang perlu di-update
  const classesNeedingUpdate = initialClasses.filter((c) => !c.academic_year_id);
  console.log(`[SAFETY LOG] Class yang membutuhkan update link    : ${classesNeedingUpdate.length}`);

  // ============================================================================
  // TAHAP 3: ATOMIC BACKFILL DENGAN PRISMA TRANSACTION
  // ============================================================================
  console.log('\n--- TAHAP 3: MENJALANKAN ATOMIC TRANSACTION BACKFILL ---');

  await prisma.$transaction(async (tx) => {
    // A. Buat Master AcademicYear yang belum ada
    const activeMap = new Map();

    // Load existing ke activeMap
    for (const ay of initialAcademicYears) {
      activeMap.set(ay.name, ay.id);
    }

    for (const yearName of yearsToCreate) {
      const isThisActive = yearToActivate === yearName;
      console.log(`  [TX] Membuat AcademicYear: "${yearName}" (is_active: ${isThisActive})...`);
      const created = await tx.academicYear.create({
        data: {
          name: yearName,
          is_active: isThisActive,
        },
      });
      activeMap.set(created.name, created.id);
    }

    // B. Update Class.academic_year_id
    let updatedCount = 0;
    for (const cls of initialClasses) {
      const targetAyId = activeMap.get(cls.academic_year.trim());
      if (!targetAyId) {
        throw new Error(`[TX ERROR] Target AcademicYear untuk kelas "${cls.name}" tidak ditemukan.`);
      }

      if (cls.academic_year_id !== targetAyId) {
        await tx.class.update({
          where: { id: cls.id },
          data: { academic_year_id: targetAyId },
        });
        updatedCount++;
      }
    }
    console.log(`  [TX] ${updatedCount} baris Class berhasil dihubungkan ke AcademicYear.`);

    // ==========================================================================
    // TAHAP 4: VALIDASI PASCA-BACKFILL DI DALAM TRANSAKSI
    // ==========================================================================
    console.log('\n  --- [TX] MEMVALIDASI INTEGRITAS PASCA-MUTASI ---');

    // A. Pastikan count class dengan academic_year_id NULL adalah 0
    const unlinkedCount = await tx.class.count({
      where: { academic_year_id: null },
    });
    if (unlinkedCount !== 0) {
      throw new Error(`[TX ROLLBACK] Masih ada ${unlinkedCount} kelas dengan academic_year_id NULL!`);
    }

    // B. Pastikan seluruh academic_year_id mengarah ke AcademicYear yang valid
    const allClassesInTx = await tx.class.findMany({
      select: { id: true, name: true, code: true, academic_year_id: true, homeroom_teacher_id: true },
    });
    const validAyIds = new Set((await tx.academicYear.findMany({ select: { id: true } })).map((a) => a.id));

    for (const c of allClassesInTx) {
      if (!validAyIds.has(c.academic_year_id)) {
        throw new Error(`[TX ROLLBACK] Kelas "${c.name}" mereferensikan academic_year_id yang tidak valid!`);
      }
    }

    // C. Pastikan tidak ada duplicate (name, academic_year_id)
    const postNameMap = new Set();
    for (const c of allClassesInTx) {
      const key = `${c.name.trim().toLowerCase()}:::${c.academic_year_id}`;
      if (postNameMap.has(key)) {
        throw new Error(`[TX ROLLBACK] Terjadi duplikasi nama kelas "${c.name}" pada academic_year_id "${c.academic_year_id}"!`);
      }
      postNameMap.add(key);
    }

    // D. Pastikan tidak ada duplicate (code, academic_year_id)
    const postCodeMap = new Set();
    for (const c of allClassesInTx) {
      if (c.code && c.code.trim() !== '') {
        const key = `${c.code.trim().toLowerCase()}:::${c.academic_year_id}`;
        if (postCodeMap.has(key)) {
          throw new Error(`[TX ROLLBACK] Terjadi duplikasi kode kelas "${c.code}" pada academic_year_id "${c.academic_year_id}"!`);
        }
        postCodeMap.add(key);
      }
    }

    // E. Pastikan tidak ada duplicate (homeroom_teacher_id, academic_year_id)
    const postHomeroomMap = new Set();
    for (const c of allClassesInTx) {
      if (c.homeroom_teacher_id) {
        const key = `${c.homeroom_teacher_id}:::${c.academic_year_id}`;
        if (postHomeroomMap.has(key)) {
          throw new Error(`[TX ROLLBACK] Wali kelas "${c.homeroom_teacher_id}" terhubung ke >1 kelas pada tahun ajaran yang sama!`);
        }
        postHomeroomMap.add(key);
      }
    }

    // F. Pastikan jumlah Class sebelum dan sesudah sama
    if (allClassesInTx.length !== initialClasses.length) {
      throw new Error(`[TX ROLLBACK] Jumlah kelas berubah! Sebelum: ${initialClasses.length}, Sesudah: ${allClassesInTx.length}`);
    }

    // G. Pastikan ID Class tidak berubah
    const initialIdSet = new Set(initialClasses.map((c) => c.id));
    for (const c of allClassesInTx) {
      if (!initialIdSet.has(c.id)) {
        throw new Error(`[TX ROLLBACK] Terdeteksi ID Class yang tidak konsisten: ${c.id}`);
      }
    }

    // H. Pastikan jumlah Student tidak berubah
    const postStudentCount = await tx.student.count();
    if (postStudentCount !== initialStudentCount) {
      throw new Error(`[TX ROLLBACK] Jumlah student berubah! Sebelum: ${initialStudentCount}, Sesudah: ${postStudentCount}`);
    }

    // I. Pastikan relasi Student.class_id tidak berubah
    const postStudentSnapshots = await tx.student.findMany({
      select: { id: true, class_id: true },
    });
    const initialStudentMap = new Map(initialStudentSnapshots.map((s) => [s.id, s.class_id]));
    for (const s of postStudentSnapshots) {
      if (initialStudentMap.get(s.id) !== s.class_id) {
        throw new Error(`[TX ROLLBACK] Relasi student ${s.id} ke class_id berubah!`);
      }
    }

    console.log('  [TX] Seluruh 9 post-backfill checks berhasil diverifikasi.');
  });

  // ============================================================================
  // TAHAP 5: LAPORAN AKHIR SAFETY LOG
  // ============================================================================
  const finalClassCount = await prisma.class.count();
  const finalUnlinkedCount = await prisma.class.count({ where: { academic_year_id: null } });
  const finalAYCount = await prisma.academicYear.count();
  const finalStudentCount = await prisma.student.count();

  console.log('\n================================================================');
  console.log('HASIL ATOMIC BACKFILL & VALIDASI AKHIR:');
  console.log(`- Jumlah Class sebelum / sesudah           : ${initialClasses.length} / ${finalClassCount}`);
  console.log(`- Jumlah AcademicYear sebelum / sesudah    : ${initialAcademicYears.length} / ${finalAYCount}`);
  console.log(`- Jumlah Student sebelum / sesudah         : ${initialStudentCount} / ${finalStudentCount}`);
  console.log(`- Jumlah Class dengan academic_year_id NULL: ${finalUnlinkedCount}`);
  console.log('- Status Transaksi                         : COMMIT BERHASIL');
  console.log('================================================================\n');

  return { success: true, unlinkedCount: finalUnlinkedCount };
}

runBackfill()
  .catch((err) => {
    console.error('\n[FATAL ERROR] Backfill gagal atau di-rollback:', err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
