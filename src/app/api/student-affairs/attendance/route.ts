import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// GET: Penarikan Rekap Absen Siswa Seluruh Sekolah untuk Kesiswaan
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : now.getFullYear();
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : now.getMonth() + 1;
  const classId = searchParams.get('class_id')?.trim();
  const status = searchParams.get('status')?.trim();

  try {
    const whereClause: any = {};

    if (year) whereClause.year = year;
    if (month) whereClause.month = month;
    if (classId && classId !== 'all') whereClause.class_id = classId;
    if (status && status !== 'all') whereClause.status = status;

    const [attendances, classes] = await Promise.all([
      prisma.monthlyAttendance.findMany({
        where: whereClause,
        include: {
          class: { select: { id: true, name: true, grade: true } },
          teacher: { select: { id: true, name: true, nip: true } },
          verifier: { select: { id: true, name: true } },
          items: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  nis: true,
                  gender: true,
                  is_active: true,
                },
              },
            },
            orderBy: { student: { name: 'asc' } },
          },
        },
        orderBy: [{ class: { name: 'asc' } }, { subject: 'asc' }],
      }),
      prisma.class.findMany({
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, grade: true },
      }),
    ]);

    // Hitung ringkasan total H, S, I, A
    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;

    for (const att of attendances) {
      for (const it of att.items) {
        totalH += it.present || 0;
        totalS += it.sick || 0;
        totalI += it.permission || 0;
        totalA += it.unexcused || 0;
      }
    }

    return NextResponse.json({
      success: true,
      period: { year, month },
      summary: {
        totalH,
        totalS,
        totalI,
        totalA,
        grandTotal: totalH + totalS + totalI + totalA,
        totalReports: attendances.length,
      },
      attendances,
      classes,
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/attendance:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekap absensi kesiswaan.' },
      { status: 500 }
    );
  }
}

// PATCH: Verifikasi / Persetujuan Rekap Absensi oleh Wakasek Kesiswaan
export async function PATCH(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, status, verification_notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID rekap absensi wajib disertakan.' },
        { status: 400 }
      );
    }

    const validStatuses = ['Diverifikasi', 'Disetujui', 'Dikembalikan'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status verifikasi harus Diverifikasi, Disetujui, atau Dikembalikan.' },
        { status: 400 }
      );
    }

    const existing = await prisma.monthlyAttendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Rekap absensi tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updated = await prisma.monthlyAttendance.update({
      where: { id },
      data: {
        status,
        verified_by_id: session!.id,
        verified_at: new Date(),
        verification_notes: verification_notes?.trim() || null,
      },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        verifier: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Rekap absensi kelas ${updated.class.name} berhasil diperbarui menjadi '${status}'.`,
      attendance: updated,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/student-affairs/attendance:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui status verifikasi absensi.' },
      { status: 500 }
    );
  }
}
