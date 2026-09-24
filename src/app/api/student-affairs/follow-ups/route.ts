import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'guru_bk',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const actionType = searchParams.get('action_type')?.trim();
  const statusAfter = searchParams.get('status_after')?.trim();
  const classId = searchParams.get('class_id')?.trim();
  const search = searchParams.get('q')?.trim();

  try {
    const whereClause: any = {};

    if (actionType && actionType !== 'all') {
      whereClause.action_taken = { contains: actionType, mode: 'insensitive' };
    }

    if (statusAfter && statusAfter !== 'all') {
      whereClause.status_after = statusAfter;
    }

    if (classId && classId !== 'all') {
      whereClause.violation = {
        ...(whereClause.violation || {}),
        student: { class_id: classId },
      };
    }

    if (search) {
      whereClause.OR = [
        { action_taken: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          violation: {
            student: { name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const followUps = await prisma.tindakLanjutPelanggaran.findMany({
      where: whereClause,
      include: {
        actor: { select: { id: true, name: true, role: true } },
        violation: {
          select: {
            id: true,
            violation_type: true,
            description: true,
            status: true,
            date: true,
            class_at_incident: true,
            student: {
              select: {
                id: true,
                name: true,
                nis: true,
                class: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { action_date: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: followUps.length,
      followUps,
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/follow-ups:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekap tindak lanjut kasus.' },
      { status: 500 }
    );
  }
}
