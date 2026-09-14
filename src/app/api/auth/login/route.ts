import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signSessionToken, cookieOptions } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { UserRole } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 1. Validasi input dasar
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    // 2. Cari user di database murni berdasarkan username
    const user = await prisma.user.findUnique({
      where: { username: String(username).trim() },
    });

    if (!user) {
      // Pesan error umum untuk keamanan (mencegah enumerasi akun)
      return NextResponse.json(
        { error: 'Username atau password tidak valid.' },
        { status: 401 }
      );
    }

    // 3. Periksa status keaktifan akun
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Akun Anda tidak aktif. Silakan hubungi Administrator.' },
        { status: 403 }
      );
    }

    // 4. Verifikasi password dengan Bcrypt
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Username atau password tidak valid.' },
        { status: 401 }
      );
    }

    // 5. AMBIL ROLE DARI DATABASE (Role tidak boleh ditentukan dari frontend!)
    const userRole = user.role as UserRole;

    // 6. Buat Token JWT Session
    const token = await signSessionToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: userRole,
      email: user.email,
    });

    // 7. Tentukan tujuan pengalihan (redirect) berdasarkan role
    const redirectUrl = userRole === 'administrator' ? '/admin' : '/dashboard';

    // 8. Bentuk Response & Simpan Token ke HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        email: user.email,
      },
      redirectUrl,
    });

    response.cookies.set({
      name: cookieOptions.name,
      value: token,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memproses login.' },
      { status: 500 }
    );
  }
}
