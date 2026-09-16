import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

// Middleware helper untuk verifikasi role admin
async function getAdminSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || session.role !== 'administrator') return null;
  return session;
}

// GET: Ambil daftar user
export async function GET(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengambil data user.' }, { status: 500 });
  }
}

// POST: Buat user baru
export async function POST(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, username, email, password, role, is_active } = body;

    if (!name || !username || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nama, username, email, password, dan role wajib diisi.' },
        { status: 400 }
      );
    }

    const validRoles = [
      'administrator',
      'kepala_sekolah',
      'wakasek_kurikulum',
      'wakasek_kesiswaan',
      'kepala_perpustakaan',
      'guru_mapel',
      'wali_kelas',
      'guru_bk',
      'siswa',
      'guru',
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
    }

    // Cek duplikasi username atau email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: String(username).trim() },
          { email: String(email).trim().toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username atau email sudah digunakan oleh user lain.' },
        { status: 400 }
      );
    }

    // Hash password menggunakan bcrypt
    const password_hash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        username: String(username).trim(),
        email: String(email).trim().toLowerCase(),
        password_hash,
        role,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal membuat user baru.' }, { status: 500 });
  }
}
