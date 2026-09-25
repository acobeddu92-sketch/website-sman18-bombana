import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil detail satu kelas
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
    const targetClass = await prisma.class.findUnique({
      where: { id },
      include: {
        academic_year_rel: {
          select: { id: true, name: true, is_active: true },
        },
        homeroom_teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            nip: true,
          },
        },
        students: {
          where: { is_active: true },
          select: {
            id: true,
            name: true,
            nis: true,
            nisn: true,
            gender: true,
            is_active: true,
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            students: { where: { is_active: true } },
            schedules: true,
            monthly_attendances: true,
            learning_materials: true,
            assignments: true,
          },
        },
      },
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, class: targetClass });
  } catch (error: any) {
    console.error('Error in GET /api/admin/classes/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail data kelas.' },
      { status: 500 }
    );
  }
}

// PATCH: Perbarui data master kelas (Khusus Administrator)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const existing = await prisma.class.findUnique({
      where: { id },
      include: {
        academic_year_rel: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      grade,
      code,
      academic_year_id,
      homeroom_teacher_id,
      is_active,
    } = body;

    const updateData: any = {};

    // 1. Tahun Ajaran
    let targetYearId = existing.academic_year_id;
    let targetYearName = existing.academic_year;

    if (academic_year_id !== undefined) {
      if (academic_year_id && typeof academic_year_id === 'string' && academic_year_id.trim()) {
        const foundYear = await prisma.academicYear.findUnique({
          where: { id: academic_year_id.trim() },
        });

        if (!foundYear) {
          return NextResponse.json(
            { error: 'Tahun ajaran yang dipilih tidak ditemukan.' },
            { status: 400 }
          );
        }

        targetYearId = foundYear.id;
        targetYearName = foundYear.name;
        updateData.academic_year_id = targetYearId;
        updateData.academic_year = targetYearName;
      }
    }

    // 2. Tingkat / Grade
    if (grade !== undefined) {
      if (!grade || !['X', 'XI', 'XII'].includes(grade.trim())) {
        return NextResponse.json(
          { error: 'Tingkat kelas harus berupa X, XI, atau XII.' },
          { status: 400 }
        );
      }
      updateData.grade = grade.trim();
    }

    // 3. Nama Kelas
    const finalName = name !== undefined && typeof name === 'string' ? name.trim() : existing.name;
    if (!finalName) {
      return NextResponse.json(
        { error: 'Nama kelas tidak boleh kosong.' },
        { status: 400 }
      );
    }

    if (name !== undefined) {
      updateData.name = finalName;
    }

    // Cek duplikasi nama jika nama atau tahun ajaran berubah
    if (name !== undefined || academic_year_id !== undefined) {
      const duplicateName = await prisma.class.findFirst({
        where: {
          id: { not: id },
          name: finalName,
          OR: [
            ...(targetYearId ? [{ academic_year_id: targetYearId }] : []),
            ...(targetYearName ? [{ academic_year: targetYearName }] : []),
          ],
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          {
            error: `Kelas "${finalName}" untuk tahun ajaran ${targetYearName} sudah terdaftar.`,
          },
          { status: 409 }
        );
      }
    }

    // 4. Kode Kelas
    if (code !== undefined) {
      const trimmedCode = code && typeof code === 'string' && code.trim() ? code.trim() : null;
      updateData.code = trimmedCode;

      if (trimmedCode) {
        const duplicateCode = await prisma.class.findFirst({
          where: {
            id: { not: id },
            code: trimmedCode,
            OR: [
              ...(targetYearId ? [{ academic_year_id: targetYearId }] : []),
              ...(targetYearName ? [{ academic_year: targetYearName }] : []),
            ],
          },
        });

        if (duplicateCode) {
          return NextResponse.json(
            {
              error: `Kode kelas "${trimmedCode}" sudah digunakan oleh kelas ${duplicateCode.name} pada tahun ajaran ${targetYearName}.`,
            },
            { status: 409 }
          );
        }
      }
    }

    // 5. Wali Kelas
    if (homeroom_teacher_id !== undefined) {
      if (homeroom_teacher_id === null || homeroom_teacher_id === '') {
        updateData.homeroom_teacher_id = null;
      } else {
        const teacherId = String(homeroom_teacher_id).trim();
        const teacherUser = await prisma.user.findUnique({
          where: { id: teacherId },
          select: { id: true, name: true, role: true, is_active: true },
        });

        if (!teacherUser) {
          return NextResponse.json(
            { error: 'Guru wali kelas tidak ditemukan.' },
            { status: 404 }
          );
        }

        if (!teacherUser.is_active) {
          return NextResponse.json(
            { error: `User ${teacherUser.name} sedang tidak aktif.` },
            { status: 400 }
          );
        }

        if (teacherUser.role !== 'wali_kelas') {
          return NextResponse.json(
            {
              error: `User ${teacherUser.name} memiliki role "${teacherUser.role}". Wali kelas WAJIB memiliki role "wali_kelas".`,
            },
            { status: 400 }
          );
        }

        // Cegah guru menjadi wali dua kelas pada tahun ajaran yang sama
        const alreadyAssigned = await prisma.class.findFirst({
          where: {
            id: { not: id },
            homeroom_teacher_id: teacherId,
            OR: [
              ...(targetYearId ? [{ academic_year_id: targetYearId }] : []),
              ...(targetYearName ? [{ academic_year: targetYearName }] : []),
            ],
          },
          select: { id: true, name: true },
        });

        if (alreadyAssigned) {
          return NextResponse.json(
            {
              error: `${teacherUser.name} sudah ditugaskan sebagai wali kelas pada ${alreadyAssigned.name} untuk tahun ajaran ${targetYearName}. Satu guru hanya boleh memegang satu kelas dalam tahun ajaran yang sama.`,
            },
            { status: 409 }
          );
        }

        updateData.homeroom_teacher_id = teacherId;
      }
    }

    // 6. Status Aktif / Nonaktif
    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    const updated = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        academic_year_rel: {
          select: { id: true, name: true, is_active: true },
        },
        homeroom_teacher: {
          select: { id: true, name: true, email: true, username: true, role: true, nip: true },
        },
        _count: {
          select: { students: { where: { is_active: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data kelas ${updated.name} berhasil diperbarui.`,
      class: updated,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/classes/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui data kelas.' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus kelas (Safe Deletion Protection)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const existing = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            schedules: true,
            monthly_attendances: true,
            learning_materials: true,
            assignments: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan.' },
        { status: 404 }
      );
    }

    const counts = existing._count;
    const relationsInUse: string[] = [];

    if (counts.students > 0) {
      relationsInUse.push(`${counts.students} siswa`);
    }
    if (counts.schedules > 0) {
      relationsInUse.push(`${counts.schedules} jadwal pelajaran`);
    }
    if (counts.monthly_attendances > 0) {
      relationsInUse.push(`${counts.monthly_attendances} rekap presensi`);
    }
    if (counts.learning_materials > 0) {
      relationsInUse.push(`${counts.learning_materials} materi pembelajaran`);
    }
    if (counts.assignments > 0) {
      relationsInUse.push(`${counts.assignments} tugas siswa`);
    }

    // Tolak penghapusan jika kelas memiliki relasi penting
    if (relationsInUse.length > 0) {
      return NextResponse.json(
        {
          error: `Kelas "${existing.name}" tidak dapat dihapus karena masih terhubung dengan ${relationsInUse.join(', ')}. Untuk menjaga keutuhan data historis, silakan gunakan opsi Nonaktifkan Kelas (is_active = false).`,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Kelas ${existing.name} berhasil dihapus secara permanen karena tidak memiliki data terkait.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/classes/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus data kelas.' },
      { status: 500 }
    );
  }
}
