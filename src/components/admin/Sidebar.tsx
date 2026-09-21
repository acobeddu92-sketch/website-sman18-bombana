'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Home,
  MessageSquareQuote,
  School,
  Image as ImageIcon,
  Bell,
  Settings,
  GraduationCap,
  ExternalLink,
  X,
} from 'lucide-react';
import LogoutButton from '../dashboard/LogoutButton';

import SafeImage from '@/components/ui/SafeImage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser?: {
    name: string;
    username: string;
    email: string;
  };
  logo?: string | null;
}

export default function Sidebar({ isOpen, onClose, adminUser, logo }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Data Siswa', href: '/admin/siswa', icon: UserCheck },
    { name: 'Beranda', href: '/admin/beranda', icon: Home },
    { name: 'Kata-Kata Harian', href: '/admin/kata-harian', icon: MessageSquareQuote },
    { name: 'Profil Sekolah', href: '/admin/profil', icon: School },
    { name: 'Gallery', href: '/admin/galeri', icon: ImageIcon },
    { name: 'Informasi Umum', href: '/admin/informasi', icon: Bell },
    { name: 'PPDB', href: '/admin/ppdb', icon: GraduationCap },
    { name: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop untuk Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <a href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-emerald-500/20 overflow-hidden shrink-0">
              <SafeImage
                src={logo || '/images/logo.svg'}
                alt="Logo SMAN 18"
                className="w-full h-full object-contain"
                fallback={<GraduationCap className="w-6 h-6 text-emerald-600" />}
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Admin Panel
              </span>
              <span className="block text-sm font-bold text-white tracking-tight">
                SMAN 18 BOMBANA
              </span>
            </div>
          </a>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Tutup sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigasi */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <a
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/25'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </a>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tautan Cepat
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-emerald-400 transition-colors"
          >
            <span className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Buka Website</span>
            </span>
          </a>
        </div>

        {/* User Card & Logout di Bagian Bawah */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white text-xs font-bold uppercase">
              {adminUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {adminUser?.name || 'Administrator'}
              </p>
              <p className="text-[11px] text-emerald-400 truncate">
                @{adminUser?.username || 'admin'} • Admin
              </p>
            </div>
          </div>

          <div className="w-full">
            <LogoutButton className="w-full justify-center text-xs py-2 bg-slate-900 border-slate-800 text-red-400 hover:bg-red-950/40 hover:text-red-300 hover:border-red-900" />
          </div>
        </div>
      </aside>
    </>
  );
}
