import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEbookManagementAccess, verifyEbookReadAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar seluruh kategori e-book (Bisa diakses Admin, Kepala Perpustakaan, dan Siswa)
export async function GET(request: NextRequest) {
  const { errorResponse } = await verifyEbookReadAccess(request);
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

    const categories = await prisma.eBookCategory.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { ebooks: true },
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
        ebooks_count: c._count.ebooks,
        created_at: c.created_at,
        updated_at: c.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/ebook-categories:', error);
    return NextResponse.json(
      { error: 'Gagal memuat kategori buku elektronik.' },
      { status: 500 }
    );
  }
}

// POST: Buat kategori e-book baru (Khusus Administrator & Kepala Perpustakaan)
export async function POST(request: NextRequest) {
  const { errorResponse } = await verifyEbookManagementAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, code, description } = body;

    const trimmedName = name?.trim();
    const trimmedCode = code?.trim();

    if (!trimmedName || !trimmedCode) {
      return NextResponse.json(
        { error: 'Nama kategori dan kode klasifikasi e-book wajib diisi.' },
        { status: 400 }
      );
    }

    // Cek konflik nama unik
    const existingName = await prisma.eBookCategory.findUnique({
      where: { name: trimmedName },
    });
    if (existingName) {
      return NextResponse.json(
        { error: `Kategori e-book dengan nama "${trimmedName}" sudah ada.` },
        { status: 409 }
      );
    }

    // Cek konflik kode unik
    const existingCode = await prisma.eBookCategory.findUnique({
      where: { code: trimmedCode },
    });
    if (existingCode) {
      return NextResponse.json(
        { error: `Kategori e-book dengan kode "${trimmedCode}" sudah ada.` },
        { status: 409 }
      );
    }

    const category = await prisma.eBookCategory.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Kategori e-book berhasil dibuat.',
        category: {
          id: category.id,
          name: category.name,
          code: category.code,
          description: category.description,
          ebooks_count: 0,
          created_at: category.created_at,
          updated_at: category.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/library/ebook-categories:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nama atau kode kategori e-book sudah digunakan.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal membuat kategori buku elektronik.' },
      { status: 500 }
    );
  }
}
