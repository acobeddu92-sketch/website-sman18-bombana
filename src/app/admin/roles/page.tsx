'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Sparkles,
  RefreshCw,
  Loader2,
  Lock,
  UserCheck,
  GraduationCap,
  BookOpen,
  Calendar,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { ROLES, UserRole } from '@/lib/constants';

interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface RoleDefinition {
  key: UserRole;
  label: string;
  description: string;
  scope: string;
  badgeBg: string;
  icon: any;
}

const OFFICIAL_ROLE_KEYS: Exclude<UserRole, 'guru'>[] = [
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
  'siswa',
];

const ROLE_METADATA: Record<
  Exclude<UserRole, 'guru'>,
  {
    description: string;
    scope: string;
    badgeBg: string;
    icon: any;
  }
> = {
  administrator: {
    description: 'Hak akses penuh ke seluruh pengaturan sistem, manajemen akun pengguna, dan konten portal sekolah.',
    scope: 'Akses Penuh Seluruh Sistem',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: ShieldAlert,
  },
  kepala_sekolah: {
    description: 'Akses monitoring eksekutif, rekapitulasi data akademik, profil sekolah, dan evaluasi pembelajaran.',
    scope: 'Monitoring & Sambutan',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: UserCheck,
  },
  wakasek_kurikulum: {
    description: 'Pengelolaan struktur kurikulum, jadwal pelajaran sekolah, pembagian SK guru, dan perangkat ajar.',
    scope: 'Kurikulum & Jadwal',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    icon: Calendar,
  },
  wakasek_kesiswaan: {
    description: 'Pengawasan disiplin siswa, presensi terpadu sekolah, izin santri/siswa, dan penegakan ketertiban.',
    scope: 'Kesiswaan & Ketertiban',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: Users,
  },
  kepala_perpustakaan: {
    description: 'Pengelolaan koleksi buku fisik, katalog e-book, sirkulasi peminjaman, pengembalian, dan denda.',
    scope: 'Perpustakaan & E-Book',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: BookOpen,
  },
  guru_mapel: {
    description: 'Pengelolaan materi ajar, penugasan siswa, absensi kegiatan belajar mengajar, dan jadwal piket.',
    scope: 'Pembelajaran Mapel',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: Briefcase,
  },
  wali_kelas: {
    description: 'Pembinaan khusus rombel binaan, absensi kelas, rekap nilai siswa, dan catatan perilaku peserta didik.',
    scope: 'Rombel Binaan',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
    icon: GraduationCap,
  },
  guru_bk: {
    description: 'Layanan bimbingan konseling peserta didik, pencatatan pelanggaran siswa, dan tindak lanjut kasus.',
    scope: 'Bimbingan Konseling',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: HeartHandshakeIcon,
  },
  pembina_osis: {
    description: 'Pembimbingan agenda kesiswaan OSIS, kepengurusan peserta didik, dan program kegiatan sekolah.',
    scope: 'Organisasi Siswa',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: Users,
  },
  pembina_pramuka: {
    description: 'Pembimbingan gerakan kepanduan pramuka gugus depan, latihan terpadu, dan perkemahan berkala.',
    scope: 'Gerakan Pramuka',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-400',
    icon: Sparkles,
  },
  siswa: {
    description: 'Akses jadwal harian, unduh materi, pantau tugas, dan membaca koleksi buku elektronik terbitan.',
    scope: 'Portal Peserta Didik',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    icon: GraduationCap,
  },
};

const ROLE_DEFINITIONS: RoleDefinition[] = OFFICIAL_ROLE_KEYS.map((key) => ({
  key,
  label: ROLES[key].label,
  description: ROLE_METADATA[key].description,
  scope: ROLE_METADATA[key].scope,
  badgeBg: ROLE_METADATA[key].badgeBg,
  icon: ROLE_METADATA[key].icon,
}));

function HeartHandshakeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Modal Ubah Role
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alerts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal memuat daftar pengguna.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Gagal terhubung ke server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const clearFeedback = () => setFeedback(null);

  // Hitung Agregasi per Role Resmi (dengan normalisasi legacy 'guru' -> 'guru_mapel')
  const roleCounts = useMemo(() => {
    const counts: Record<string, { total: number; active: number }> = {};
    OFFICIAL_ROLE_KEYS.forEach((k) => {
      counts[k] = { total: 0, active: 0 };
    });
    users.forEach((u) => {
      const r = u.role === 'guru' ? 'guru_mapel' : u.role;
      if (counts[r]) {
        counts[r].total += 1;
        if (u.is_active) counts[r].active += 1;
      }
    });
    return counts;
  }, [users]);

  // Total Admin Aktif
  const activeAdminCount = useMemo(() => {
    return users.filter((u) => u.role === 'administrator' && u.is_active).length;
  }, [users]);

  // Filter User List (dengan normalisasi role legacy)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const normalizedUserRole = u.role === 'guru' ? 'guru_mapel' : u.role;
      const matchRole = filterRole === 'all' || normalizedUserRole === filterRole || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, filterRole]);

  const openChangeRoleModal = (u: UserItem) => {
    setEditingUser(u);
    const initialRole = u.role === 'guru' ? 'guru_mapel' : u.role;
    setSelectedRole(initialRole);
    setShowRoleWarning(u.role === 'administrator' && activeAdminCount <= 1);
  };

  const [showRoleWarning, setShowRoleWarning] = useState(false);

  const handleChangeRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Role akun @${editingUser.username} (${editingUser.name}) berhasil diubah menjadi ${ROLES[selectedRole as UserRole]?.label || selectedRole}.`,
        });
        setEditingUser(null);
        fetchUsers();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Gagal mengubah role pengguna.',
        });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem saat memperbarui role.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kontrol Hak Akses & Keamanan Sistem</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-emerald-600" />
            <span>Pengaturan Role & Hak Akses</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar 11 peran resmi sistem informasi SMAN 18 Bombana dan penetapan akun pengguna.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={clearFeedback} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Safeguard Info Banner */}
      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-purple-900 text-xs sm:text-sm flex items-start gap-3">
        <Lock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Proteksi Administrator Tunggal (Last-Admin Safeguard) Aktif</p>
          <p className="text-purple-800 text-xs leading-relaxed">
            Sistem secara ketat mengunci perubahan peran jika tersisa hanya 1 administrator aktif (Jumlah saat ini: <strong>{activeAdminCount} administrator aktif</strong>). Transaksi diamankan dengan PostgreSQL Transaction Advisory Lock untuk mencegah race condition.
          </p>
        </div>
      </div>

      {/* 11 ROLES OVERVIEW GRID */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Matriks 11 Role Resmi Sekolah</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLE_DEFINITIONS.map((def) => {
            const Icon = def.icon;
            const stats = roleCounts[def.key] || { total: 0, active: 0 };
            return (
              <div
                key={def.key}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${def.badgeBg} flex items-center gap-1.5`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{def.label}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {def.scope}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-2">{def.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pengguna Terdaftar:</span>
                  <span className="font-bold text-slate-900">
                    {stats.total} akun{' '}
                    <span className="text-emerald-600 font-semibold">({stats.active} aktif)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* USER LIST & ASSIGNMENT TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Daftar Pengguna & Penetapan Role</span>
            </h2>
            <p className="text-xs text-slate-500">Pilih akun pengguna untuk memperbarui hak akses peran.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari user..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="all">Semua Role</option>
              {ROLE_DEFINITIONS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat data pengguna...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Tidak ada pengguna ditemukan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama & Username</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role Saat Ini</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => {
                    const roleInfo = ROLES[u.role as UserRole] || { label: u.role };
                    const isSoleAdmin = u.role === 'administrator' && activeAdminCount <= 1;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-slate-400 font-mono text-xs">@{u.username}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              u.role === 'administrator'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : u.role === 'kepala_sekolah'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : u.role === 'guru'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {u.role === 'guru' ? `${ROLES.guru_mapel.label} (Legacy)` : roleInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openChangeRoleModal(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ubah Role</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: TETAPKAN / UBAH ROLE                                        */}
      {/* ------------------------------------------------------------------- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Tetapkan Peran Pengguna</h3>
              <button onClick={() => setEditingUser(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="text-slate-500 text-xs">Akun Pengguna:</p>
              <p className="font-bold text-slate-900 text-sm">
                {editingUser.name} <span className="font-mono text-slate-500 font-normal">(@{editingUser.username})</span>
              </p>
              <p className="text-xs text-slate-500">Email: {editingUser.email}</p>
            </div>

            {showRoleWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Peringatan Khusus:</strong> Akun ini saat ini adalah satu-satunya administrator aktif pada sistem. Jika role diubah, backend akan menolak permintaan demi menjaga ketersediaan akun administratif.
                </span>
              </div>
            )}

            <form onSubmit={handleChangeRoleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold mb-1.5 text-slate-800">
                  Pilih Peran Baru:
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {ROLE_DEFINITIONS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label} — ({d.scope})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Peran</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
