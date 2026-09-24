import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim();
  const dateFrom = searchParams.get('date_from')?.trim();
  const dateTo = searchParams.get('date_to')?.trim();

  try {
    const whereClause: any = {};

    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) whereClause.date.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    if (search) {
      whereClause.OR = [
        { picket_teacher: { name: { contains: search, mode: 'insensitive' } } },
        { general_notes: { contains: search, mode: 'insensitive' } },
        { school_condition_summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const reports = await prisma.picketReport.findMany({
      where: whereClause,
      include: {
        picket_teacher: { select: { id: true, name: true, nip: true } },
        violations: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                nis: true,
                class: { select: { id: true, name: true } },
              },
            },
            handler: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/picket:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekap laporan piket kesiswaan.' },
      { status: 500 }
    );
  }
}
