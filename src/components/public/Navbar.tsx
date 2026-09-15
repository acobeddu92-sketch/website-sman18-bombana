'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LogIn,
  GraduationCap,
  ChevronDown,
  ShieldCheck,
  Award,
  BookOpen,
  Users,
  Library,
  UserCheck,
  Backpack,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface NavbarProps {
  logo?: string | null;
  schoolName?: string;
}

const LOGIN_ROLES = [
  {
    role: 'administrator',
    label: 'Login sebagai Administrator',
    href: '/login?role=administrator',
    icon: ShieldCheck,
  },
  {
    role: 'kepala_sekolah',
    label: 'Login sebagai Kepala Sekolah',
    href: '/login?role=kepala_sekolah',
    icon: Award,
  },
  {
    role: 'wakasek_kurikulum',
    label: 'Login sebagai Wakasek Kurikulum',
    href: '/login?role=wakasek_kurikulum',
    icon: BookOpen,
  },
  {
    role: 'wakasek_kesiswaan',
    label: 'Login sebagai Wakasek Kesiswaan',
    href: '/login?role=wakasek_kesiswaan',
    icon: Users,
  },
  {
    role: 'kepala_perpustakaan',
    label: 'Login sebagai Kepala Perpustakaan',
    href: '/login?role=kepala_perpustakaan',
    icon: Library,
  },
  {
    role: 'guru_mapel',
    label: 'Login sebagai Guru Mapel',
    href: '/login?role=guru_mapel',
    icon: GraduationCap,
  },
  {
    role: 'wali_kelas',
    label: 'Login sebagai Wali Kelas',
    href: '/login?role=wali_kelas',
    icon: UserCheck,
  },
  {
    role: 'siswa',
    label: 'Login sebagai Siswa',
    href: '/login?role=siswa',
    icon: Backpack,
  },
];

export default function Navbar({
  logo = '/images/logo.svg',
  schoolName = 'SMA NEGERI 18 BOMBANA',
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isMobileLoginOpen, setIsMobileLoginOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tutup dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopDropdownRef.current &&
        !desktopDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLoginDropdownOpen(false);
      }
    };

    if (isLoginDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLoginDropdownOpen]);

  // Tutup menu dan dropdown jika berpindah halaman
  useEffect(() => {
    setIsLoginDropdownOpen(false);
    setIsMobileLoginOpen(false);
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Profil Sekolah', href: '/profil' },
    { name: 'Gallery', href: '/galeri' },
    { name: 'Informasi Umum', href: '/informasi' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-emerald-100/60 py-2'
          : 'bg-white border-b border-slate-100 py-2.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Identitas Sekolah */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200/80 p-1 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200 overflow-hidden">
              <SafeImage
                src={logo}
                alt="Logo Sekolah"
                className="w-full h-full object-contain"
                fallback={<GraduationCap className="w-5 h-5 text-emerald-600" />}
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-emerald-700 uppercase leading-none">
                Official Website
              </span>
              <span className="block text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors leading-tight">
                {schoolName}
              </span>
            </div>
          </a>

          {/* Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50 font-semibold'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Tombol Login Dropdown Desktop */}
          <div className="hidden md:block relative" ref={desktopDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
              aria-expanded={isLoginDropdownOpen}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-700/15 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>LOGIN</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isLoginDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Panel Dropdown Desktop */}
            {isLoginDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-emerald-100 py-2 z-50 animate-fadeIn">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Pilih Portal Login
                  </p>
                </div>
                <div className="py-1 max-h-[calc(100vh-140px)] overflow-y-auto">
                  {LOGIN_ROLES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.role}
                        href={item.href}
                        onClick={() => setIsLoginDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/80 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Hamburger Menu Button untuk Smartphone/Tablet */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none transition-colors"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Dropdown Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-100 pb-4 space-y-2 animate-fadeIn max-h-[calc(100vh-90px)] overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-emerald-800 bg-emerald-50 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}

            {/* Section Login Mobile dengan Dropdown Accordion */}
            <div className="pt-2 border-t border-slate-100/80">
              <button
                type="button"
                onClick={() => setIsMobileLoginOpen(!isMobileLoginOpen)}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm shadow-sm hover:from-emerald-700 hover:to-emerald-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>LOGIN KE PORTAL</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileLoginOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMobileLoginOpen && (
                <div className="mt-2 space-y-1 bg-emerald-50/70 rounded-2xl p-2 border border-emerald-100 animate-fadeIn">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Pilihan Peran:
                  </p>
                  {LOGIN_ROLES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.role}
                        href={item.href}
                        onClick={() => {
                          setIsMobileLoginOpen(false);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white/80 hover:bg-white hover:text-emerald-800 shadow-2xs transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

