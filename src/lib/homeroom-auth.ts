import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

export interface HomeroomAuthResult {
  session: any | null;
  errorResponse: Response | null;
  homeroomClass: any | null;
  assignedClasses: any[];
  hasNoClass?: boolean;
}

/**
 * Helper otentikasi dan otorisasi ketat berbasis kepemilikan kelas (Anti-IDOR)
 * Memastikan wali kelas HANYA dapat mengakses kelas yang ditugaskan kepadanya.
 */
export async function verifyHomeroomAccess(
  request: NextRequest,
  requestedClassId?: string | null
): Promise<HomeroomAuthResult> {
  // 1. Verifikasi role otentikasi
  const { session, errorResponse } = await requireAuth(request, [
    'wali_kelas',
    'administrator',
    'kepala_sekolah',
  ]);

  if (errorResponse || !session) {
    return {
      session: null,
      errorResponse: errorResponse || NextResponse.json({ error: 'Tidak terotentikasi.' }, { status: 401 }),
      homeroomClass: null,
      assignedClasses: [],
    };
  }

  // 2. Jika Administrator atau Kepala Sekolah (memiliki hak pengawasan seluruh kelas)
  if (session.role === 'administrator' || session.role === 'kepala_sekolah') {
    const allClasses = await prisma.class.findMany({
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      include: {
        academic_year_rel: { select: { id: true, name: true, is_active: true } },
        homeroom_teacher: { select: { id: true, name: true, nip: true, username: true } },
        _count: { select: { students: { where: { is_active: true } } } },
      },
    });

    if (allClasses.length === 0) {
      return {
        session,
        errorResponse: null,
        homeroomClass: null,
        assignedClasses: [],
        hasNoClass: true,
      };
    }

    if (requestedClassId && requestedClassId !== 'all') {
      const target = allClasses.find((c) => c.id === requestedClassId);
      if (!target) {
        return {
          session,
          errorResponse: NextResponse.json(
            { error: 'Rombongan belajar tidak ditemukan.' },
            { status: 404 }
          ),
          homeroomClass: null,
          assignedClasses: allClasses,
        };
      }
      return { session, errorResponse: null, homeroomClass: target, assignedClasses: allClasses };
    }

    return { session, errorResponse: null, homeroomClass: allClasses[0], assignedClasses: allClasses };
  }

  // 3. Untuk Wali Kelas: Kueri HANYA kelas yang memiliki homeroom_teacher_id === session.id
  const assignedClasses = await prisma.class.findMany({
    where: { homeroom_teacher_id: session.id },
    orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    include: {
      academic_year_rel: { select: { id: true, name: true, is_active: true } },
      homeroom_teacher: { select: { id: true, name: true, nip: true, username: true } },
      _count: { select: { students: { where: { is_active: true } } } },
    },
  });

  // Jika guru belum ditugaskan sebagai wali kelas untuk rombel manapun
  if (assignedClasses.length === 0) {
    return {
      session,
      errorResponse: null,
      homeroomClass: null,
      assignedClasses: [],
      hasNoClass: true,
    };
  }

  // 4. Jika client meminta class_id tertentu, verifikasi kepemilikan mutlak (Anti-IDOR)
  if (requestedClassId && requestedClassId !== 'all') {
    const target = assignedClasses.find((c) => c.id === requestedClassId);
    if (!target) {
      // PERCOBAAN IDOR: Wali kelas mencoba mengakses class_id milik wali kelas lain
      return {
        session,
        errorResponse: NextResponse.json(
          { error: 'Akses ditolak. Anda bukan wali kelas dari rombongan belajar ini.' },
          { status: 403 }
        ),
        homeroomClass: null,
        assignedClasses,
      };
    }
    return { session, errorResponse: null, homeroomClass: target, assignedClasses };
  }

  // Default otomatis ke kelas yang ditugaskan (pertama)
  return {
    session,
    errorResponse: null,
    homeroomClass: assignedClasses[0],
    assignedClasses,
  };
}

/**
 * Memverifikasi apakah siswa yang diminta benar-benar terdaftar di kelas milik wali kelas (Anti-IDOR)
 */
export async function verifyStudentBelongsToHomeroom(
  studentId: string,
  homeroomClassId: string
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      class_id: true,
      name: true,
      nis: true,
      nisn: true,
      is_active: true,
    },
  });

  if (!student) {
    return { notFound: true, isAuthorized: false, student: null };
  }

  if (student.class_id !== homeroomClassId) {
    // Siswa bukan anggota dari kelas yang dipegang wali kelas
    return { notFound: false, isAuthorized: false, student: null };
  }

  return { notFound: false, isAuthorized: true, student };
}
