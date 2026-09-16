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
    const reports = await prisma.picketReport.findMany({
      include: {
        picket_teacher: { select: { id: true, name: true } },
        violations: {
          include: {
            student: { select: { id: true, name: true, nis: true } },
            handler: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error('Error in GET /api/teacher/picket:', error);
    return NextResponse.json(
      { error: 'Gagal memuat riwayat laporan piket.' },
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
    const {
      date,
      general_notes,
      school_condition_summary,
      violations = [], // Siswa bermasalah yang dilaporkan saat piket
    } = body;

    const picketDate = date ? new Date(date) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Laporan Piket Harian
      const report = await tx.picketReport.create({
        data: {
          date: picketDate,
          picket_teacher_id: session!.id,
          general_notes: general_notes?.trim() || null,
          school_condition_summary: school_condition_summary?.trim() || null,
        },
      });

      // 2. Jika ada siswa bermasalah yang dilaporkan saat piket,
      // SIMPAN KE SATU DATA TERPUSAT PELANGGARAN SISWA (Pelapor = Guru Piket, Penangani = Guru BK nantinya)
      for (const v of violations) {
        if (!v.student_id || !v.violation_type || !v.description) continue;

        let finalClass = v.class_at_incident;
        if (!finalClass) {
          const st = await tx.student.findUnique({
            where: { id: v.student_id },
            include: { class: true },
          });
          finalClass = st?.class?.name || 'Tanpa Kelas';
        }

        await tx.pelanggaranSiswa.create({
          data: {
            student_id: v.student_id,
            class_at_incident: finalClass,
            date: picketDate,
            time: v.time || null,
            violation_type: v.violation_type.trim(),
            description: v.description.trim(),
            location: v.location?.trim() || null,
            reporter_id: session!.id, // Guru Piket sebagai Pelapor
            initial_action: v.initial_action?.trim() || null,
            status: 'Dilaporkan',
            picket_report_id: report.id, // Ditautkan ke laporan piket
          },
        });
      }

      return report;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Laporan piket harian berhasil disimpan dan siswa bermasalah tercatat ke Satu Data Terpusat.',
        report: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/teacher/picket:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan laporan piket harian.' },
      { status: 500 }
    );
  }
}
