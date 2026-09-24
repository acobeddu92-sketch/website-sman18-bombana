import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyHomeroomAccess } from '@/lib/homeroom-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();
  const search = searchParams.get('q')?.trim();

  // 1. Verifikasi Akses & Kepemilikan Rombel (Anti-IDOR)
  const { errorResponse, homeroomClass, hasNoClass } = await verifyHomeroomAccess(
    request,
    requestedClassId
  );

  if (errorResponse) return errorResponse;

  if (hasNoClass || !homeroomClass) {
    return NextResponse.json({
      success: true,
      hasHomeroomClass: false,
      message: 'Anda belum memiliki kelas sebagai wali kelas.',
      followUps: [],
      totalCount: 0,
    });
  }

  try {
    const classId = homeroomClass.id;
    const whereClause: any = {
      violation: {
        student: { class_id: classId },
      },
    };

    if (search) {
      whereClause.OR = [
        { action_taken: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { actor: { name: { contains: search, mode: 'insensitive' } } },
        { violation: { student: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const followUps = await prisma.tindakLanjutPelanggaran.findMany({
      where: whereClause,
      orderBy: { action_date: 'desc' },
      include: {
        actor: { select: { id: true, name: true, role: true } },
        violation: {
          select: {
            id: true,
            violation_type: true,
            description: true,
            date: true,
            status: true,
            student: {
              select: { id: true, name: true, nis: true, gender: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      hasHomeroomClass: true,
      homeroomClass: {
        id: homeroomClass.id,
        name: homeroomClass.name,
      },
      followUps: followUps.map((f) => ({
        id: f.id,
        action_date: f.action_date.toISOString(),
        action_taken: f.action_taken,
        notes: f.notes,
        handler: f.actor,
        actor: f.actor,
        violation: {
          id: f.violation.id,
          violation_type: f.violation.violation_type,
          description: f.violation.description,
          status: f.violation.status,
          date: f.violation.date.toISOString(),
          student: f.violation.student,
        },
      })),
      totalCount: followUps.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/follow-ups:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekapitulasi tindak lanjut siswa.' },
      { status: 500 }
    );
  }
}
