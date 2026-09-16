import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getPpdbSettings, updatePpdbSettings } from '@/lib/ppdb-settings';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Hanya untuk Administrator.' }, { status: 403 });
    }

    const settings = getPpdbSettings();

    // Ambil pengumuman berkategori PPDB dari database
    let ppdbAnnouncements: any[] = [];
    try {
      ppdbAnnouncements = await prisma.announcement.findMany({
        where: { category: 'ppdb' },
        orderBy: { published_at: 'desc' },
      });
    } catch (err) {
      console.error('Error fetching PPDB announcements:', err);
    }

    return NextResponse.json({
      success: true,
      settings,
      announcements: ppdbAnnouncements,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat pengaturan PPDB.' },
      { status: 500 }
    );
  }
}

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
    const updated = updatePpdbSettings(body);

    return NextResponse.json({
      success: true,
      message: 'Pengaturan PPDB berhasil disimpan.',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui pengaturan PPDB.' },
      { status: 500 }
    );
  }
}
