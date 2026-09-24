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
    'kepala_sekolah',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;

  const { id } = params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
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
          include: {
            reporter: { select: { id: true, name: true, role: true } },
            handler: { select: { id: true, name: true, role: true } },
            follow_ups: {
              orderBy: { action_date: 'desc' },
              include: { actor: { select: { id: true, name: true, role: true } } },
            },
          },
        },
        attendance_items: {
          include: {
            attendance: {
              select: {
                id: true,
                year: true,
                month: true,
                subject: true,
                status: true,
              },
            },
          },
          orderBy: [
            { attendance: { year: 'desc' } },
            { attendance: { month: 'desc' } },
          ],
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Hitung ringkasan total absensi siswa
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpa = 0;

    for (const item of student.attendance_items) {
      totalHadir += item.present || 0;
      totalSakit += item.sick || 0;
      totalIzin += item.permission || 0;
      totalAlpa += item.unexcused || 0;
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        nis: student.nis,
        nisn: student.nisn,
        name: student.name,
        gender: student.gender,
        is_active: student.is_active,
        parent_name: student.parent_name,
        address: student.address,
        class: student.class,
        attendanceSummary: {
          hadir: totalHadir,
          sakit: totalSakit,
          izin: totalIzin,
          alpa: totalAlpa,
          totalRecord: totalHadir + totalSakit + totalIzin + totalAlpa,
        },
        violations: student.violations.map((v) => ({
          id: v.id,
          date: v.date.toISOString(),
          time: v.time,
          class_at_incident: v.class_at_incident,
          violation_type: v.violation_type,
          description: v.description,
          location: v.location,
          reporter: v.reporter,
          handler: v.handler,
          status: v.status,
          initial_action: v.initial_action,
          handling_notes: v.handling_notes,
          follow_ups: v.follow_ups.map((f) => ({
            id: f.id,
            action_date: f.action_date.toISOString(),
            action_taken: f.action_taken,
            notes: f.notes,
            status_after: f.status_after,
            actor: f.actor,
          })),
        })),
        attendanceDetails: student.attendance_items.map((ai) => ({
          id: ai.id,
          year: ai.attendance.year,
          month: ai.attendance.month,
          subject: ai.attendance.subject,
          status: ai.attendance.status,
          present: ai.present,
          sick: ai.sick,
          permission: ai.permission,
          unexcused: ai.unexcused,
          total: ai.total,
          notes: ai.notes,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/student-affairs/students/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail siswa.' },
      { status: 500 }
    );
  }
}
