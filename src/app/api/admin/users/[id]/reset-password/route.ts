import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

async function getAdminSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || session.role !== 'administrator') return null;
  return session;
}

// Menghasilkan password sementara yang kuat namun mudah diketik oleh pengguna
function generateTemporaryPassword(): string {
  // Contoh format: Sman18-XXXX (kombinasi huruf besar/kecil/angka acak)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz';
  let randomPart = '';
  const randomBytes = crypto.randomBytes(5);
  for (let i = 0; i < 5; i++) {
    randomPart += chars[randomBytes[i] % chars.length];
  }
  return `Sm18#${randomPart}`;
}

// POST: Reset password user oleh Administrator
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya untuk Administrator.' }, { status: 403 });
  }

  const { id } = params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // 1. Generate password acak sementara
    const temporaryPassword = generateTemporaryPassword();

    // 2. Hash password dengan bcrypt
    const password_hash = await hashPassword(temporaryPassword);

    // 3. Simpan hash ke database & aktifkan flag force_password_change
    // PERHATIAN: Password plaintext TIDAK PERNAH disimpan di database ataupun dicatat ke log server
    await prisma.user.update({
      where: { id },
      data: {
        password_hash,
        force_password_change: true,
      },
    });

    // 4. Kembalikan password sementara HANYA SATU KALI ke UI admin
    return NextResponse.json({
      success: true,
      message: 'Password akun berhasil direset.',
      user: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
      },
      temporaryPassword,
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat mereset password pengguna.' },
      { status: 500 }
    );
  }
}
