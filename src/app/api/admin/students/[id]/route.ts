import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil detail satu siswa untuk Administrator
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academic_year: true,
            homeroom_teacher: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            attendance_items: true,
            violations: true,
            counselings: true,
          },
        },
        violations: {
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            violation_type: true,
            date: true,
            status: true,
          },
        },
        counselings: {
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            guidance_type: true,
            date: true,
            status: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    console.error('Error in GET /api/admin/students/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail data siswa.' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui data siswa oleh Administrator
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const body = await request.json();
    const {
      name,
      nis,
      nisn,
      gender,
      class_id,
      parent_name,
      parent_phone,
      address,
      is_active,
    } = body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Nama siswa tidak boleh kosong.' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (class_id !== undefined) {
      if (class_id) {
        const cls = await prisma.class.findUnique({ where: { id: class_id } });
        if (!cls) {
          return NextResponse.json(
            { error: 'Kelas yang dipilih tidak valid.' },
            { status: 400 }
          );
        }
      }
      updateData.class_id = class_id || null;
    }

    // Validasi duplikasi NIS
    if (nis !== undefined) {
      const cleanNIS = nis?.trim() || null;
      if (cleanNIS) {
        const duplicateNIS = await prisma.student.findFirst({
          where: {
            nis: cleanNIS,
            NOT: { id },
          },
        });
        if (duplicateNIS) {
          return NextResponse.json(
            { error: `NIS "${cleanNIS}" sudah digunakan oleh siswa lain: ${duplicateNIS.name}.` },
            { status: 400 }
          );
        }
      }
      updateData.nis = cleanNIS;
    }

    // Validasi duplikasi NISN
    if (nisn !== undefined) {
      const cleanNISN = nisn?.trim() || null;
      if (cleanNISN) {
        const duplicateNISN = await prisma.student.findFirst({
          where: {
            nisn: cleanNISN,
            NOT: { id },
          },
        });
        if (duplicateNISN) {
          return NextResponse.json(
            { error: `NISN "${cleanNISN}" sudah digunakan oleh siswa lain: ${duplicateNISN.name}.` },
            { status: 400 }
          );
        }
      }
      updateData.nisn = cleanNISN;
    }

    if (gender !== undefined) updateData.gender = gender || null;
    if (parent_name !== undefined) updateData.parent_name = parent_name?.trim() || null;
    if (parent_phone !== undefined) updateData.parent_phone = parent_phone?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academic_year: true,
            homeroom_teacher: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data siswa "${updated.name}" berhasil diperbarui.`,
      student: updated,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/students/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui data siswa.' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus data siswa secara aman (dengan proteksi integritas relasi historis)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  const { id } = params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action'); // "deactivate" | null

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendance_items: true,
            violations: true,
            counselings: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    const { attendance_items, violations, counselings } = student._count;
    const hasHistoricalRecords = attendance_items > 0 || violations > 0 || counselings > 0;

    // Jika Admin secara eksplisit memilih opsi nonaktifkan siswa:
    if (action === 'deactivate') {
      const deactivated = await prisma.student.update({
        where: { id },
        data: { is_active: false },
      });
      return NextResponse.json({
        success: true,
        message: `Status siswa "${deactivated.name}" berhasil diubah menjadi Non-Aktif. Seluruh data riwayat historis tetap aman.`,
        student: deactivated,
      });
    }

    // Jika siswa memiliki riwayat data penting dan diminta hapus permanen:
    if (hasHistoricalRecords) {
      const details = [];
      if (attendance_items > 0) details.push(`${attendance_items} rekap absensi`);
      if (violations > 0) details.push(`${violations} data pelanggaran`);
      if (counselings > 0) details.push(`${counselings} bimbingan konseling`);

      return NextResponse.json(
        {
          error: `Siswa "${student.name}" tidak dapat dihapus permanen karena masih memiliki data historis (${details.join(', ')}). Demi menjaga integritas data sekolah, gunakan opsi "Nonaktifkan Siswa" alih-alih menghapus.`,
          canDeactivate: true,
          counts: student._count,
        },
        { status: 400 }
      );
    }

    // Jika tidak ada data historis sama sekali, aman untuk dihapus permanen:
    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Data siswa "${student.name}" berhasil dihapus secara permanen dari database.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/students/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus data siswa.' },
      { status: 500 }
    );
  }
}
