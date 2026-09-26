export type UserRole =
  | 'administrator'
  | 'kepala_sekolah'
  | 'wakasek_kurikulum'
  | 'wakasek_kesiswaan'
  | 'kepala_perpustakaan'
  | 'guru_mapel'
  | 'wali_kelas'
  | 'guru_bk'
  | 'pembina_osis'
  | 'pembina_pramuka'
  | 'siswa'
  | 'guru'; // fallback kompatibilitas

export const ROLES: Record<UserRole, { label: string; dashboardUrl: string }> = {
  administrator: {
    label: 'Administrator',
    dashboardUrl: '/admin',
  },
  kepala_sekolah: {
    label: 'Kepala Sekolah',
    dashboardUrl: '/dashboard',
  },
  wakasek_kurikulum: {
    label: 'Wakasek Kurikulum',
    dashboardUrl: '/dashboard',
  },
  wakasek_kesiswaan: {
    label: 'Wakasek Kesiswaan',
    dashboardUrl: '/dashboard',
  },
  kepala_perpustakaan: {
    label: 'Kepala Perpustakaan',
    dashboardUrl: '/dashboard',
  },
  guru_mapel: {
    label: 'Guru Mapel',
    dashboardUrl: '/dashboard',
  },
  wali_kelas: {
    label: 'Wali Kelas',
    dashboardUrl: '/dashboard',
  },
  guru_bk: {
    label: 'Guru BK',
    dashboardUrl: '/dashboard',
  },
  pembina_osis: {
    label: 'Pembina OSIS',
    dashboardUrl: '/dashboard',
  },
  pembina_pramuka: {
    label: 'Pembina Pramuka',
    dashboardUrl: '/dashboard',
  },
  siswa: {
    label: 'Siswa',
    dashboardUrl: '/dashboard',
  },
  guru: {
    label: 'Guru',
    dashboardUrl: '/dashboard',
  },
};

export const DAILY_CATEGORIES = {
  motivasi: {
    label: 'Motivasi',
    icon: 'Lightbulb',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  nasehat: {
    label: 'Nasehat',
    icon: 'Sprout',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  pantun: {
    label: 'Pantun Jenaka',
    icon: 'Smile',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
  },
};

export const AUTH_COOKIE_NAME = 'sman18_session';

/**
 * 10 Role Non-Siswa yang memiliki hak membuat album dan mengunggah foto ke Galeri Sekolah:
 * 1. administrator
 * 2. kepala_sekolah
 * 3. wakasek_kurikulum
 * 4. wakasek_kesiswaan
 * 5. kepala_perpustakaan
 * 6. guru_mapel (+ legacy guru)
 * 7. wali_kelas
 * 8. guru_bk
 * 9. pembina_osis
 * 10. pembina_pramuka
 * (Siswa: READ ONLY, mutasi ditolak mutlak dengan HTTP 403)
 */
export const GALLERY_CREATOR_ROLES: UserRole[] = [
  'administrator',
  'kepala_sekolah',
  'wakasek_kurikulum',
  'wakasek_kesiswaan',
  'kepala_perpustakaan',
  'guru_mapel',
  'wali_kelas',
  'guru_bk',
  'pembina_osis',
  'pembina_pramuka',
  'guru', // fallback kompatibilitas
];

/**
 * 2 Role Resmi Pengelola Informasi & Pengumuman Beranda Sekolah:
 * 1. administrator
 * 2. pembina_osis
 * (Role lainnya & Siswa & Publik: READ ONLY, mutasi ditolak mutlak dengan HTTP 403)
 */
export const ANNOUNCEMENT_MANAGER_ROLES: UserRole[] = [
  'administrator',
  'pembina_osis',
];
