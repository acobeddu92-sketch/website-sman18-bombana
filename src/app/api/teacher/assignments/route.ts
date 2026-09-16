import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_mapel',
    'guru',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const assignments = await prisma.assignment.findMany({
      where: session?.role === 'administrator' || session?.role === 'kepala_sekolah'
        ? {}
        : { teacher_id: session!.id },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: { deadline: 'asc' },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    console.error('Error in GET /api/teacher/assignments:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar tugas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_mapel',
    'guru',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { class_id, subject, title, description, deadline, attachment_url } = body;

    if (!class_id || !subject || !title || !description || !deadline) {
      return NextResponse.json(
        { error: 'Kelas, mata pelajaran, judul, deskripsi, dan batas pengumpulan wajib diisi.' },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        teacher_id: session!.id,
        class_id,
        subject: subject.trim(),
        title: title.trim(),
        description: description.trim(),
        deadline: new Date(deadline),
        attachment_url: attachment_url || null,
        is_active: true,
      },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Tugas berhasil dibuat.', assignment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/teacher/assignments:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat tugas.' },
      { status: 500 }
    );
  }
}
