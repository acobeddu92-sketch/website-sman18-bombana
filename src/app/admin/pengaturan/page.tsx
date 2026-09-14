'use client';

import React, { useState } from 'react';
import { Settings, Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPengaturanPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setIsError(true);
      setMsg('Password baru minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      // Ambil session user
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meRes.ok || !meData.user) {
        setIsError(true);
        setMsg('Sesi tidak valid.');
        setLoading(false);
        return;
      }

      // Update password user admin
      const res = await fetch(`/api/admin/users/${meData.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg('Password administrator berhasil diubah!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setIsError(true);
        setMsg(data.error || 'Gagal mengubah password.');
      }
    } catch (e) {
      setIsError(true);
      setMsg('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-emerald-600" />
          <span>Pengaturan Akun & Sistem</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pengaturan keamanan akun administrator dan konfigurasi dasar website.
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2 ${
            isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
          <span>{msg}</span>
        </div>
      )}

      {/* Form Ganti Password Administrator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm max-w-xl">
        <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600" />
          <span>Ganti Password Administrator</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Ubah password akun admin default untuk menjaga keamanan hak akses tertinggi sistem sekolah.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-70"
          >
            {loading ? 'Menyimpan...' : 'Perbarui Password Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
