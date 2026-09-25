import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar master kelas untuk layanan BK (Read-only)
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'guru_bk',
    'administrator',
    'kepala_sekolah',
    'wakasek_kesiswaan',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        grade: true,
        academic_year: true,
        academic_year_id: true,
        is_active: true,
        academic_year_rel: {
          select: { id: true, name: true, is_active: true },
        },
        homeroom_teacher: { select: { id: true, name: true, nip: true } },
        _count: { select: { students: { where: { is_active: true } } } },
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, classes });
  } catch (error: any) {
    console.error('Error in /api/bk/classes:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar kelas.' },
      { status: 500 }
    );
  }
}

// POST: DITOLAK (Master Data Kelas hanya dikelola terpusat oleh Administrator)
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Akses ditolak. Pengelolaan Master Data Kelas merupakan hak otoritas khusus Administrator melalui menu Master Data Kelas (/admin/master-kelas).',
    },
    { status: 403 }
  );
}
