import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  try {
    // 1. Distribusi Siswa per Kelas
    const classes = await prisma.class.findMany({
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        grade: true,
        _count: {
          select: {
            students: { where: { is_active: true } },
          },
        },
      },
    });

    const studentsPerClass = classes.map((c) => ({
      classId: c.id,
      className: c.name,
      grade: c.grade,
      studentCount: c._count.students,
    }));

    // 2. Rekap Absensi per Bulan (Tahun Berjalan)
    const currentYear = new Date().getFullYear();
    const attendanceHeaders = await prisma.monthlyAttendance.findMany({
      where: { year: currentYear },
      include: {
        items: {
          select: {
            present: true,
            sick: true,
            permission: true,
            unexcused: true,
          },
        },
      },
    });

    const monthlyAttendanceMap: Record<number, { present: number; sick: number; permission: number; unexcused: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthlyAttendanceMap[m] = { present: 0, sick: 0, permission: 0, unexcused: 0 };
    }

    for (const h of attendanceHeaders) {
      if (monthlyAttendanceMap[h.month]) {
        for (const item of h.items) {
          monthlyAttendanceMap[h.month].present += item.present || 0;
          monthlyAttendanceMap[h.month].sick += item.sick || 0;
          monthlyAttendanceMap[h.month].permission += item.permission || 0;
          monthlyAttendanceMap[h.month].unexcused += item.unexcused || 0;
        }
      }
    }

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    const attendancePerMonth = Object.entries(monthlyAttendanceMap).map(([m, data]) => ({
      month: parseInt(m),
      monthName: monthNames[parseInt(m) - 1],
      ...data,
      totalRecord: data.present + data.sick + data.permission + data.unexcused,
    }));

    // 3. Pelanggaran per Kategori
    const violations = await prisma.pelanggaranSiswa.findMany({
      select: {
        id: true,
        violation_type: true,
        class_at_incident: true,
        status: true,
        student_id: true,
        student: { select: { id: true, name: true, nis: true, class: { select: { name: true } } } },
      },
    });

    const violationsByCategoryMap: Record<string, number> = {};
    const violationsByClassMap: Record<string, number> = {};
    const violationsByStatusMap: Record<string, number> = {
      Dilaporkan: 0,
      'Dalam Penanganan': 0,
      'Perlu Tindak Lanjut': 0,
      Selesai: 0,
    };
    const studentViolationsMap: Record<string, { student: any; count: number }> = {};

    for (const v of violations) {
      // By category
      const type = v.violation_type || 'Lainnya';
      violationsByCategoryMap[type] = (violationsByCategoryMap[type] || 0) + 1;

      // By class
      const cls = v.student?.class?.name || v.class_at_incident || 'Umum';
      violationsByClassMap[cls] = (violationsByClassMap[cls] || 0) + 1;

      // By status
      if (v.status in violationsByStatusMap) {
        violationsByStatusMap[v.status]++;
      } else {
        violationsByStatusMap[v.status] = 1;
      }

      // Top students
      if (v.student) {
        if (!studentViolationsMap[v.student.id]) {
          studentViolationsMap[v.student.id] = {
            student: v.student,
            count: 0,
          };
        }
        studentViolationsMap[v.student.id].count++;
      }
    }

    const violationsByCategory = Object.entries(violationsByCategoryMap).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count);

    const violationsByClass = Object.entries(violationsByClassMap).map(([className, count]) => ({
      className,
      count,
    })).sort((a, b) => b.count - a.count);

    const violationsByStatus = Object.entries(violationsByStatusMap).map(([status, count]) => ({
      status,
      count,
    }));

    const topStudentsWithViolations = Object.values(studentViolationsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        id: item.student.id,
        name: item.student.name,
        nis: item.student.nis,
        className: item.student.class?.name || '-',
        violationCount: item.count,
      }));

    // 4. Rekap Piket
    const totalPicketReports = await prisma.picketReport.count();

    // 5. Total Tindak Lanjut
    const totalFollowUps = await prisma.tindakLanjutPelanggaran.count();

    return NextResponse.json({
      success: true,
      currentYear,
      statistics: {
        studentsPerClass,
        attendancePerMonth,
        violationsByCategory,
        violationsByClass,
        violationsByStatus,
        topStudentsWithViolations,
        totalPicketReports,
        totalFollowUps,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/statistics:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekapitulasi & statistik kesiswaan.' },
      { status: 500 }
    );
  }
}
