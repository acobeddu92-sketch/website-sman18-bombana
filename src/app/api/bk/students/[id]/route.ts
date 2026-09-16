import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_bk',
    'kepala_sekolah',
    'administrator',
    'wakasek_kesiswaan',
    'wali_kelas',
    'guru_mapel',
    'guru',
  ]);
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
            homeroom_teacher: { select: { id: true, name: true, email: true } },
          },
        },
        violations: {
          orderBy: { date: 'desc' },
          include: {
            reporter: { select: { id: true, name: true, role: true } },
            handler: { select: { id: true, name: true, role: true } },
            follow_ups: {
              orderBy: { action_date: 'desc' },
              include: { actor: { select: { id: true, name: true, role: true } } },
            },
          },
        },
        counselings: ['guru_bk', 'kepala_sekolah', 'administrator'].includes(session?.role || '')
          ? {
              orderBy: { date: 'desc' },
              include: { counselor: { select: { id: true, name: true } } },
            }
          : false,
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
    console.error('Error in /api/bk/students/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail profil siswa.' },
      { status: 500 }
    );
  }
}
