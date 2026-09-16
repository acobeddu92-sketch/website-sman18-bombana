export type UserRole =
  | 'administrator'
  | 'kepala_sekolah'
  | 'wakasek_kurikulum'
  | 'wakasek_kesiswaan'
  | 'kepala_perpustakaan'
  | 'guru_mapel'
  | 'wali_kelas'
  | 'guru_bk'
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
