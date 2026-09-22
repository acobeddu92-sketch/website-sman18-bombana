import { prisma } from '@/lib/prisma';

/**
 * Resolver canonical untuk identitas Kepala Sekolah aktif.
 * Sumber utama: User dengan role 'kepala_sekolah' dan is_active = true.
 * PrincipalProfile BUKAN sumber identitas personil, melainkan hanya CMS (foto, sambutan).
 */
export async function getActivePrincipal() {
  try {
    const principalUser = await prisma.user.findFirst({
      where: {
        role: 'kepala_sekolah',
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    return principalUser;
  } catch (error) {
    console.error('Error fetching active principal user:', error);
    return null;
  }
}

/**
 * Mengambil profil lengkap Kepala Sekolah:
 * - Identitas (nama, id, email) bersumber dari User (canonical)
 * - Foto & Sambutan bersumber dari PrincipalProfile (CMS)
 * - Jabatan bersumber dari PrincipalProfile (CMS), fallback 'Belum ditetapkan'
 * - NIP: 'NIP. -' (karena belum tersedia di schema database)
 */
export async function getPrincipalCompositeProfile() {
  const [principalUser, principalContent] = await Promise.all([
    getActivePrincipal(),
    prisma.principalProfile.findFirst().catch(() => null),
  ]);

  return {
    id: principalUser?.id || null,
    name: principalUser?.name || 'Belum ditetapkan',
    username: principalUser?.username || null,
    email: principalUser?.email || null,
    position: principalContent?.position || 'Belum ditetapkan',
    nip: 'NIP. -',
    photo: principalContent?.photo || '/images/kepala-sekolah.jpg',
    message:
      principalContent?.message ||
      'Mari kita jadikan sekolah sebagai tempat untuk tumbuh, belajar, berkarya, dan mempersiapkan masa depan dengan penuh integritas dan kecintaan pada lingkungan hidup.',
    hasActivePrincipal: !!principalUser,
  };
}

/**
 * Proyeksi publik data Kepala Sekolah:
 * Hanya mengekspos name, position, photo, dan message.
 * Tidak mengekspos NIP, ID, username, email, role, ataupun status teknis akun.
 */
export async function getPublicPrincipalProfile() {
  const [principalUser, principalContent] = await Promise.all([
    getActivePrincipal(),
    prisma.principalProfile.findFirst().catch(() => null),
  ]);

  return {
    name: principalUser?.name || 'Belum ditetapkan',
    position: principalContent?.position || 'Belum ditetapkan',
    photo: principalContent?.photo || '/images/kepala-sekolah.jpg',
    message:
      principalContent?.message ||
      'Mari kita jadikan sekolah sebagai tempat untuk tumbuh, belajar, berkarya, dan mempersiapkan masa depan dengan penuh integritas dan kecintaan pada lingkungan hidup.',
  };
}
