import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, signSessionToken, cookieOptions } from '@/lib/auth';
import { AUTH_COOKIE_NAME, UserRole } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// GET: Ambil profil user yang sedang login (self-service)
export async function GET() {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }

    // Ambil data User dari database
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        nip: true,
        nik: true,
        photo: true,
        phone: true,
        gender: true,
        birth_place: true,
        birth_date: true,
        address: true,
        force_password_change: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Jika user adalah siswa, ambil relasi data akademik dari model Student (read-only)
    let studentData = null;
    if (user.role === 'siswa') {
      const student = await prisma.student.findFirst({
        where: { user_id: user.id },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              academic_year: true,
            },
          },
        },
      });

      if (student) {
        studentData = {
          id: student.id,
          nis: student.nis,
          nisn: student.nisn,
          name: student.name,
          gender: student.gender,
          class_name: student.class?.name || 'Belum ada kelas',
          academic_year: student.class?.academic_year || '2026/2027',
          parent_name: student.parent_name,
          parent_phone: student.parent_phone,
          address: student.address,
        };
      }
    }

    return NextResponse.json({
      user,
      student: studentData,
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat profil pengguna.' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui profil pribadi pengguna yang sedang login
export async function PUT(req: NextRequest) {
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

    // Dilarang keras mengubah field akun sensitif / administratif
    // (id, username, role, is_active, password_hash, force_password_change)
    // Server-side strict reject / strip
    const {
      name,
      email,
      nip,
      nik,
      phone,
      gender,
      birth_place,
      birth_date,
      address,
    } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Validasi & Penanganan Nama (SOT Rule: Siswa read-only dari Student, Non-siswa editable)
    if (existingUser.role === 'siswa') {
      // Siswa tidak boleh mengubah namanya sendiri di User karena nama resmi ada di ledger Student
      // Abaikan perubahan nama dari siswa
    } else if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return NextResponse.json({ error: 'Nama tidak boleh kosong.' }, { status: 400 });
      }
      updateData.name = trimmedName;
    }

    // 2. Validasi & Penanganan Email
    if (email !== undefined) {
      const trimmedEmail = String(email).trim().toLowerCase();
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
      }

      if (trimmedEmail !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });
        if (emailExists && emailExists.id !== session.id) {
          return NextResponse.json({ error: 'Email sudah digunakan oleh pengguna lain.' }, { status: 400 });
        }
        updateData.email = trimmedEmail;
      }
    }

    // 3. Validasi & Penanganan NIP
    if (nip !== undefined) {
      const trimmedNip = nip ? String(nip).trim() : null;
      if (trimmedNip && trimmedNip !== existingUser.nip) {
        const nipExists = await prisma.user.findUnique({
          where: { nip: trimmedNip },
        });
        if (nipExists && nipExists.id !== session.id) {
          return NextResponse.json({ error: 'NIP sudah terdaftar untuk pengguna lain.' }, { status: 400 });
        }
      }
      updateData.nip = trimmedNip || null;
    }

    // 4. Field Opsional Lainnya
    if (nik !== undefined) {
      updateData.nik = nik ? String(nik).trim() : null;
    }

    if (phone !== undefined) {
      updateData.phone = phone ? String(phone).trim() : null;
    }

    if (gender !== undefined) {
      updateData.gender = gender ? String(gender).trim() : null;
    }

    if (birth_place !== undefined) {
      updateData.birth_place = birth_place ? String(birth_place).trim() : null;
    }

    if (birth_date !== undefined) {
      updateData.birth_date = birth_date ? new Date(birth_date) : null;
    }

    if (address !== undefined) {
      updateData.address = address ? String(address).trim() : null;
    }

    // Update database
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        nip: true,
        nik: true,
        photo: true,
        phone: true,
        gender: true,
        birth_place: true,
        birth_date: true,
        address: true,
        force_password_change: true,
        updated_at: true,
      },
    });

    // Reissue JWT session token agar session cookie segera menyimpan nama & email terbaru tanpa perlu re-login
    const newToken = await signSessionToken({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      role: updatedUser.role as UserRole,
      email: updatedUser.email,
      force_password_change: updatedUser.force_password_change,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: updatedUser,
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
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui profil pengguna.' },
      { status: 500 }
    );
  }
}
