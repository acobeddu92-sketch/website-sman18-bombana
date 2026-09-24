import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyHomeroomAccess } from '@/lib/homeroom-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  const now = new Date();
  const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
  const currentMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

  // 1. Verifikasi Akses & Kepemilikan Kelas (Anti-IDOR)
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
      attendanceList: [],
      summary: null,
    });
  }

  try {
    const classId = homeroomClass.id;

    // 2. Kueri Siswa Aktif Rombel
    const classStudents = await prisma.student.findMany({
      where: { class_id: classId, is_active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, nis: true, gender: true },
    });

    // 3. Kueri Rekap Kehadiran Rombel pada Periode Terpilih
    const attendanceHeaders = await prisma.monthlyAttendance.findMany({
      where: {
        class_id: classId,
        year: currentYear,
        month: currentMonth,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        verifier: { select: { id: true, name: true } },
        items: {
          include: {
            student: { select: { id: true, name: true, nis: true, gender: true } },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    // 4. Agregasi Absensi Per Siswa di Kelas Ini
    const studentAttendanceMap: Record<
      string,
      {
        studentId: string;
        name: string;
        nis: string | null;
        gender: string | null;
        present: number;
        sick: number;
        permission: number;
        unexcused: number;
        total: number;
        percentage: number;
        notes: string;
      }
    > = {};

    // Inisialisasi setiap siswa kelas
    for (const s of classStudents) {
      studentAttendanceMap[s.id] = {
        studentId: s.id,
        name: s.name,
        nis: s.nis,
        gender: s.gender,
        present: 0,
        sick: 0,
        permission: 0,
        unexcused: 0,
        total: 0,
        percentage: 100,
        notes: '',
      };
    }

    // Akumulasikan dari seluruh lembar absensi yang masuk untuk rombel ini
    for (const h of attendanceHeaders) {
      for (const item of h.items) {
        if (studentAttendanceMap[item.student_id]) {
          studentAttendanceMap[item.student_id].present += item.present || 0;
          studentAttendanceMap[item.student_id].sick += item.sick || 0;
          studentAttendanceMap[item.student_id].permission += item.permission || 0;
          studentAttendanceMap[item.student_id].unexcused += item.unexcused || 0;
          if (item.notes) {
            const currentNotes = studentAttendanceMap[item.student_id].notes;
            studentAttendanceMap[item.student_id].notes = currentNotes
              ? `${currentNotes}; ${item.notes}`
              : item.notes;
          }
        }
      }
    }

    // Hitung total dan persentase kehadiran per siswa
    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;

    const studentRows = Object.values(studentAttendanceMap).map((s) => {
      const total = s.present + s.sick + s.permission + s.unexcused;
      const percentage = total > 0 ? Math.round((s.present / total) * 100) : 100;
      totalH += s.present;
      totalS += s.sick;
      totalI += s.permission;
      totalA += s.unexcused;
      return {
        ...s,
        total,
        percentage,
      };
    });

    const grandTotal = totalH + totalS + totalI + totalA;
    const averageAttendanceRate =
      grandTotal > 0 ? Math.round((totalH / grandTotal) * 100) : 100;

    return NextResponse.json({
      success: true,
      hasHomeroomClass: true,
      homeroomClass: {
        id: homeroomClass.id,
        name: homeroomClass.name,
        grade: homeroomClass.grade,
        academic_year: homeroomClass.academic_year,
      },
      period: {
        year: currentYear,
        month: currentMonth,
      },
      summary: {
        totalH,
        totalS,
        totalI,
        totalA,
        grandTotal,
        averageAttendanceRate,
        totalStudentsCount: classStudents.length,
      },
      attendanceList: studentRows,
      headers: attendanceHeaders.map((h) => ({
        id: h.id,
        subject: h.subject,
        teacher: h.teacher?.name,
        status: h.status,
        verified_by: h.verifier?.name,
        verified_at: h.verified_at,
        verification_notes: h.verification_notes,
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/attendance:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekap absensi kelas.' },
      { status: 500 }
    );
  }
}
