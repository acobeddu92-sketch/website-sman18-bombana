import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAuth(request, ['administrator']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { class_id, raw_names, names, default_gender } = body;

    // 1. Validasi Kelas
    if (!class_id) {
      return NextResponse.json(
        { error: 'Kelas target wajib dipilih dari master kelas.' },
        { status: 400 }
      );
    }

    const targetClass = await prisma.class.findUnique({
      where: { id: class_id },
      include: { homeroom_teacher: { select: { id: true, name: true } } },
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: 'Kelas yang dipilih tidak ditemukan dalam database.' },
        { status: 400 }
      );
    }

    // 2. Parsing Baris Nama Siswa
    let rawLines: string[] = [];
    if (Array.isArray(names)) {
      rawLines = names;
    } else if (typeof raw_names === 'string') {
      rawLines = raw_names.split(/\r?\n/);
    }

    // Trim dan hapus baris kosong
    const cleanedCandidates = rawLines
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (cleanedCandidates.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada nama siswa yang valid untuk dimasukkan. Harap ketik minimal satu nama siswa.' },
        { status: 400 }
      );
    }

    // 3. Ambil data siswa yang sudah ada di kelas ini untuk cegah duplikasi
    const existingInClass = await prisma.student.findMany({
      where: { class_id },
      select: { name: true },
    });

    const existingNameSet = new Set(
      existingInClass.map((s) => s.name.toLowerCase().trim())
    );

    const validToInsert: Array<{ name: string; class_id: string; gender?: string; is_active: boolean }> = [];
    const failedList: Array<{ name: string; reason: string }> = [];
    const seenInBatch = new Set<string>();

    for (const name of cleanedCandidates) {
      const lowerName = name.toLowerCase();

      // Cek duplikasi di dalam batch masukan yang sama
      if (seenInBatch.has(lowerName)) {
        failedList.push({
          name,
          reason: 'Nama duplikat ditemukan di dalam baris masukan teks yang sama.',
        });
        continue;
      }
      seenInBatch.add(lowerName);

      // Cek apakah sudah ada di kelas database
      if (existingNameSet.has(lowerName)) {
        failedList.push({
          name,
          reason: `Siswa dengan nama ini sudah terdaftar di kelas ${targetClass.name}.`,
        });
        continue;
      }

      validToInsert.push({
        name,
        class_id,
        gender: default_gender || null,
        is_active: true,
      });
    }

    // 4. Jalankan Transaksi Batch jika ada data valid
    let createdStudents: any[] = [];
    if (validToInsert.length > 0) {
      createdStudents = await prisma.$transaction(
        validToInsert.map((data) =>
          prisma.student.create({
            data,
            include: {
              class: {
                select: { id: true, name: true, grade: true },
              },
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      className: targetClass.name,
      totalSubmitted: cleanedCandidates.length,
      successCount: createdStudents.length,
      failedCount: failedList.length,
      createdStudents,
      failed: failedList,
      message:
        failedList.length === 0
          ? `Berhasil memasukkan ${createdStudents.length} siswa ke kelas ${targetClass.name}.`
          : `Selesai: ${createdStudents.length} siswa berhasil ditambahkan, ${failedList.length} dilewati/gagal.`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/students/bulk:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses penambahan massal siswa.' },
      { status: 500 }
    );
  }
}
