import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Detail buku beserta kategori dan riwayat peminjaman terkini
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID buku wajib disertakan.' }, { status: 400 });
  }

  try {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        loans: {
          take: 10,
          orderBy: { loan_date: 'desc' },
          select: {
            id: true,
            loan_code: true,
            member_type: true,
            borrower_name: true,
            loan_date: true,
            due_date: true,
            return_date: true,
            status: true,
            fine_amount: true,
            notes: true,
            handled_by: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            loans: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Buku perpustakaan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const activeLoansCount = await prisma.bookLoan.count({
      where: {
        book_id: id,
        status: 'Dipinjam',
      },
    });

    const currentlyBorrowed = book.total_stock - book.available_stock;

    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        book_code: book.book_code,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        year: book.year,
        category_id: book.category_id,
        category: book.category,
        total_stock: book.total_stock,
        available_stock: book.available_stock,
        currently_borrowed: currentlyBorrowed,
        active_loans_count: activeLoansCount,
        total_loans_count: book._count.loans,
        shelf_location: book.shelf_location,
        description: book.description,
        created_at: book.created_at,
        updated_at: book.updated_at,
        recent_loans: book.loans,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/books/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail buku.' },
      { status: 500 }
    );
  }
}

// PATCH: Perbarui informasi buku dan/atau total stok dengan proteksi integritas
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID buku wajib disertakan.' }, { status: 400 });
  }

  try {
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Buku perpustakaan tidak ditemukan.' },
        { status: 404 }
      );
    }

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

    const updateData: any = {};

    // 1. Validasi jika book_code diubah
    if (book_code !== undefined) {
      const trimmedCode = book_code?.trim();
      if (!trimmedCode) {
        return NextResponse.json({ error: 'Kode buku tidak boleh kosong.' }, { status: 400 });
      }
      if (trimmedCode !== existingBook.book_code) {
        const conflict = await prisma.book.findUnique({
          where: { book_code: trimmedCode },
        });
        if (conflict) {
          return NextResponse.json(
            { error: `Buku dengan kode "${trimmedCode}" sudah ada di perpustakaan.` },
            { status: 409 }
          );
        }
        updateData.book_code = trimmedCode;
      }
    }

    // 2. Validasi field metadata
    if (title !== undefined) {
      const trimmed = title?.trim();
      if (!trimmed) return NextResponse.json({ error: 'Judul buku tidak boleh kosong.' }, { status: 400 });
      updateData.title = trimmed;
    }

    if (author !== undefined) {
      const trimmed = author?.trim();
      if (!trimmed) return NextResponse.json({ error: 'Nama pengarang tidak boleh kosong.' }, { status: 400 });
      updateData.author = trimmed;
    }

    if (category_id !== undefined) {
      if (!category_id) {
        return NextResponse.json({ error: 'Kategori buku wajib dipilih.' }, { status: 400 });
      }
      const categoryExists = await prisma.bookCategory.findUnique({
        where: { id: category_id },
      });
      if (!categoryExists) {
        return NextResponse.json({ error: 'Kategori buku yang dipilih tidak ditemukan.' }, { status: 404 });
      }
      updateData.category_id = category_id;
    }

    if (isbn !== undefined) updateData.isbn = isbn?.trim() || null;
    if (publisher !== undefined) updateData.publisher = publisher?.trim() || null;
    if (year !== undefined) updateData.year = year ? parseInt(year) || null : null;
    if (shelf_location !== undefined) updateData.shelf_location = shelf_location?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;

    // 3. Logika aman perubahan total_stock
    if (total_stock !== undefined) {
      const parsedTotalStock = parseInt(total_stock);
      if (isNaN(parsedTotalStock) || parsedTotalStock < 0) {
        return NextResponse.json(
          { error: 'Total stok harus berupa bilangan bulat non-negatif.' },
          { status: 400 }
        );
      }

      // Hitung buku yang sedang dipinjam saat ini
      const currentlyBorrowed = existingBook.total_stock - existingBook.available_stock;

      if (parsedTotalStock < currentlyBorrowed) {
        return NextResponse.json(
          {
            error: `Total stok baru (${parsedTotalStock}) tidak boleh lebih kecil dari jumlah buku yang sedang dipinjam (${currentlyBorrowed}).`,
          },
          { status: 400 }
        );
      }

      // Hitung stok tersedia yang baru
      const newAvailableStock = parsedTotalStock - currentlyBorrowed;
      updateData.total_stock = parsedTotalStock;
      updateData.available_stock = newAvailableStock;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diperbarui.' }, { status: 400 });
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Informasi buku "${updatedBook.title}" berhasil diperbarui.`,
      book: updatedBook,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/library/books/[id]:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Kode buku sudah digunakan oleh buku lain.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal memperbarui buku perpustakaan.' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus buku jika belum pernah memiliki transaksi peminjaman
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID buku wajib disertakan.' }, { status: 400 });
  }

  try {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        _count: {
          select: { loans: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Buku perpustakaan tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (book._count.loans > 0) {
      return NextResponse.json(
        {
          error: `Buku "${book.title}" tidak dapat dihapus karena memiliki riwayat peminjaman (${book._count.loans} transaksi). Anda dapat mengubah stok menjadi 0 jika buku sudah tidak aktif.`,
        },
        { status: 400 }
      );
    }

    await prisma.book.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Buku "${book.title}" (${book.book_code}) berhasil dihapus dari perpustakaan.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/library/books/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus buku perpustakaan.' },
      { status: 500 }
    );
  }
}
