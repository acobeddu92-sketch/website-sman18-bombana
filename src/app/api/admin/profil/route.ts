import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { deleteUploadedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET: Ambil Profil Sekolah lengkap
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Hanya untuk Administrator.' }, { status: 403 });
    }

    const profile = await prisma.schoolProfile.findFirst();
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil profil sekolah.' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui Profil Sekolah & Logo
export async function PUT(req: NextRequest) {
  try {
    // 1. Verifikasi Autentikasi & RBAC
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    }
    const session = await verifySessionToken(token);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya untuk Administrator.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      school_name,
      tagline,
      logo,
      address,
      phone,
      email,
      website,
      history,
      vision,
      mission,
      goals,
      facilities,
      extracurriculars,
    } = body;

    let profile = await prisma.schoolProfile.findFirst();

    // Jika logo diganti dengan file baru dan logo lama tersimpan di /uploads/, hapus file lama
    if (profile && logo && profile.logo && profile.logo !== logo) {
      await deleteUploadedFile(profile.logo);
    }

    if (profile) {
      profile = await prisma.schoolProfile.update({
        where: { id: profile.id },
        data: {
          school_name: school_name ?? profile.school_name,
          tagline: tagline ?? profile.tagline,
          logo: logo ?? profile.logo,
          address: address ?? profile.address,
          phone: phone ?? profile.phone,
          email: email ?? profile.email,
          website: website ?? profile.website,
          history: history ?? profile.history,
          vision: vision ?? profile.vision,
          mission: mission ?? profile.mission,
          goals: goals ?? profile.goals,
          facilities: facilities !== undefined ? (typeof facilities === 'string' ? facilities : JSON.stringify(facilities)) : profile.facilities,
          extracurriculars: extracurriculars !== undefined ? (typeof extracurriculars === 'string' ? extracurriculars : JSON.stringify(extracurriculars)) : profile.extracurriculars,
        },
      });
    } else {
      profile = await prisma.schoolProfile.create({
        data: {
          school_name: school_name || 'SMA NEGERI 18 BOMBANA',
          tagline: tagline || '',
          logo: logo || '/images/logo.svg',
          address: address || '',
          phone: phone || '',
          email: email || '',
          website: website || '',
          history: history || '',
          vision: vision || '',
          mission: mission || '',
          goals: goals || '',
          facilities: typeof facilities === 'string' ? facilities : JSON.stringify(facilities || []),
          extracurriculars: typeof extracurriculars === 'string' ? extracurriculars : JSON.stringify(extracurriculars || []),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil sekolah berhasil diperbarui.',
      profile,
    });
  } catch (error: any) {
    console.error('API Profil Update Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui profil sekolah.' },
      { status: 500 }
    );
  }
}
