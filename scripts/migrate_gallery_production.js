const fs = require('fs');
const path = require('path');

// 1. Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('MIGRASI GALLERY PRODUCTION & ATOMIC BACKFILL');
  console.log('SMA NEGERI 18 BOMBANA');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // TAHAP 1: PRE-FLIGHT AUDIT & SNAPSHOT (FAIL-SAFE)
    // -------------------------------------------------------------
    console.log('[TAHAP 1] Pre-flight audit & Snapshot data existing...');

    // 1.1 Verifikasi Administrator Aktif
    const activeAdmins = await prisma.$queryRawUnsafe(`
      SELECT id, username, name, role, is_active
      FROM users
      WHERE role = 'administrator' AND is_active = true;
    `);

    console.log(`[SAFETY CHECK] Administrator aktif ditemukan: ${activeAdmins.length}`);
    if (activeAdmins.length !== 1) {
      throw new Error(`[ABORT] Syarat administrator aktif = tepat 1 TIDAK TERPENUHI (ditemukan: ${activeAdmins.length}). Mutasi dibatalkan.`);
    }

    const admin = activeAdmins[0];
    console.log(`[INFO] Admin aktif terpilih: ID=${admin.id}, Username=${admin.username}, Nama=${admin.name}`);

    // 1.2 Snapshot Data Existing gallery_albums
    const preAlbums = await prisma.$queryRawUnsafe(`
      SELECT id, title, description, created_at, updated_at
      FROM gallery_albums
      ORDER BY id ASC;
    `);
    console.log(`[PRE-FLIGHT] Jumlah gallery_albums: ${preAlbums.length}`);
    if (preAlbums.length !== 3) {
      throw new Error(`[ABORT] Jumlah album sebelum migrasi (${preAlbums.length}) bukan tepat 3!`);
    }

    // 1.3 Snapshot Data Existing gallery_photos
    const prePhotos = await prisma.$queryRawUnsafe(`
      SELECT id, album_id, title, description, image, created_at, updated_at
      FROM gallery_photos
      ORDER BY id ASC;
    `);
    console.log(`[PRE-FLIGHT] Jumlah gallery_photos: ${prePhotos.length}`);
    if (prePhotos.length !== 71) {
      throw new Error(`[ABORT] Jumlah foto sebelum migrasi (${prePhotos.length}) bukan tepat 71!`);
    }

    // -------------------------------------------------------------
    // TAHAP 2: EKSEKUSI TRANSAKSI ATOMIK (DDL & BACKFILL)
    // -------------------------------------------------------------
    console.log('\n[TAHAP 2] Memulai transaksi atomik migrasi DDL & Backfill...');

    await prisma.$transaction(async (tx) => {
      // 2.1 Alter gallery_albums (add created_by_id & is_published)
      console.log(' -> Menambahkan kolom pada gallery_albums...');
      await tx.$executeRawUnsafe(`
        ALTER TABLE "gallery_albums"
          ADD COLUMN IF NOT EXISTS "created_by_id" TEXT,
          ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT true;
      `);

      // 2.2 Alter gallery_photos (add uploaded_by_id & is_published)
      console.log(' -> Menambahkan kolom pada gallery_photos...');
      await tx.$executeRawUnsafe(`
        ALTER TABLE "gallery_photos"
          ADD COLUMN IF NOT EXISTS "uploaded_by_id" TEXT,
          ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT true;
      `);

      // 2.3 Backfill Data Existing
      console.log(` -> Melakukan backfill ownership ke admin ID: ${admin.id}...`);
      const updatedAlbums = await tx.$executeRawUnsafe(`
        UPDATE "gallery_albums"
        SET "created_by_id" = $1, "is_published" = true
        WHERE "created_by_id" IS NULL;
      `, admin.id);
      console.log(`    Updated albums created_by_id: ${updatedAlbums}`);

      const updatedPhotos = await tx.$executeRawUnsafe(`
        UPDATE "gallery_photos"
        SET "uploaded_by_id" = $1, "is_published" = true
        WHERE "uploaded_by_id" IS NULL;
      `, admin.id);
      console.log(`    Updated photos uploaded_by_id: ${updatedPhotos}`);

      // 2.4 Create Indexes
      console.log(' -> Membuat index pada kolom baru...');
      await tx.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "gallery_albums_created_by_id_idx" ON "gallery_albums"("created_by_id");`);
      await tx.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "gallery_albums_is_published_idx" ON "gallery_albums"("is_published");`);
      await tx.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "gallery_photos_album_id_idx" ON "gallery_photos"("album_id");`);
      await tx.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "gallery_photos_uploaded_by_id_idx" ON "gallery_photos"("uploaded_by_id");`);
      await tx.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "gallery_photos_is_published_idx" ON "gallery_photos"("is_published");`);

      // 2.5 Add Foreign Keys (with ON DELETE SET NULL ON UPDATE CASCADE)
      console.log(' -> Membuat foreign key constraints dengan ON DELETE SET NULL ON UPDATE CASCADE...');
      await tx.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'gallery_albums_created_by_id_fkey'
          ) THEN
            ALTER TABLE "gallery_albums"
              ADD CONSTRAINT "gallery_albums_created_by_id_fkey"
              FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
              ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'gallery_photos_uploaded_by_id_fkey'
          ) THEN
            ALTER TABLE "gallery_photos"
              ADD CONSTRAINT "gallery_photos_uploaded_by_id_fkey"
              FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id")
              ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$;
      `);

      console.log(' -> Transaksi DDL & Backfill selesai dengan sukses!');
    });

    // -------------------------------------------------------------
    // TAHAP 3: VERIFIKASI READ / SELECT PASCA-MIGRASI
    // -------------------------------------------------------------
    console.log('\n[TAHAP 3] Melakukan verifikasi READ / SELECT pasca-migrasi...');

    const [totalAlbumsRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM gallery_albums;`);
    const [totalPhotosRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM gallery_photos;`);
    const [nullAlbumsRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM gallery_albums WHERE created_by_id IS NULL;`);
    const [nullPhotosRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM gallery_photos WHERE uploaded_by_id IS NULL;`);
    const [unpubAlbumsRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM gallery_albums WHERE is_published = false;`);
    const [unpubPhotosRes] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM gallery_photos WHERE is_published = false;`);

    console.log(`[QUERY] SELECT COUNT(*) FROM gallery_albums: ${totalAlbumsRes.count} (Expected: 3)`);
    console.log(`[QUERY] SELECT COUNT(*) FROM gallery_photos: ${totalPhotosRes.count} (Expected: 71)`);
    console.log(`[QUERY] SELECT COUNT(*) FROM gallery_albums WHERE created_by_id IS NULL: ${nullAlbumsRes.count} (Expected: 0)`);
    console.log(`[QUERY] SELECT COUNT(*) FROM gallery_photos WHERE uploaded_by_id IS NULL: ${nullPhotosRes.count} (Expected: 0)`);
    console.log(`[QUERY] SELECT COUNT(*) FROM gallery_albums WHERE is_published = false: ${unpubAlbumsRes.count} (Expected: 0)`);
    console.log(`[QUERY] SELECT COUNT(*) FROM gallery_photos WHERE is_published = false: ${unpubPhotosRes.count} (Expected: 0)`);

    if (totalAlbumsRes.count !== 3) throw new Error(`[FAIL] Total album ${totalAlbumsRes.count} != 3`);
    if (totalPhotosRes.count !== 71) throw new Error(`[FAIL] Total foto ${totalPhotosRes.count} != 71`);
    if (nullAlbumsRes.count !== 0) throw new Error(`[FAIL] Album owner NULL ${nullAlbumsRes.count} != 0`);
    if (nullPhotosRes.count !== 0) throw new Error(`[FAIL] Foto owner NULL ${nullPhotosRes.count} != 0`);
    if (unpubAlbumsRes.count !== 0) throw new Error(`[FAIL] Album unpublished ${unpubAlbumsRes.count} != 0`);
    if (unpubPhotosRes.count !== 0) throw new Error(`[FAIL] Foto unpublished ${unpubPhotosRes.count} != 0`);

    // -------------------------------------------------------------
    // TAHAP 4: VERIFIKASI INTEGRITAS DATA (PRE VS POST SNAPSHOT)
    // -------------------------------------------------------------
    console.log('\n[TAHAP 4] Melakukan komparasi integritas data (Pre vs Post)...');

    const postAlbums = await prisma.$queryRawUnsafe(`
      SELECT id, title, description, created_by_id, is_published, created_at, updated_at
      FROM gallery_albums
      ORDER BY id ASC;
    `);

    const postPhotos = await prisma.$queryRawUnsafe(`
      SELECT id, album_id, title, description, image, uploaded_by_id, is_published, created_at, updated_at
      FROM gallery_photos
      ORDER BY id ASC;
    `);

    const preAlbumMap = new Map(preAlbums.map(a => [a.id, a]));
    for (const postA of postAlbums) {
      const preA = preAlbumMap.get(postA.id);
      if (!preA) throw new Error(`[INTEGRITY ERROR] Album ID ${postA.id} tidak ada di snapshot awal!`);
      if (preA.title !== postA.title) throw new Error(`[INTEGRITY ERROR] Title album ${postA.id} berubah!`);
      if (preA.description !== postA.description) throw new Error(`[INTEGRITY ERROR] Description album ${postA.id} berubah!`);
      if (postA.created_by_id !== admin.id) throw new Error(`[INTEGRITY ERROR] Owner album ${postA.id} bukan admin!`);
      if (postA.is_published !== true) throw new Error(`[INTEGRITY ERROR] Status album ${postA.id} bukan true!`);
    }

    const prePhotoMap = new Map(prePhotos.map(p => [p.id, p]));
    for (const postP of postPhotos) {
      const preP = prePhotoMap.get(postP.id);
      if (!preP) throw new Error(`[INTEGRITY ERROR] Photo ID ${postP.id} tidak ada di snapshot awal!`);
      if (preP.album_id !== postP.album_id) throw new Error(`[INTEGRITY ERROR] album_id photo ${postP.id} berubah!`);
      if (preP.title !== postP.title) throw new Error(`[INTEGRITY ERROR] Title photo ${postP.id} berubah!`);
      if (preP.description !== postP.description) throw new Error(`[INTEGRITY ERROR] Description photo ${postP.id} berubah!`);
      if (preP.image !== postP.image) throw new Error(`[INTEGRITY ERROR] URL image photo ${postP.id} berubah!`);
      if (postP.uploaded_by_id !== admin.id) throw new Error(`[INTEGRITY ERROR] Owner photo ${postP.id} bukan admin!`);
      if (postP.is_published !== true) throw new Error(`[INTEGRITY ERROR] Status photo ${postP.id} bukan true!`);
    }

    console.log('[INTEGRITY CHECK] Semua 3 album dan 71 foto diverifikasi 100% identik dan utuh!');
    console.log('[SUCCESS] MIGRASI DAN BACKFILL GALLERY SELESAI DENGAN SEMPURNA.\n');
  } catch (error) {
    console.error('\n[FATAL ERROR]:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
