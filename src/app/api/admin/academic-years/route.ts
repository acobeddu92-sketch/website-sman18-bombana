import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar master Tahun Ajaran
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'administrator',
    'kepala_sekolah',
    'wakasek_kurikulum',
    'wakasek_kesiswaan',
    'guru_bk',
    'wali_kelas',
    'guru_mapel',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const academicYears = await prisma.academicYear.findMany({
      include: {
        _count: {
          select: { classes: true },
        },
      },
      orderBy: { name: 'desc' },
    });

    const activeYear = academicYears.find((y) => y.is_active) || null;

    return NextResponse.json({
      success: true,
      academicYears,
      activeYear,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/academic-years:', error);
    return NextResponse.json(
      { error: 'Gagal memuat master data tahun ajaran.' },
      { status: 500 }
    );
  }
}

// POST: Tambah master Tahun Ajaran baru (Khusus Administrator)
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, start_date, end_date, is_active } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama tahun ajaran wajib diisi (contoh: 2026/2027).' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Validasi format standar (e.g. 2026/2027)
    const yearPattern = /^\d{4}\/\d{4}$/;
    if (!yearPattern.test(trimmedName)) {
      return NextResponse.json(
        { error: 'Format tahun ajaran harus berupa format YYYY/YYYY (contoh: 2026/2027).' },
        { status: 400 }
      );
    }

    // Cek duplikasi nama tahun ajaran
    const existing = await prisma.academicYear.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Tahun ajaran ${trimmedName} sudah terdaftar di sistem.` },
        { status: 409 }
      );
    }

    const startDateParsed = start_date ? new Date(start_date) : null;
    const endDateParsed = end_date ? new Date(end_date) : null;

    if (startDateParsed && isNaN(startDateParsed.getTime())) {
      return NextResponse.json(
        { error: 'Tanggal mulai tidak valid.' },
        { status: 400 }
      );
    }

    if (endDateParsed && isNaN(endDateParsed.getTime())) {
      return NextResponse.json(
        { error: 'Tanggal selesai tidak valid.' },
        { status: 400 }
      );
    }

    if (startDateParsed && endDateParsed && startDateParsed > endDateParsed) {
      return NextResponse.json(
        { error: 'Tanggal mulai tidak boleh lebih akhir daripada tanggal selesai.' },
        { status: 400 }
      );
    }

    const shouldBeActive = Boolean(is_active);

    // Concurrency / Transaction Safety:
    // Jika is_active = true, pastikan tahun ajaran aktif lainnya dinonaktifkan dalam satu transaksi
    const newAcademicYear = await prisma.$transaction(async (tx) => {
      if (shouldBeActive) {
        await tx.academicYear.updateMany({
          where: { is_active: true },
          data: { is_active: false },
        });
      }

      return tx.academicYear.create({
        data: {
          name: trimmedName,
          start_date: startDateParsed,
          end_date: endDateParsed,
          is_active: shouldBeActive,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: `Tahun ajaran ${newAcademicYear.name} berhasil dibuat.`,
        academicYear: newAcademicYear,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/academic-years:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan tahun ajaran baru.' },
      { status: 500 }
    );
  }
}
