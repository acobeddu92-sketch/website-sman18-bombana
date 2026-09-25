-- ==============================================================================
-- MIGRASI BASIS DATA: MASTER TAHUN AJARAN & KELAS (SINGLE SOURCE OF TRUTH)
-- SMA NEGERI 18 BOMBANA
-- Sifat: 100% Aditif (Non-Destructive), Aman untuk Data Existing
-- 
-- DOKUMENTASI PENTING (PRISMA VS DATABASE):
-- PostgreSQL partial unique indexes di bawah ini dikelola secara manual melalui
-- migrasi SQL ini karena Prisma schema DSL saat ini belum mendukung klausa WHERE
-- pada @@unique. Jangan menghapus indeks-indeks ini saat melakukan inspeksi skema.
-- ==============================================================================

-- ==============================================================================
-- PHASE 1: PRE-BACKFILL SCHEMA PREPARATION (DDL)
-- Dijalankan SEBELUM skrip backfill (scripts/backfill_academic_year.js)
-- ==============================================================================

-- STEP 1: Buat Tabel Master Tahun Ajaran (AcademicYear)
CREATE TABLE IF NOT EXISTS "academic_years" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- Indeks Unik Nama Tahun Ajaran (Standard B-Tree Unique Index)
CREATE UNIQUE INDEX IF NOT EXISTS "academic_years_name_key" ON "academic_years"("name");

-- STEP 2: Tambahkan Kolom Baru pada Tabel Kelas (classes)
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "academic_year_id" TEXT;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- STEP 3: Buat Indeks Relasi Regular
CREATE INDEX IF NOT EXISTS "classes_academic_year_id_idx" ON "classes"("academic_year_id");
CREATE INDEX IF NOT EXISTS "classes_homeroom_teacher_id_idx" ON "classes"("homeroom_teacher_id");

-- STEP 4: Buat Foreign Key Relasi classes -> academic_years
-- CATATAN KEAMANAN: Menggunakan ON DELETE RESTRICT agar AcademicYear tidak dapat
-- dihapus jika masih digunakan oleh Class (menjaga prinsip Single Source of Truth).
DO $$ 
BEGIN
  -- Hapus FK lama jika sebelumnya diset ON DELETE SET NULL
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'classes_academic_year_id_fkey' 
      AND confdeltype = 'n' -- 'n' = SET NULL di PostgreSQL pg_constraint
  ) THEN
    ALTER TABLE "classes" DROP CONSTRAINT "classes_academic_year_id_fkey";
  END IF;

  -- Buat FK baru dengan ON DELETE RESTRICT
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classes_academic_year_id_fkey'
  ) THEN
    ALTER TABLE "classes"
      ADD CONSTRAINT "classes_academic_year_id_fkey"
      FOREIGN KEY ("academic_year_id")
      REFERENCES "academic_years"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

-- ==============================================================================
-- PHASE 2: DATA BACKFILL & VALIDATION
-- [PENTING] Jalankan skrip: node scripts/backfill_academic_year.js
-- Skrip tersebut akan:
--   - Validasi pra-backfill (deteksi data kosong/duplikasi)
--   - Mengisi tabel academic_years secara deterministik
--   - Menghubungkan classes.academic_year_id secara transaksional (atomic)
--   - Validasi pasca-backfill (memastikan 0 record unlinked)
-- ==============================================================================

-- ==============================================================================
-- PHASE 3: POST-BACKFILL INTEGRITY CONSTRAINTS
-- Dijalankan SETELAH Phase 2 (Backfill) selesai dan terverifikasi 100% bersih
-- ==============================================================================

-- STEP 9: Database Integrity: Partial Unique Indexes
-- A. Nama Kelas Unik dalam Satu Tahun Ajaran
CREATE UNIQUE INDEX IF NOT EXISTS "classes_name_academic_year_id_unique"
  ON "classes"("name", "academic_year_id")
  WHERE "academic_year_id" IS NOT NULL;

-- B. Kode Kelas Unik dalam Satu Tahun Ajaran (hanya jika kode diisi)
CREATE UNIQUE INDEX IF NOT EXISTS "classes_code_academic_year_id_unique"
  ON "classes"("code", "academic_year_id")
  WHERE "code" IS NOT NULL AND "academic_year_id" IS NOT NULL;

-- C. Satu Guru Hanya Boleh Menjadi Wali Satu Kelas pada Tahun Ajaran yang Sama (hanya jika wali ditugaskan)
CREATE UNIQUE INDEX IF NOT EXISTS "classes_homeroom_academic_year_id_unique"
  ON "classes"("homeroom_teacher_id", "academic_year_id")
  WHERE "homeroom_teacher_id" IS NOT NULL AND "academic_year_id" IS NOT NULL;

-- STEP 10: Enforce Maximum Satu Active AcademicYear di Tingkat Basis Data
-- CATATAN ARSITEKTUR:
-- Constraint partial unique index ini menjamin MAKSIMAL satu baris AcademicYear
-- dengan is_active = true di tingkat database.
-- Aturan "minimal satu active" dan pergantian atomik dikelola oleh API/business logic.
CREATE UNIQUE INDEX IF NOT EXISTS "academic_years_single_active_idx"
  ON "academic_years"("is_active")
  WHERE "is_active" = true;
