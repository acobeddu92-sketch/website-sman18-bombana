import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kesiswaan',
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const currentYear = parseInt(searchParams.get('year') || '') || now.getFullYear();
  const currentMonth = parseInt(searchParams.get('month') || '') || (now.getMonth() + 1);

  try {
    // 1. Data identitas Wakasek Kesiswaan
    const currentUser = await prisma.user.findUnique({
      where: { id: session!.id },
      select: { id: true, name: true, nip: true, username: true, role: true },
    });

    // 2. Total Siswa Aktif & Total Kelas
    const [totalStudents, totalClasses] = await Promise.all([
      prisma.student.count({ where: { is_active: true } }),
      prisma.class.count(),
    ]);

    // 3. Rekap Kehadiran Bulan & Tahun Terpilih
    const attendanceItems = await prisma.monthlyAttendanceItem.findMany({
      where: {
        attendance: {
          year: currentYear,
          month: currentMonth,
        },
      },
      select: {
        present: true,
        sick: true,
        permission: true,
        unexcused: true,
        total: true,
      },
    });

    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;

    for (const item of attendanceItems) {
      hadir += item.present || 0;
      sakit += item.sick || 0;
      izin += item.permission || 0;
      alpa += item.unexcused || 0;
    }

    const totalAttendanceReports = await prisma.monthlyAttendance.count({
      where: {
        year: currentYear,
        month: currentMonth,
      },
    });

    // 4. Status Kasus Pelanggaran
    const [
      totalViolations,
      unhandledCount,
      inProgressCount,
      resolvedCount,
    ] = await Promise.all([
      prisma.pelanggaranSiswa.count(),
      prisma.pelanggaranSiswa.count({
        where: { status: { in: ['Dilaporkan', 'Perlu Tindak Lanjut'] } },
      }),
      prisma.pelanggaranSiswa.count({
        where: { status: 'Dalam Penanganan' },
      }),
      prisma.pelanggaranSiswa.count({
        where: { status: 'Selesai' },
      }),
    ]);

    // 5. Laporan Piket Terakhir & Total
    const [totalPicketReports, latestPicket] = await Promise.all([
      prisma.picketReport.count(),
      prisma.picketReport.findFirst({
        orderBy: { date: 'desc' },
        include: {
          picket_teacher: { select: { id: true, name: true } },
          _count: { select: { violations: true } },
        },
      }),
    ]);

    // 6. Evaluasi Panel Monitoring Kesiswaan Nyata
    // Indikator Kehadiran
    const totalAbsen = sakit + izin + alpa;
    const totalRecordKehadiran = hadir + totalAbsen;
    let attendanceStatus = 'Belum Tersedia';
    if (totalRecordKehadiran > 0) {
      const presenceRate = (hadir / totalRecordKehadiran) * 100;
      if (presenceRate >= 90) attendanceStatus = 'Normal';
      else if (presenceRate >= 75) attendanceStatus = 'Perlu Perhatian';
      else attendanceStatus = 'Rendah';
    }

    // Indikator Pelanggaran
    let violationStatus = 'Normal';
    if (unhandledCount > 5) violationStatus = 'Tinggi';
    else if (unhandledCount > 0) violationStatus = 'Perlu Perhatian';

    // Indikator Tindak Lanjut
    let followUpStatus = 'Optimal';
    if (unhandledCount > 5) followUpStatus = 'Menumpuk';
    else if (unhandledCount > 0) followUpStatus = 'Perlu Tindakan';

    // Indikator Piket
    let picketStatus = totalPicketReports > 0 ? 'Aktif' : 'Belum Ada Laporan';

    // Indikator Kegiatan Kesiswaan
    const totalActivities = await prisma.announcement.count({
      where: {
        is_published: true,
        category: { in: ['agenda', 'pengumuman'] },
      },
    });
    let activityStatus = totalActivities > 0 ? 'Aktif' : 'Belum Tersedia';

    // 7. Kasus Pelanggaran Terbaru (5 Terkini)
    const recentViolations = await prisma.pelanggaranSiswa.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            class: { select: { id: true, name: true } },
          },
        },
        reporter: { select: { id: true, name: true } },
        handler: { select: { id: true, name: true } },
      },
    });

    // 8. Laporan Piket Terkini (5 Terkini)
    const recentPicketReports = await prisma.picketReport.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        picket_teacher: { select: { id: true, name: true } },
        _count: { select: { violations: true } },
      },
    });

    return NextResponse.json({
      success: true,
      currentUser,
      stats: {
        totalStudents,
        totalClasses,
        hadir,
        sakit,
        izin,
        alpa,
        totalViolations,
        unhandledCount,
        inProgressCount,
        resolvedCount,
        totalPicketReports,
        totalAttendanceReports,
      },
      period: {
        year: currentYear,
        month: currentMonth,
      },
      monitoring: {
        attendance: attendanceStatus,
        violations: violationStatus,
        followUp: followUpStatus,
        picket: picketStatus,
        activities: activityStatus,
      },
      latestPicket: latestPicket
        ? {
            id: latestPicket.id,
            date: latestPicket.date.toISOString(),
            teacherName: latestPicket.picket_teacher.name,
            summary: latestPicket.school_condition_summary || latestPicket.general_notes || 'Kondisi sekolah tertib.',
            violationCount: latestPicket._count.violations,
          }
        : null,
      recentViolations: recentViolations.map((v) => ({
        id: v.id,
        date: v.date.toISOString(),
        studentName: v.student.name,
        className: v.student.class?.name || v.class_at_incident,
        violationType: v.violation_type,
        status: v.status,
        reporterName: v.reporter.name,
        handlerName: v.handler?.name || null,
      })),
      recentPicketReports: recentPicketReports.map((p) => ({
        id: p.id,
        date: p.date.toISOString(),
        teacherName: p.picket_teacher.name,
        summary: p.school_condition_summary || p.general_notes || '-',
        violationCount: p._count.violations,
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/dashboard:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data pusat kesiswaan dari server.' },
      { status: 500 }
    );
  }
}
