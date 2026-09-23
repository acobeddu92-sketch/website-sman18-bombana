import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './lib/auth';
import { AUTH_COOKIE_NAME } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // 0. Penegakan force_password_change (User WAJIB mengganti password sebelum dapat mengakses dashboard biasa)
  if (session && session.force_password_change) {
    if (pathname !== '/dashboard/profile') {
      return NextResponse.redirect(new URL('/dashboard/profile?forceChange=true', request.url));
    }
    return NextResponse.next();
  }

  // 1. Proteksi rute /admin/*
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Silakan login terlebih dahulu.');
      return NextResponse.redirect(loginUrl);
    }

    // Role BUKAN administrator -> TOLAK AKSES, arahkan ke dashboard peran masing-masing
    if (session.role !== 'administrator') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. Proteksi rute /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Silakan login terlebih dahulu.');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Akses ke halaman /login jika pengguna SUDAH terautentikasi
  if (pathname === '/login') {
    if (session) {
      if (session.role === 'administrator') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login'],
};
