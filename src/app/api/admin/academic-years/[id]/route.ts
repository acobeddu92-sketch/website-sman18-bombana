import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil detail satu Tahun Ajaran beserta daftar kelas terkait
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, [
    'administrator',
    'kepala_sekolah',
    'wakasek_kurikulum',
    'wakasek_kesiswaan',
    'guru_bk',
    'wali_kelas',
  ]);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        classes: {
          select: {
            id: true,
            code: true,
            name: true,
            grade: true,
            is_active: true,
            homeroom_teacher: { select: { id: true, name: true } },
            _count: { select: { students: { where: { is_active: true } } } },
          },
          orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        },
        _count: { select: { classes: true } },
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Tahun ajaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, academicYear });
  } catch (error: any) {
    console.error('Error in GET /api/admin/academic-years/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail tahun ajaran.' },
      { status: 500 }
    );
  }
}

// PATCH: Update data Tahun Ajaran atau status aktif (Khusus Administrator)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const existing = await prisma.academicYear.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Tahun ajaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, start_date, end_date, is_active } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'Nama tahun ajaran tidak boleh kosong.' },
          { status: 400 }
        );
      }
      const trimmedName = name.trim();
      const yearPattern = /^\d{4}\/\d{4}$/;
      if (!yearPattern.test(trimmedName)) {
        return NextResponse.json(
          { error: 'Format tahun ajaran harus berupa format YYYY/YYYY (contoh: 2026/2027).' },
          { status: 400 }
        );
      }

      if (trimmedName !== existing.name) {
        const duplicate = await prisma.academicYear.findUnique({
          where: { name: trimmedName },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: `Tahun ajaran ${trimmedName} sudah terdaftar.` },
            { status: 409 }
          );
        }
        updateData.name = trimmedName;
      }
    }

    if (start_date !== undefined) {
      const parsed = start_date ? new Date(start_date) : null;
      if (parsed && isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'Tanggal mulai tidak valid.' },
          { status: 400 }
        );
      }
      updateData.start_date = parsed;
    }

    if (end_date !== undefined) {
      const parsed = end_date ? new Date(end_date) : null;
      if (parsed && isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'Tanggal selesai tidak valid.' },
          { status: 400 }
        );
      }
      updateData.end_date = parsed;
    }

    // Cek relasi rentang tanggal
    const finalStart = updateData.start_date !== undefined ? updateData.start_date : existing.start_date;
    const finalEnd = updateData.end_date !== undefined ? updateData.end_date : existing.end_date;
    if (finalStart && finalEnd && finalStart > finalEnd) {
      return NextResponse.json(
        { error: 'Tanggal mulai tidak boleh lebih akhir daripada tanggal selesai.' },
        { status: 400 }
      );
    }

    const isActivating = is_active === true;
    const isDeactivating = is_active === false;

    // Transaction-safe execution
    const updated = await prisma.$transaction(async (tx) => {
      if (isActivating) {
        // Nonaktifkan semua tahun ajaran lain
        await tx.academicYear.updateMany({
          where: { id: { not: id }, is_active: true },
          data: { is_active: false },
        });
        updateData.is_active = true;
      } else if (isDeactivating) {
        updateData.is_active = false;
      }

      const result = await tx.academicYear.update({
        where: { id },
        data: updateData,
      });

      // Jika nama tahun ajaran berubah, sinkronkan field compatibility academic_year di Class
      if (updateData.name) {
        await tx.class.updateMany({
          where: { academic_year_id: id },
          data: { academic_year: updateData.name },
        });
      }

      return result;
    });

    return NextResponse.json({
      success: true,
      message: `Tahun ajaran ${updated.name} berhasil diperbarui.`,
      academicYear: updated,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/academic-years/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui tahun ajaran.' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus Tahun Ajaran (Hanya jika belum memiliki relasi kelas)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const existing = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: { classes: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Tahun ajaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Safety check: Tolak penghapusan jika masih terhubung ke kelas
    if (existing._count.classes > 0) {
      return NextResponse.json(
        {
          error: `Tahun ajaran "${existing.name}" tidak dapat dihapus karena masih digunakan oleh ${existing._count.classes} rombongan belajar/kelas. Silakan nonaktifkan tahun ajaran atau pindahkan kelas terlebih dahulu.`,
        },
        { status: 409 }
      );
    }

    await prisma.academicYear.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Tahun ajaran ${existing.name} berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/academic-years/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus tahun ajaran.' },
      { status: 500 }
    );
  }
}
