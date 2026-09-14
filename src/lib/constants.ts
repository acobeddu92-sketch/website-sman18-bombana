export type UserRole = 'administrator' | 'kepala_sekolah' | 'guru' | 'siswa';

export const ROLES: Record<UserRole, { label: string; dashboardUrl: string }> = {
  administrator: {
    label: 'Administrator',
    dashboardUrl: '/admin',
  },
  kepala_sekolah: {
    label: 'Kepala Sekolah',
    dashboardUrl: '/dashboard',
  },
  guru: {
    label: 'Guru',
    dashboardUrl: '/dashboard',
  },
  siswa: {
    label: 'Siswa',
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
