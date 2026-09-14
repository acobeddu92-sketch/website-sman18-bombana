'use client';

import { useEffect } from 'react';

/**
 * Mengatur scroll behavior khusus halaman Home:
 * - Pada Desktop (>= 1024px): matikan vertical scroll (100vh single-screen).
 * - Pada Tablet & Smartphone (< 1024px): izinkan vertical scroll normal.
 * - Saat navigasi keluar dari Home (unmount): kembalikan scroll default browser.
 */
export default function HomeScrollManager() {
  useEffect(() => {
    const handleScrollLock = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
      }
    };

    handleScrollLock();
    window.addEventListener('resize', handleScrollLock);

    return () => {
      // Pastikan ketika user berpindah ke /profil, /galeri, /informasi, dll, scroll kembali normal
      document.documentElement.style.overflow = '';
      window.removeEventListener('resize', handleScrollLock);
    };
  }, []);

  return null;
}
