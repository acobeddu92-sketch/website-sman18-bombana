import { NextResponse } from 'next/server';
import { getPublicPrincipalProfile } from '@/lib/principal';

export const dynamic = 'force-dynamic';

/**
 * Endpoint publik untuk profil Kepala Sekolah:
 * - Proyeksi publik: name, position, photo, message
 * - Identitas Personel: Bersumber dari User aktif (role: kepala_sekolah)
 * - Konten Publik: Foto, Sambutan & Jabatan dari PrincipalProfile (CMS)
 * - Menjaga kerahasiaan NIP dan field teknis akun (id, username, email, role, is_active)
 */
export async function GET() {
  try {
    const profile = await getPublicPrincipalProfile();
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat informasi Kepala Sekolah.' },
      { status: 500 }
    );
  }
}
