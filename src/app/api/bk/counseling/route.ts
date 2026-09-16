import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar catatan bimbingan & konseling (BK)
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'guru_bk',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';
  const studentId = searchParams.get('student_id')?.trim() || '';

  try {
    const whereClause: any = {};

    if (type && type !== 'all') {
      whereClause.guidance_type = type;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (studentId) {
      whereClause.student_id = studentId;
    }

    const counselings = await prisma.bimbinganBK.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            class: { select: { id: true, name: true } },
          },
        },
        counselor: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, counselings });
  } catch (error: any) {
    console.error('Error in GET /api/bk/counseling:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data bimbingan konseling.' },
      { status: 500 }
    );
  }
}

// POST: Buat catatan bimbingan konseling baru
export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'guru_bk',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const {
      student_id,
      date,
      guidance_type,
      problem_statement,
      counseling_result,
      recommendation,
      follow_up,
      status,
    } = body;

    if (!student_id || !guidance_type || !problem_statement || !counseling_result) {
      return NextResponse.json(
        {
          error:
            'Siswa, jenis bimbingan, pokok permasalahan, dan hasil konseling wajib diisi.',
        },
        { status: 400 }
      );
    }

    const newCounseling = await prisma.bimbinganBK.create({
      data: {
        student_id,
        counselor_id: session!.id,
        date: date ? new Date(date) : new Date(),
        guidance_type: guidance_type.trim(),
        problem_statement: problem_statement.trim(),
        counseling_result: counseling_result.trim(),
        recommendation: recommendation?.trim() || null,
        follow_up: follow_up?.trim() || null,
        status: status || 'Proses',
      },
      include: {
        student: {
          select: { id: true, name: true, class: { select: { name: true } } },
        },
        counselor: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Catatan bimbingan konseling berhasil disimpan.',
        counseling: newCounseling,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/bk/counseling:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan catatan bimbingan konseling.' },
      { status: 500 }
    );
  }
}
