import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyHomeroomAccess } from '@/lib/homeroom-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();

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
      statistics: null,
    });
  }

  try {
    const classId = homeroomClass.id;
    const now = new Date();
    const currentYear = now.getFullYear();

    // 2. Kueri Siswa Rombel
    const students = await prisma.student.findMany({
      where: { class_id: classId, is_active: true },
      select: {
        id: true,
        name: true,
        nis: true,
        gender: true,
      },
      orderBy: { name: 'asc' },
    });

    const totalStudents = students.length;
    const maleCount = students.filter((s) => s.gender === 'L').length;
    const femaleCount = students.filter((s) => s.gender === 'P').length;

    // 3. Kueri Presensi Bulanan Rombel Tahun Ini
    const attendanceHeaders = await prisma.monthlyAttendance.findMany({
      where: { class_id: classId, year: currentYear },
      include: {
        items: {
          select: {
            student_id: true,
            present: true,
            sick: true,
            permission: true,
            unexcused: true,
            total: true,
          },
        },
      },
    });

    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;

    const studentAbsenceMap: Record<string, { sick: number; permission: number; unexcused: number }> = {};
    for (const s of students) {
      studentAbsenceMap[s.id] = { sick: 0, permission: 0, unexcused: 0 };
    }

    for (const h of attendanceHeaders) {
      for (const it of h.items) {
        totalH += it.present || 0;
        totalS += it.sick || 0;
        totalI += it.permission || 0;
        totalA += it.unexcused || 0;

        if (studentAbsenceMap[it.student_id]) {
          studentAbsenceMap[it.student_id].sick += it.sick || 0;
          studentAbsenceMap[it.student_id].permission += it.permission || 0;
          studentAbsenceMap[it.student_id].unexcused += it.unexcused || 0;
        }
      }
    }

    const grandTotalAttendance = totalH + totalS + totalI + totalA;
    const attendanceRate =
      grandTotalAttendance > 0 ? Math.round((totalH / grandTotalAttendance) * 100) : 100;

    // 4. Kueri Pelanggaran Siswa Rombel Ini
    const violations = await prisma.pelanggaranSiswa.findMany({
      where: { student: { class_id: classId } },
      select: {
        id: true,
        violation_type: true,
        status: true,
        student_id: true,
      },
    });

    const violationsByCategoryMap: Record<string, number> = {};
    const violationsByStatusMap: Record<string, number> = {
      Dilaporkan: 0,
      'Dalam Penanganan': 0,
      'Perlu Tindak Lanjut': 0,
      Selesai: 0,
    };

    const studentViolationsCountMap: Record<string, { count: number; activeCount: number }> = {};
    for (const s of students) {
      studentViolationsCountMap[s.id] = { count: 0, activeCount: 0 };
    }

    for (const v of violations) {
      violationsByCategoryMap[v.violation_type] = (violationsByCategoryMap[v.violation_type] || 0) + 1;
      if (violationsByStatusMap[v.status] !== undefined) {
        violationsByStatusMap[v.status]++;
      }

      if (studentViolationsCountMap[v.student_id]) {
        studentViolationsCountMap[v.student_id].count++;
        if (v.status !== 'Selesai') {
          studentViolationsCountMap[v.student_id].activeCount++;
        }
      }
    }

    const violationsByCategory = Object.entries(violationsByCategoryMap).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count);

    const violationsByStatus = Object.entries(violationsByStatusMap).map(([status, count]) => ({
      status,
      count,
    }));

    // 5. Siswa dengan Absensi / Kedisiplinan yang Memerlukan Perhatian (Objektif)
    const watchlist = students
      .map((s) => {
        const abs = studentAbsenceMap[s.id] || { sick: 0, permission: 0, unexcused: 0 };
        const viol = studentViolationsCountMap[s.id] || { count: 0, activeCount: 0 };
        const totalAbsence = abs.sick + abs.permission + abs.unexcused;

        let needsAttention = false;
        const reasons: string[] = [];

        if (abs.unexcused >= 2) {
          needsAttention = true;
          reasons.push(`${abs.unexcused}x Alpa`);
        }
        if (abs.sick >= 3) {
          needsAttention = true;
          reasons.push(`${abs.sick}x Sakit`);
        }
        if (viol.activeCount > 0) {
          needsAttention = true;
          reasons.push(`${viol.activeCount} Kasus Disiplin Aktif`);
        } else if (viol.count > 0) {
          needsAttention = true;
          reasons.push(`${viol.count} Riwayat Disiplin`);
        }

        return {
          id: s.id,
          name: s.name,
          nis: s.nis,
          gender: s.gender,
          unexcused: abs.unexcused,
          sick: abs.sick,
          permission: abs.permission,
          totalAbsence,
          violationCount: viol.count,
          activePoints: viol.activeCount,
          activeViolations: viol.activeCount,
          needsAttention,
          reason: reasons.join(', ') || 'Normal',
          reasons,
        };
      })
      .filter((s) => s.needsAttention)
      .sort((a, b) => b.activePoints - a.activePoints || b.unexcused - a.unexcused);

    return NextResponse.json({
      success: true,
      hasHomeroomClass: true,
      homeroomClass: {
        id: homeroomClass.id,
        name: homeroomClass.name,
        grade: homeroomClass.grade,
        academic_year: homeroomClass.academic_year,
      },
      statistics: {
        gender: {
          totalStudents,
          maleCount,
          femaleCount,
          malePercentage: totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0,
          femalePercentage: totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 0,
        },
        attendance: {
          present: totalH,
          sick: totalS,
          permission: totalI,
          unexcused: totalA,
          grandTotal: grandTotalAttendance,
          attendanceRate,
        },
        violationsByCategory,
        violationsByStatus,
        totalViolations: violations.length,
        activeViolations: violations.filter((v) => v.status !== 'Selesai').length,
        watchlist,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/statistics:', error);
    return NextResponse.json(
      { error: 'Gagal memuat statistik kelas.' },
      { status: 500 }
    );
  }
}
