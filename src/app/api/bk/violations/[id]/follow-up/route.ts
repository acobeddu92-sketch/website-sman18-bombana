import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_bk',
    'wakasek_kesiswaan',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const body = await request.json();
    const { action_taken, notes, status_after } = body;

    if (!action_taken || !action_taken.trim()) {
      return NextResponse.json(
        { error: 'Tindakan yang diambil wajib diisi.' },
        { status: 400 }
      );
    }

    const violation = await prisma.pelanggaranSiswa.findUnique({
      where: { id },
    });

    if (!violation) {
      return NextResponse.json(
        { error: 'Kasus pelanggaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    const newStatus = status_after || violation.status;

    const result = await prisma.$transaction(async (tx) => {
      const followUp = await tx.tindakLanjutPelanggaran.create({
        data: {
          violation_id: id,
          actor_id: session!.id,
          action_taken: action_taken.trim(),
          notes: notes?.trim() || null,
          status_after: newStatus,
        },
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
      });

      await tx.pelanggaranSiswa.update({
        where: { id },
        data: {
          status: newStatus,
          handler_id: session!.id,
          resolution_date: newStatus === 'Selesai' ? new Date() : null,
        },
      });

      return followUp;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Catatan tindak lanjut berhasil ditambahkan.',
        follow_up: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding follow-up in /api/bk/violations/[id]/follow-up:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan tindak lanjut.' },
      { status: 500 }
    );
  }
}
