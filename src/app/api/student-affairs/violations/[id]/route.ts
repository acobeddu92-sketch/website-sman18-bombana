import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'guru_bk',
    'kepala_sekolah',
    'administrator',
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
          select: { id: true, name: true, role: true, nip: true },
        },
        handler: {
          select: { id: true, name: true, role: true, nip: true },
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
    console.error('Error in GET /api/student-affairs/violations/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail kasus pelanggaran.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'guru_bk',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const body = await request.json();
    const { status, handler_id, handling_notes, notes } = body;

    const existing = await prisma.pelanggaranSiswa.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kasus pelanggaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'Selesai') {
        updateData.resolution_date = new Date();
      }
    }

    if (handler_id !== undefined) {
      updateData.handler_id = handler_id || session!.id;
    }

    if (handling_notes !== undefined) {
      updateData.handling_notes = handling_notes?.trim() || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    const updated = await prisma.pelanggaranSiswa.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, nis: true } },
        reporter: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Status kasus pelanggaran berhasil diperbarui menjadi '${updated.status}'.`,
      violation: updated,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/student-affairs/violations/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui kasus pelanggaran.' },
      { status: 500 }
    );
  }
}
