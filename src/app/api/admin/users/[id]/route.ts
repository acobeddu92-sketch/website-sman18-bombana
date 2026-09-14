import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

async function getAdminSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || session.role !== 'administrator') return null;
  return session;
}

// PUT: Update user (nama, email, role, is_active, reset password)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { name, email, role, is_active, newPassword } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    // Siapkan update payload
    const updateData: any = {};

    if (name) updateData.name = String(name).trim();
    if (email) updateData.email = String(email).trim().toLowerCase();
    if (role) {
      const validRoles = ['administrator', 'kepala_sekolah', 'guru', 'siswa'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (is_active !== undefined) {
      // Cegah admin menonaktifkan akunnya sendiri
      if (admin.id === id && is_active === false) {
        return NextResponse.json(
          { error: 'Anda tidak dapat menonaktifkan akun administrator Anda sendiri.' },
          { status: 400 }
        );
      }
      updateData.is_active = Boolean(is_active);
    }
    // Jika ada reset password
    if (newPassword && newPassword.trim().length > 0) {
      updateData.password_hash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memperbarui user.' }, { status: 500 });
  }
}

// DELETE: Hapus user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  const { id } = params;

  // Cegah menghapus akun admin sendiri
  if (admin.id === id) {
    return NextResponse.json(
      { error: 'Anda tidak dapat menghapus akun administrator Anda sendiri.' },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menghapus user.' }, { status: 500 });
  }
}
