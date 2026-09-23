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
        nip: true,
        photo: true,
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
 * - Identitas (nama, id, email, nip, photo) bersumber dari User (canonical)
 * - Foto transisi: User.photo (prioritas) -> PrincipalProfile.photo (fallback sementara) -> default
 * - Sambutan & Jabatan bersumber dari PrincipalProfile (CMS)
 */
export async function getPrincipalCompositeProfile() {
  const [principalUser, principalContent] = await Promise.all([
    getActivePrincipal(),
    prisma.principalProfile.findFirst().catch(() => null),
  ]);

  const photo = principalUser?.photo || principalContent?.photo || '/images/kepala-sekolah.jpg';
  const nip = principalUser?.nip ? (principalUser.nip.startsWith('NIP') ? principalUser.nip : `NIP. ${principalUser.nip}`) : 'NIP. -';

  return {
    id: principalUser?.id || null,
    name: principalUser?.name || 'Belum ditetapkan',
    username: principalUser?.username || null,
    email: principalUser?.email || null,
    position: principalContent?.position || 'Belum ditetapkan',
    nip,
    photo,
    message:
      principalContent?.message ||
      'Mari kita jadikan sekolah sebagai tempat untuk tumbuh, belajar, berkarya, dan mempersiapkan masa depan dengan penuh integritas dan kecintaan pada lingkungan hidup.',
    hasActivePrincipal: !!principalUser,
  };
}

/**
 * Proyeksi publik data Kepala Sekolah:
 * Hanya mengekspos name, position, photo, dan message.
 * Foto mengutamakan User.photo, dengan fallback PrincipalProfile.photo.
 * Tidak mengekspos NIP, ID, username, email, role, ataupun status teknis akun.
 */
export async function getPublicPrincipalProfile() {
  const [principalUser, principalContent] = await Promise.all([
    getActivePrincipal(),
    prisma.principalProfile.findFirst().catch(() => null),
  ]);

  const photo = principalUser?.photo || principalContent?.photo || '/images/kepala-sekolah.jpg';

  return {
    name: principalUser?.name || 'Belum ditetapkan',
    position: principalContent?.position || 'Belum ditetapkan',
    photo,
    message:
      principalContent?.message ||
      'Mari kita jadikan sekolah sebagai tempat untuk tumbuh, belajar, berkarya, dan mempersiapkan masa depan dengan penuh integritas dan kecintaan pada lingkungan hidup.',
  };
}
