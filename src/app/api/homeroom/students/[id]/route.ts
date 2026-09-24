import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyHomeroomAccess } from '@/lib/homeroom-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();

  // 1. Verifikasi Akses & Kepemilikan Kelas (Anti-IDOR)
  const { session, errorResponse, homeroomClass, hasNoClass } = await verifyHomeroomAccess(
    request,
    requestedClassId
  );

  if (errorResponse) return errorResponse;

  if (hasNoClass || !homeroomClass) {
    return NextResponse.json(
      { error: 'Anda belum memiliki kelas sebagai wali kelas.' },
      { status: 403 }
    );
  }

  try {
    // 2. Kueri Siswa
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            birth_place: true,
            birth_date: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academic_year: true,
            homeroom_teacher: { select: { id: true, name: true, nip: true } },
          },
        },
        violations: {
          orderBy: { date: 'desc' },
          select: {
            id: true,
            violation_type: true,
            description: true,
            date: true,
            status: true,
            location: true,
            reporter: { select: { id: true, name: true } },
            handler: { select: { id: true, name: true } },
            follow_ups: {
              orderBy: { action_date: 'desc' },
              select: {
                id: true,
                action_taken: true,
                notes: true,
                action_date: true,
                actor: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 3. VALIDASI IDOR KETAT: Siswa harus terdaftar di kelas milik wali kelas yang login!
    // Kecuali jika session adalah administrator atau kepala_sekolah
    const isSuperRole = session.role === 'administrator' || session.role === 'kepala_sekolah';
    if (!isSuperRole && student.class_id !== homeroomClass.id) {
      return NextResponse.json(
        { error: 'Akses ditolak. Siswa ini bukan anggota rombongan belajar Anda.' },
        { status: 403 }
      );
    }

    // 4. Hitung Rekapitulasi Presensi Siswa Ini
    const attendanceItems = await prisma.monthlyAttendanceItem.findMany({
      where: { student_id: studentId },
      select: {
        present: true,
        sick: true,
        permission: true,
        unexcused: true,
        total: true,
        attendance: {
          select: {
            year: true,
            month: true,
            subject: true,
          },
        },
      },
    });

    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;

    for (const item of attendanceItems) {
      totalH += item.present || 0;
      totalS += item.sick || 0;
      totalI += item.permission || 0;
      totalA += item.unexcused || 0;
    }

    const grandTotal = totalH + totalS + totalI + totalA;
    const attendancePercentage =
      grandTotal > 0 ? Math.round((totalH / grandTotal) * 100) : 0;

    // Total pelanggaran aktif
    const activeViolationsCount = student.violations.filter(
      (v) => v.status !== 'Selesai'
    ).length;

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        nis: student.nis,
        nisn: student.nisn,
        name: student.name,
        gender: student.gender,
        is_active: student.is_active,
        status: student.is_active ? 'Aktif' : 'Nonaktif',
        phone: student.user?.phone || null,
        email: student.user?.email || null,
        address: student.address,
        birth_place: student.user?.birth_place || null,
        birth_date: student.user?.birth_date || null,
        parent_name: student.parent_name,
        parent_phone: student.parent_phone,
        class: student.class,
        attendanceSummary: {
          present: totalH,
          sick: totalS,
          permission: totalI,
          unexcused: totalA,
          total: grandTotal,
          percentage: attendancePercentage,
        },
        violations: student.violations,
        activeViolationsCount,
        totalViolations: student.violations.length,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/students/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail data siswa.' },
      { status: 500 }
    );
  }
}
