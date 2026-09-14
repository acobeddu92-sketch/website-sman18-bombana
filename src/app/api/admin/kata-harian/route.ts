import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

async function getAdminSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || session.role !== 'administrator') return null;
  return session;
}

// GET: Ambil daftar kata-kata harian
export async function GET(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  try {
    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search && search.trim().length > 0) {
      where.content = {
        contains: search.trim(),
      };
    }

    const messages = await prisma.dailyMessage.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const totalCount = await prisma.dailyMessage.count();
    const activeCount = await prisma.dailyMessage.count({ where: { is_active: true } });

    return NextResponse.json({
      messages,
      totalCount,
      activeCount,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal mengambil kata-kata harian.' }, { status: 500 });
  }
}

// POST: Tambah kata-kata harian baru
export async function POST(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { content, category, author, is_active } = body;

    if (!content || !category) {
      return NextResponse.json(
        { error: 'Isi pesan dan kategori wajib diisi.' },
        { status: 400 }
      );
    }

    const validCategories = ['motivasi', 'nasehat', 'pantun'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Kategori harus berupa: motivasi, nasehat, atau pantun.' },
        { status: 400 }
      );
    }

    const newMessage = await prisma.dailyMessage.create({
      data: {
        content: String(content).trim(),
        category,
        author: author ? String(author).trim() : 'Anonim',
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
    });

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal menambahkan kata harian.' }, { status: 500 });
  }
}
