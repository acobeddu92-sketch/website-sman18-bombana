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
    const materials = await prisma.learningMaterial.findMany({
      where: session?.role === 'administrator' || session?.role === 'kepala_sekolah'
        ? {}
        : { teacher_id: session!.id },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    console.error('Error in GET /api/teacher/materials:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar materi pembelajaran.' },
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
    const { title, subject, class_id, description, file_url, link_url } = body;

    if (!title || !subject) {
      return NextResponse.json(
        { error: 'Judul dan mata pelajaran wajib diisi.' },
        { status: 400 }
      );
    }

    const material = await prisma.learningMaterial.create({
      data: {
        teacher_id: session!.id,
        title: title.trim(),
        subject: subject.trim(),
        class_id: class_id || null,
        description: description?.trim() || null,
        file_url: file_url || null,
        link_url: link_url?.trim() || null,
      },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Materi berhasil disimpan.', material },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/teacher/materials:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan materi pembelajaran.' },
      { status: 500 }
    );
  }
}
