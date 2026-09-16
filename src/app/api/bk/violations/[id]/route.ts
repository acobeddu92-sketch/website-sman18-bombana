import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, [
    'guru_bk',
    'kepala_sekolah',
    'administrator',
    'wakasek_kesiswaan',
    'guru_mapel',
    'guru',
    'wali_kelas',
  ]);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const violation = await prisma.pelanggaranSiswa.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: { select: { id: true, name: true, grade: true } },
          },
        },
        reporter: {
          select: { id: true, name: true, email: true, role: true },
        },
        handler: {
          select: { id: true, name: true, email: true, role: true },
        },
        follow_ups: {
          orderBy: { action_date: 'desc' },
          include: {
            actor: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!violation) {
      return NextResponse.json(
        { error: 'Kasus pelanggaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, violation });
  } catch (error: any) {
    console.error('Error in GET /api/bk/violations/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail kasus pelanggaran.' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui penanganan & status kasus oleh Guru BK / Wakasek
export async function PUT(
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
    const { status, handling_notes, notes, action_taken } = body;

    const existingViolation = await prisma.pelanggaranSiswa.findUnique({
      where: { id },
    });

    if (!existingViolation) {
      return NextResponse.json(
        { error: 'Kasus pelanggaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updatePayload: any = {
      handler_id: session!.id, // Tercatat siapa penangannya
    };

    if (status) {
      updatePayload.status = status;
      if (status === 'Selesai') {
        updatePayload.resolution_date = new Date();
      } else {
        updatePayload.resolution_date = null;
      }
    }

    if (handling_notes !== undefined) {
      updatePayload.handling_notes = handling_notes?.trim() || null;
    }

    if (notes !== undefined) {
      updatePayload.notes = notes?.trim() || null;
    }

    // Eksekusi update kasus dan opsi tambah riwayat tindak lanjut (jika action_taken ada)
    const updatedViolation = await prisma.$transaction(async (tx) => {
      const v = await tx.pelanggaranSiswa.update({
        where: { id },
        data: updatePayload,
      });

      if (action_taken && action_taken.trim().length > 0) {
        await tx.tindakLanjutPelanggaran.create({
          data: {
            violation_id: id,
            actor_id: session!.id,
            action_taken: action_taken.trim(),
            notes: notes?.trim() || null,
            status_after: status || existingViolation.status,
          },
        });
      }

      return v;
    });

    return NextResponse.json({
      success: true,
      message: 'Penanganan kasus berhasil diperbarui.',
      violation: updatedViolation,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/bk/violations/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui status kasus.' },
      { status: 500 }
    );
  }
}
