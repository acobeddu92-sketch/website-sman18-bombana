import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'administrator',
    'kepala_sekolah',
    'wakasek_kurikulum',
    'wakasek_kesiswaan',
    'guru_bk',
    'wali_kelas',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get('academic_year_id')?.trim();
  const academicYearName = searchParams.get('academic_year')?.trim();
  const grade = searchParams.get('grade')?.trim();
  const statusFilter = searchParams.get('is_active')?.trim();
  const q = searchParams.get('q')?.trim() || '';

  try {
    const whereClause: any = {};

    if (academicYearId && academicYearId !== 'all') {
      whereClause.academic_year_id = academicYearId;
    } else if (academicYearName && academicYearName !== 'all') {
      whereClause.academic_year = academicYearName;
    }

    if (grade && grade !== 'all') {
      whereClause.grade = grade;
    }

    if (statusFilter === 'true') {
      whereClause.is_active = true;
    } else if (statusFilter === 'false') {
      whereClause.is_active = false;
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { homeroom_teacher: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [classes, academicYears, waliKelasUsers, teachers] = await Promise.all([
      prisma.class.findMany({
        where: whereClause,
        include: {
          academic_year_rel: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
          homeroom_teacher: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
              nip: true,
            },
          },
          _count: {
            select: {
              students: { where: { is_active: true } },
            },
          },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
      prisma.academicYear.findMany({
        orderBy: { name: 'desc' },
        include: {
          _count: {
            select: { classes: true },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          role: 'wali_kelas',
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          nip: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: {
          role: { in: ['guru_mapel', 'guru', 'wali_kelas'] },
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          nip: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Tandai wali kelas yang sudah ditugaskan pada tahun ajaran tertentu
    const activeAcademicYear = academicYears.find((y) => y.is_active) || null;
    const targetYearId = academicYearId && academicYearId !== 'all' ? academicYearId : activeAcademicYear?.id;

    const assignedWaliMap = new Map<string, string>(); // userId -> className
    if (targetYearId) {
      const yearClasses = classes.filter((c) => c.academic_year_id === targetYearId);
      for (const cls of yearClasses) {
        if (cls.homeroom_teacher_id) {
          assignedWaliMap.set(cls.homeroom_teacher_id, cls.name);
        }
      }
    }

    const formattedWaliUsers = waliKelasUsers.map((w) => ({
      ...w,
      assignedClass: assignedWaliMap.get(w.id) || null,
      isAssignedInYear: assignedWaliMap.has(w.id),
    }));

    // Ambil daftar nama tahun ajaran (gabungan model dan string legacy)
    const legacyYears = Array.from(new Set(classes.map((c) => c.academic_year)));
    const allYearNames = Array.from(new Set([
      ...academicYears.map((y) => y.name),
      ...legacyYears,
    ]));

    return NextResponse.json({
      success: true,
      classes,
      academicYears,
      activeAcademicYear,
      allYearNames,
      waliKelasUsers: formattedWaliUsers,
      allTeachers: teachers,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/classes:', error);
    return NextResponse.json(
      { error: 'Gagal memuat master data kelas.' },
      { status: 500 }
    );
  }
}

// POST: Buat kelas baru oleh Administrator (Single Source of Truth)
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const {
      name,
      grade,
      code,
      academic_year_id,
      homeroom_teacher_id,
      is_active,
    } = body;

    // 1. Validasi input dasar
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama kelas wajib diisi (contoh: X IPA 1, XI IPS 2).' },
        { status: 400 }
      );
    }

    if (!grade || typeof grade !== 'string' || !['X', 'XI', 'XII'].includes(grade.trim())) {
      return NextResponse.json(
        { error: 'Tingkat kelas wajib dipilih antara X, XI, atau XII.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedGrade = grade.trim();
    const trimmedCode = code && typeof code === 'string' && code.trim() ? code.trim() : null;

    // 2. Resolusi & Validasi Master AcademicYear
    let targetAcademicYear: any = null;

    if (academic_year_id && typeof academic_year_id === 'string' && academic_year_id.trim()) {
      targetAcademicYear = await prisma.academicYear.findUnique({
        where: { id: academic_year_id.trim() },
      });
      if (!targetAcademicYear) {
        return NextResponse.json(
          { error: 'Tahun ajaran yang dipilih tidak ditemukan di master data.' },
          { status: 400 }
        );
      }
    } else {
      // Fallback ke tahun ajaran yang sedang aktif
      targetAcademicYear = await prisma.academicYear.findFirst({
        where: { is_active: true },
      });

      if (!targetAcademicYear) {
        return NextResponse.json(
          {
            error:
              'Belum ada tahun ajaran aktif di sistem. Silakan buat atau pilih tahun ajaran terlebih dahulu.',
          },
          { status: 400 }
        );
      }
    }

    const finalYearId = targetAcademicYear.id;
    const finalYearName = targetAcademicYear.name;

    // 3. Validasi Keunikan Nama Kelas dalam Tahun Ajaran yang Sama
    const duplicateName = await prisma.class.findFirst({
      where: {
        name: trimmedName,
        OR: [
          { academic_year_id: finalYearId },
          { academic_year: finalYearName },
        ],
      },
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: `Kelas "${trimmedName}" untuk tahun ajaran ${finalYearName} sudah terdaftar.` },
        { status: 409 }
      );
    }

    // 4. Validasi Keunikan Kode Kelas dalam Tahun Ajaran yang Sama (jika code diisi)
    if (trimmedCode) {
      const duplicateCode = await prisma.class.findFirst({
        where: {
          code: trimmedCode,
          OR: [
            { academic_year_id: finalYearId },
            { academic_year: finalYearName },
          ],
        },
      });

      if (duplicateCode) {
        return NextResponse.json(
          {
            error: `Kode kelas "${trimmedCode}" sudah digunakan oleh kelas ${duplicateCode.name} pada tahun ajaran ${finalYearName}.`,
          },
          { status: 409 }
        );
      }
    }

    // 5. Validasi Wali Kelas (Role & Aturan 1 Wali per 1 Kelas per Tahun Ajaran)
    let finalHomeroomTeacherId: string | null = null;
    if (homeroom_teacher_id && typeof homeroom_teacher_id === 'string' && homeroom_teacher_id.trim()) {
      const teacherUser = await prisma.user.findUnique({
        where: { id: homeroom_teacher_id.trim() },
        select: { id: true, name: true, role: true, is_active: true },
      });

      if (!teacherUser) {
        return NextResponse.json(
          { error: 'Guru wali kelas yang dipilih tidak ditemukan.' },
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

      // Cegah 1 wali memegang dua kelas pada tahun ajaran yang sama
      const alreadyAssigned = await prisma.class.findFirst({
        where: {
          homeroom_teacher_id: teacherUser.id,
          OR: [
            { academic_year_id: finalYearId },
            { academic_year: finalYearName },
          ],
        },
        select: { id: true, name: true },
      });

      if (alreadyAssigned) {
        return NextResponse.json(
          {
            error: `${teacherUser.name} sudah ditugaskan sebagai wali kelas untuk ${alreadyAssigned.name} pada tahun ajaran ${finalYearName}. Satu guru hanya boleh menjadi wali satu kelas pada tahun ajaran yang sama.`,
          },
          { status: 409 }
        );
      }

      finalHomeroomTeacherId = teacherUser.id;
    }

    // 6. Buat Data Kelas Baru (Transaction-Safe)
    const newClass = await prisma.class.create({
      data: {
        name: trimmedName,
        grade: trimmedGrade,
        code: trimmedCode,
        academic_year: finalYearName,
        academic_year_id: finalYearId,
        homeroom_teacher_id: finalHomeroomTeacherId,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
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

    return NextResponse.json(
      {
        success: true,
        message: `Kelas ${newClass.name} berhasil dibuat pada tahun ajaran ${finalYearName}.`,
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/classes:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat data kelas.' },
      { status: 500 }
    );
  }
}
