import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, signSessionToken, cookieOptions } from '@/lib/auth';
import { AUTH_COOKIE_NAME, UserRole } from '@/lib/constants';
import { hashPassword, verifyPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }

    const body = await req.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // 1. Validasi input kelengkapan
    if (!oldPassword) {
      return NextResponse.json({ error: 'Password lama wajib diisi.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Konfirmasi password baru tidak cocok.' }, { status: 400 });
    }

    if (oldPassword === newPassword) {
      return NextResponse.json({ error: 'Password baru tidak boleh sama dengan password lama.' }, { status: 400 });
    }

    // 2. Ambil user dari database
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // 3. Verifikasi password lama
    const isOldPasswordValid = await verifyPassword(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      return NextResponse.json({ error: 'Password lama Anda tidak sesuai.' }, { status: 400 });
    }

    // 4. Hash password baru & simpan ke database dengan force_password_change = false
    const password_hash = await hashPassword(newPassword);
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        password_hash,
        force_password_change: false,
      },
    });

    // 5. Terbitkan session token baru yang bersih dari force_password_change
    const newToken = await signSessionToken({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      role: updatedUser.role as UserRole,
      email: updatedUser.email,
      force_password_change: false,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui. Akses dashboard Anda kini telah aktif sepenuhnya.',
    });

    response.cookies.set({
      name: cookieOptions.name,
      value: newToken,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server saat memperbarui password.' },
      { status: 500 }
    );
  }
}
