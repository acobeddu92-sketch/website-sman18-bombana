import { NextResponse } from 'next/server';
import { getPpdbSettings } from '@/lib/ppdb-settings';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getPpdbSettings();

    // Jika kontak belum disetel spesifik, gunakan profil sekolah sebagai fallback
    try {
      const profile = await prisma.schoolProfile.findFirst({
        select: { phone: true, email: true, address: true, school_name: true },
      });
      if (profile) {
        if (!settings.contactPhone && profile.phone) {
          settings.contactPhone = profile.phone;
        }
        if (!settings.contactEmail && profile.email) {
          settings.contactEmail = profile.email;
        }
      }
    } catch {
      // Abaikan jika prisma offline saat build
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil pengaturan PPDB.' },
      { status: 500 }
    );
  }
}
