import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar seluruh kategori buku
export async function GET(request: NextRequest) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim() || '';

  try {
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const categories = await prisma.bookCategory.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      count: categories.length,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        description: c.description,
        books_count: c._count.books,
        created_at: c.created_at,
        updated_at: c.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/categories:', error);
    return NextResponse.json(
      { error: 'Gagal memuat kategori buku.' },
      { status: 500 }
    );
  }
}

// POST: Buat kategori buku baru
export async function POST(request: NextRequest) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, code, description } = body;

    const trimmedName = name?.trim();
    const trimmedCode = code?.trim();

    if (!trimmedName || !trimmedCode) {
      return NextResponse.json(
        { error: 'Nama kategori dan kode klasifikasi wajib diisi.' },
        { status: 400 }
      );
    }

    // Cek konflik nama unik
    const existingName = await prisma.bookCategory.findUnique({
      where: { name: trimmedName },
    });
    if (existingName) {
      return NextResponse.json(
        { error: `Kategori dengan nama "${trimmedName}" sudah ada.` },
        { status: 409 }
      );
    }

    // Cek konflik kode unik
    const existingCode = await prisma.bookCategory.findUnique({
      where: { code: trimmedCode },
    });
    if (existingCode) {
      return NextResponse.json(
        { error: `Kategori dengan kode "${trimmedCode}" sudah ada.` },
        { status: 409 }
      );
    }

    const category = await prisma.bookCategory.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Kategori buku berhasil ditambahkan.',
        category,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/library/categories:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nama atau kode kategori sudah terdaftar (harus unik).' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal menambahkan kategori buku.' },
      { status: 500 }
    );
  }
}
