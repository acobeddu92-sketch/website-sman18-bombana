'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Menu, X, LogIn, GraduationCap } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface NavbarProps {
  logo?: string | null;
  schoolName?: string;
}

export default function Navbar({
  logo = '/images/logo.svg',
  schoolName = 'SMA NEGERI 18 BOMBANA',
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

          {/* Tombol Login Universal (Single Button) */}
          <div className="hidden md:flex items-center">
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-700/15 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>LOGIN</span>
            </a>
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
          <div className="md:hidden mt-3 pt-3 border-t border-slate-100 pb-4 space-y-2 animate-fadeIn">
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
            <div className="pt-2">
              <a
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>LOGIN KE PORTAL</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
