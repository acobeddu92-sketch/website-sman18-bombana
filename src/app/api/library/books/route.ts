import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

// GET: Ambil katalog buku dengan search, filter kategori, filter stok, dan pagination
export async function GET(request: NextRequest) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim() || '';
  const categoryId = searchParams.get('category_id')?.trim() || '';
  const stockStatus = searchParams.get('stock_status')?.trim() || ''; // 'available' | 'empty' | 'all'
  const sortBy = searchParams.get('sort_by') || 'title'; // 'title' | 'book_code' | 'created_at' | 'available_stock'
  const sortOrder = searchParams.get('order') === 'desc' ? 'desc' : 'asc';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
  const skip = (page - 1) * limit;

  try {
    const whereClause: any = {};

    if (categoryId && categoryId !== 'all') {
      whereClause.category_id = categoryId;
    }

    if (stockStatus === 'available') {
      whereClause.available_stock = { gt: 0 };
    } else if (stockStatus === 'empty') {
      whereClause.available_stock = 0;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { book_code: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByClause: any = {};
    if (['title', 'book_code', 'created_at', 'available_stock'].includes(sortBy)) {
      orderByClause[sortBy] = sortOrder;
    } else {
      orderByClause.title = 'asc';
    }

    const [books, totalCount, categories] = await Promise.all([
      prisma.book.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              loans: {
                where: { status: 'Dipinjam' },
              },
            },
          },
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.book.count({ where: whereClause }),
      prisma.bookCategory.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const formattedBooks = books.map((b) => ({
      id: b.id,
      book_code: b.book_code,
      isbn: b.isbn,
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      year: b.year,
      category_id: b.category_id,
      category: b.category,
      total_stock: b.total_stock,
      available_stock: b.available_stock,
      currently_borrowed: b._count.loans,
      shelf_location: b.shelf_location,
      description: b.description,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      filter: {
        search,
        category_id: categoryId,
        stock_status: stockStatus,
      },
      categories,
      books: formattedBooks,
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/books:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar buku perpustakaan.' },
      { status: 500 }
    );
  }
}

// POST: Tambah buku baru ke katalog perpustakaan
export async function POST(request: NextRequest) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const {
      book_code,
      title,
      author,
      category_id,
      total_stock,
      isbn,
      publisher,
      year,
      shelf_location,
      description,
    } = body;

    const trimmedCode = book_code?.trim();
    const trimmedTitle = title?.trim();
    const trimmedAuthor = author?.trim();
    const parsedStock = parseInt(total_stock);

    // Validasi field wajib
    if (!trimmedCode || !trimmedTitle || !trimmedAuthor || !category_id) {
      return NextResponse.json(
        { error: 'Kode buku, judul, pengarang, dan kategori wajib diisi.' },
        { status: 400 }
      );
    }

    if (isNaN(parsedStock) || parsedStock < 1) {
      return NextResponse.json(
        { error: 'Total stok harus berupa bilangan bulat minimal 1.' },
        { status: 400 }
      );
    }

    // Cek keberadaan kategori
    const categoryExists = await prisma.bookCategory.findUnique({
      where: { id: category_id },
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Kategori buku yang dipilih tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Cek keunikan kode buku
    const codeConflict = await prisma.book.findUnique({
      where: { book_code: trimmedCode },
    });
    if (codeConflict) {
      return NextResponse.json(
        { error: `Buku dengan kode "${trimmedCode}" sudah ada di perpustakaan.` },
        { status: 409 }
      );
    }

    // Aturan bisnis: saat buku baru dibuat, available_stock ditentukan mutlak oleh server = total_stock
    const newBook = await prisma.book.create({
      data: {
        book_code: trimmedCode,
        title: trimmedTitle,
        author: trimmedAuthor,
        category_id,
        total_stock: parsedStock,
        available_stock: parsedStock, // Otomatis sama dengan total_stock
        isbn: isbn?.trim() || null,
        publisher: publisher?.trim() || null,
        year: year ? parseInt(year) || null : null,
        shelf_location: shelf_location?.trim() || null,
        description: description?.trim() || null,
      },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Buku "${newBook.title}" berhasil ditambahkan ke katalog perpustakaan.`,
        book: newBook,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/library/books:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Kode buku sudah terdaftar di sistem (harus unik).' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal menambahkan buku baru.' },
      { status: 500 }
    );
  }
}
