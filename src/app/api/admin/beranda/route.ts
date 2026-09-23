import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { getActivePrincipal } from '@/lib/principal';

export const dynamic = 'force-dynamic';

// GET: Ambil data beranda (School, Principal, Background, Active Principal User)
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Hanya untuk Administrator.' }, { status: 403 });
    }

    const [school, principal, background, activePrincipal] = await Promise.all([
      prisma.schoolProfile.findFirst(),
      prisma.principalProfile.findFirst(),
      prisma.homeBackground.findFirst({ orderBy: { updated_at: 'desc' } }),
      getActivePrincipal(),
    ]);

    return NextResponse.json({ school, principal, background, activePrincipal });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil data beranda.' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui data Hero & Konten CMS Beranda Kepala Sekolah (jabatan & pesan sambutan)
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Hanya untuk Administrator.' }, { status: 403 });
    }

    const body = await req.json();
    const { school_name, tagline, principal_position, principal_message } = body;

    // 1. Update School Profile (Hero)
    let school = await prisma.schoolProfile.findFirst();
    if (school) {
      school = await prisma.schoolProfile.update({
        where: { id: school.id },
        data: {
          school_name: school_name ?? school.school_name,
          tagline: tagline ?? school.tagline,
        },
      });
    }

    // 2. Update Principal Profile (Hanya CMS Publik: position & message; foto personal dikelola mandiri via User.photo)
    let principal = await prisma.principalProfile.findFirst();

    if (principal) {
      principal = await prisma.principalProfile.update({
        where: { id: principal.id },
        data: {
          position: principal_position ?? 'Kepala SMA Negeri 18 Bombana',
          message: principal_message ?? principal.message,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan Beranda berhasil disimpan.',
      school,
      principal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui beranda.' },
      { status: 500 }
    );
  }
}
