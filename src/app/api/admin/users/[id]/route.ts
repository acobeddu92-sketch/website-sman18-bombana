import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { AUTH_COOKIE_NAME, ROLES } from '@/lib/constants';

class SafeguardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeguardError';
  }
}

class UserNotFoundError extends Error {
  constructor(message: string = 'User tidak ditemukan.') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

async function getAdminSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || session.role !== 'administrator') return null;
  return session;
}

// PUT: Update user (HANYA role dan is_active oleh Admin)
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
    const { role, is_active } = body;

    if (role !== undefined) {
      const validRoles = Object.keys(ROLES);
      if (!role || !validRoles.includes(role)) {
        return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
      }
    }

    if (is_active !== undefined) {
      // Cegah admin menonaktifkan akunnya sendiri jika masih admin aktif tunggal
      if (admin.id === id && is_active === false) {
        return NextResponse.json(
          { error: 'Anda tidak dapat menonaktifkan akun administrator Anda sendiri.' },
          { status: 400 }
        );
      }
    }

    // Eksekusi mutasi dalam transaksi serial dengan advisory lock untuk concurrency safety
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Kunci transaksi PostgreSQL eksklusif untuk mutasi administratif pengguna
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('admin_user_safeguard')::bigint)`;

      const existingUser = await tx.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new UserNotFoundError('User tidak ditemukan.');
      }

      // Safeguard Administrator Terakhir:
      // Jika target user saat ini adalah administrator aktif
      if (existingUser.role === 'administrator' && existingUser.is_active) {
        const isDemoting = role !== undefined && role !== 'administrator';
        const isDeactivating = is_active !== undefined && is_active === false;

        if (isDemoting || isDeactivating) {
          const activeAdminCount = await tx.user.count({
            where: { role: 'administrator', is_active: true },
          });

          if (activeAdminCount <= 1) {
            const errorMsg = isDemoting
              ? 'Tidak dapat mengubah role administrator terakhir. Sistem membutuhkan minimal satu administrator aktif.'
              : 'Tidak dapat menonaktifkan administrator terakhir. Sistem membutuhkan minimal satu administrator aktif.';
            throw new SafeguardError(errorMsg);
          }
        }
      }

      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = Boolean(is_active);

      return await tx.user.update({
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
    });

    return NextResponse.json({
      success: true,
      message: 'Status/peran akun berhasil diperbarui.',
      user: updatedUser,
    });
  } catch (error: any) {
    if (error instanceof UserNotFoundError || error?.name === 'UserNotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof SafeguardError || error?.name === 'SafeguardError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error in PUT /api/admin/users/[id]:', error);
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
    await prisma.$transaction(async (tx) => {
      // Kunci transaksi PostgreSQL eksklusif untuk mutasi administratif pengguna
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('admin_user_safeguard')::bigint)`;

      const existingUser = await tx.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new UserNotFoundError('User tidak ditemukan.');
      }

      // Safeguard Administrator Terakhir pada penghapusan akun
      if (existingUser.role === 'administrator' && existingUser.is_active) {
        const activeAdminCount = await tx.user.count({
          where: { role: 'administrator', is_active: true },
        });

        if (activeAdminCount <= 1) {
          throw new SafeguardError(
            'Tidak dapat menghapus administrator terakhir. Sistem membutuhkan minimal satu administrator aktif.'
          );
        }
      }

      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (error: any) {
    if (error instanceof UserNotFoundError || error?.name === 'UserNotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof SafeguardError || error?.name === 'SafeguardError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Gagal menghapus user.' }, { status: 500 });
  }
}
