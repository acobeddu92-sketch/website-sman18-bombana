'use client';

import React from 'react';
import { Menu, ExternalLink, ShieldCheck } from 'lucide-react';
import LogoutButton from '../dashboard/LogoutButton';

interface HeaderProps {
  onToggleSidebar: () => void;
  adminName?: string;
}

export default function Header({ onToggleSidebar, adminName = 'Administrator' }: HeaderProps) {
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Panel Administrator</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Full Access</span>
            </span>
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Lihat Website</span>
        </a>

        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-600 font-medium">
          <span>Login sebagai: <strong>{adminName}</strong></span>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
