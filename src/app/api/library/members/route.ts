import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

/**
 * GET: Mengambil master data anggota perpustakaan (Siswa & Guru/Staf).
 * Mematuhi prinsip SATU MASTER DATA SISWA (Student) dan SATU MASTER DATA GURU/STAF (User).
 * Bersifat READ-ONLY.
 */
export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all'; // 'student' | 'teacher' | 'all'
  const search = searchParams.get('q')?.trim() || '';
  const classId = searchParams.get('class_id')?.trim() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
  const skip = (page - 1) * limit;

  try {
    let students: any[] = [];
    let teachers: any[] = [];
    let totalStudents = 0;
    let totalTeachers = 0;

    // 1. Kueri Anggota Siswa (jika type === 'student' atau type === 'all')
    if (type === 'student' || type === 'all') {
      const studentWhere: any = { is_active: true };

      if (classId && classId !== 'all') {
        studentWhere.class_id = classId;
      }

      if (search) {
        studentWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { nis: { contains: search, mode: 'insensitive' } },
          { nisn: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [studentList, studentCount] = await Promise.all([
        prisma.student.findMany({
          where: studentWhere,
          select: {
            id: true,
            name: true,
            nis: true,
            nisn: true,
            gender: true,
            class_id: true,
            is_active: true,
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                academic_year: true,
              },
            },
            _count: {
              select: {
                book_loans: {
                  where: { status: 'Dipinjam' },
                },
              },
            },
          },
          orderBy: [
            { class: { name: 'asc' } },
            { name: 'asc' },
          ],
          skip: type === 'student' ? skip : 0,
          take: type === 'student' ? limit : 50,
        }),
        prisma.student.count({ where: studentWhere }),
      ]);

      totalStudents = studentCount;
      students = studentList.map((s) => ({
        id: s.id,
        member_type: 'SISWA',
        name: s.name,
        identifier: s.nisn || s.nis || '-',
        nis: s.nis,
        nisn: s.nisn,
        gender: s.gender || '-',
        class_id: s.class_id,
        class_name: s.class ? `Kelas ${s.class.name}` : 'Belum Ada Kelas',
        class_details: s.class,
        is_active: s.is_active,
        active_loans_count: s._count?.book_loans || 0,
      }));
    }

    // 2. Kueri Anggota Guru / Tenaga Kependidikan (jika type === 'teacher' atau type === 'all')
    if (type === 'teacher' || type === 'all') {
      const teacherWhere: any = {
        is_active: true,
        role: {
          in: [
            'guru_mapel',
            'guru',
            'wali_kelas',
            'guru_bk',
            'wakasek_kurikulum',
            'wakasek_kesiswaan',
            'kepala_perpustakaan',
            'kepala_sekolah',
            'administrator',
          ],
        },
      };

      if (search) {
        teacherWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { nip: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [teacherList, teacherCount] = await Promise.all([
        prisma.user.findMany({
          where: teacherWhere,
          select: {
            id: true,
            name: true,
            nip: true,
            gender: true,
            role: true,
            is_active: true,
            _count: {
              select: {
                borrowed_books: {
                  where: { status: 'Dipinjam' },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
          skip: type === 'teacher' ? skip : 0,
          take: type === 'teacher' ? limit : 50,
        }),
        prisma.user.count({ where: teacherWhere }),
      ]);

      totalTeachers = teacherCount;
      teachers = teacherList.map((t) => ({
        id: t.id,
        member_type: 'GURU',
        name: t.name,
        identifier: t.nip || 'Guru/Staf',
        nip: t.nip,
        gender: t.gender || '-',
        role: t.role,
        is_active: t.is_active,
        active_loans_count: t._count?.borrowed_books || 0,
      }));
    }

    // Ambil daftar kelas untuk opsi dropdown filter
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        grade: true,
        academic_year: true,
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      filter: { type, search, class_id: classId },
      pagination: {
        page,
        limit,
        totalStudents,
        totalTeachers,
        totalMembers: totalStudents + totalTeachers,
      },
      students,
      teachers,
      classes,
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/members:', error);
    return NextResponse.json(
      { error: 'Gagal memuat master anggota perpustakaan.' },
      { status: 500 }
    );
  }
}
