import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Endpoint baca umum data siswa untuk role berwenang (termasuk Pembina OSIS & Pembina Pramuka)
// Role 'siswa' TIDAK memiliki akses ke endpoint ini (403 Forbidden).
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'administrator',
    'kepala_sekolah',
    'wakasek_kurikulum',
    'wakasek_kesiswaan',
    'guru_mapel',
    'wali_kelas',
    'guru_bk',
    'pembina_osis',
    'pembina_pramuka',
    'guru',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim() || '';
  const classId = searchParams.get('class_id')?.trim() || '';
  const grade = searchParams.get('grade')?.trim() || '';
  const academicYear = searchParams.get('academic_year')?.trim() || '';

  try {
    const whereClause: any = {
      is_active: true,
    };

    if (classId && classId !== 'all') {
      whereClause.class_id = classId;
    }

    if (grade && grade !== 'all') {
      whereClause.class = {
        ...(whereClause.class || {}),
        grade,
      };
    }

    if (academicYear && academicYear !== 'all') {
      whereClause.class = {
        ...(whereClause.class || {}),
        academic_year: academicYear,
      };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Ambil data siswa hanya field non-sensitif
    // TIDAK mengekspos pelanggaran BK, konseling, maupun catatan sensitif
    const [students, classes] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        select: {
          id: true, // student_id sebagai identifier unik
          name: true,
          nis: true,
          nisn: true,
          gender: true,
          class_id: true,
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              academic_year: true,
            },
          },
        },
        orderBy: [
          { class: { name: 'asc' } },
          { name: 'asc' },
        ],
      }),
      // Sediakan referensi kelas langsung pada endpoint ini agar role non-admin tidak perlu mengakses /api/admin/classes
      prisma.class.findMany({
        select: {
          id: true,
          name: true,
          grade: true,
          academic_year: true,
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return NextResponse.json({
      success: true,
      count: students.length,
      students,
      classes,
    });
  } catch (error: any) {
    console.error('Error in GET /api/students:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data siswa.' },
      { status: 500 }
    );
  }
}
