import React from 'react';

interface FooterProps {
  logo?: string | null;
  schoolName?: string;
}

export default function Footer({
  schoolName = 'SMA NEGERI 18 BOMBANA',
}: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-2.5 sm:py-3 border-t border-slate-800 text-xs shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wide">{schoolName}</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-emerald-400 font-medium">Green &amp; Friendly School</span>
        </div>
        <div className="text-[11px] text-slate-500">
          © {new Date().getFullYear()} {schoolName}. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
}
