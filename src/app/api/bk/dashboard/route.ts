import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_bk',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const [
      totalStudents,
      newCases,
      inProgressCases,
      followUpNeededCases,
      resolvedCases,
      totalCounselings,
      recentViolations,
      recentCounselings,
    ] = await Promise.all([
      prisma.student.count({ where: { is_active: true } }),
      prisma.pelanggaranSiswa.count({ where: { status: 'Dilaporkan' } }),
      prisma.pelanggaranSiswa.count({ where: { status: 'Dalam Penanganan' } }),
      prisma.pelanggaranSiswa.count({ where: { status: 'Perlu Tindak Lanjut' } }),
      prisma.pelanggaranSiswa.count({ where: { status: 'Selesai' } }),
      prisma.bimbinganBK.count(),
      prisma.pelanggaranSiswa.findMany({
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          student: {
            select: { id: true, name: true, nis: true, class: { select: { name: true } } },
          },
          reporter: {
            select: { id: true, name: true, role: true },
          },
          handler: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      prisma.bimbinganBK.findMany({
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          student: {
            select: { id: true, name: true, nis: true, class: { select: { name: true } } },
          },
          counselor: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const stats = {
      totalStudents,
      newCases,
      inProgressCases,
      followUpNeededCases,
      resolvedCases,
      totalCounselings,
      totalCases: newCases + inProgressCases + followUpNeededCases + resolvedCases,
    };

    return NextResponse.json({
      success: true,
      stats,
      recentViolations,
      recentCounselings,
    });
  } catch (error: any) {
    console.error('Error in /api/bk/dashboard:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data statistik dashboard BK.' },
      { status: 500 }
    );
  }
}
