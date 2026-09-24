import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyHomeroomAccess } from '@/lib/homeroom-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedClassId = searchParams.get('class_id')?.trim();
  const search = searchParams.get('q')?.trim();
  const gender = searchParams.get('gender')?.trim();
  const status = searchParams.get('status')?.trim();

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
      students: [],
      totalCount: 0,
    });
  }

  try {
    const classId = homeroomClass.id;
    const whereClause: any = {
      class_id: classId,
      is_active: status === 'inactive' ? false : true,
    };

    if (gender && gender !== 'all') {
      whereClause.gender = gender;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        nis: true,
        nisn: true,
        name: true,
        gender: true,
        is_active: true,
        parent_name: true,
        parent_phone: true,
        address: true,
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
          },
        },
        _count: {
          select: {
            violations: true,
          },
        },
      },
    });

    const formattedStudents = students.map((s) => ({
      id: s.id,
      nis: s.nis,
      nisn: s.nisn,
      name: s.name,
      gender: s.gender,
      is_active: s.is_active,
      parent_name: s.parent_name,
      parent_phone: s.parent_phone,
      address: s.address,
      phone: s.user?.phone || null,
      email: s.user?.email || null,
      birth_place: s.user?.birth_place || null,
      birth_date: s.user?.birth_date || null,
      class: s.class,
      violationsCount: s._count?.violations || 0,
    }));

    return NextResponse.json({
      success: true,
      hasHomeroomClass: true,
      homeroomClass: {
        id: homeroomClass.id,
        name: homeroomClass.name,
        grade: homeroomClass.grade,
        academic_year: homeroomClass.academic_year,
      },
      students: formattedStudents,
      totalCount: formattedStudents.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/homeroom/students:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar siswa kelas.' },
      { status: 500 }
    );
  }
}
