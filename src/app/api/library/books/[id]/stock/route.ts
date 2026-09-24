import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH: Penyesuaian stok buku secara khusus (tambah, kurangi, atau set langsung)
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
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Buku perpustakaan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, amount, notes } = body;

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: 'Jumlah penyesuaian stok (amount) harus berupa bilangan bulat positif.' },
        { status: 400 }
      );
    }

    const currentlyBorrowed = book.total_stock - book.available_stock;
    let newTotalStock = book.total_stock;
    let newAvailableStock = book.available_stock;

    if (action === 'add') {
      if (parsedAmount <= 0) {
        return NextResponse.json({ error: 'Jumlah penambahan harus lebih besar dari 0.' }, { status: 400 });
      }
      newTotalStock = book.total_stock + parsedAmount;
      newAvailableStock = book.available_stock + parsedAmount;
    } else if (action === 'reduce') {
      if (parsedAmount <= 0) {
        return NextResponse.json({ error: 'Jumlah pengurangan harus lebih besar dari 0.' }, { status: 400 });
      }
      if (parsedAmount > book.available_stock) {
        return NextResponse.json(
          {
            error: `Tidak dapat mengurangi ${parsedAmount} buku. Stok tersedia di rak saat ini hanya ${book.available_stock} eksemplar (${currentlyBorrowed} eksemplar sedang dipinjam).`,
          },
          { status: 400 }
        );
      }
      newTotalStock = book.total_stock - parsedAmount;
      newAvailableStock = book.available_stock - parsedAmount;
    } else if (action === 'set') {
      if (parsedAmount < currentlyBorrowed) {
        return NextResponse.json(
          {
            error: `Stok total baru (${parsedAmount}) tidak boleh lebih kecil dari jumlah buku yang sedang dipinjam (${currentlyBorrowed}).`,
          },
          { status: 400 }
        );
      }
      newTotalStock = parsedAmount;
      newAvailableStock = parsedAmount - currentlyBorrowed;
    } else {
      return NextResponse.json(
        { error: 'Aksi penyesuaian tidak valid. Gunakan "add", "reduce", atau "set".' },
        { status: 400 }
      );
    }

    // Eksekusi update
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        total_stock: newTotalStock,
        available_stock: newAvailableStock,
      },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Stok buku "${updatedBook.title}" berhasil disesuaikan. Total: ${updatedBook.total_stock}, Tersedia: ${updatedBook.available_stock}.`,
      action,
      notes: notes?.trim() || null,
      previous: {
        total_stock: book.total_stock,
        available_stock: book.available_stock,
      },
      book: {
        id: updatedBook.id,
        book_code: updatedBook.book_code,
        title: updatedBook.title,
        total_stock: updatedBook.total_stock,
        available_stock: updatedBook.available_stock,
        currently_borrowed: currentlyBorrowed,
        category: updatedBook.category,
      },
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/library/books/[id]/stock:', error);
    return NextResponse.json(
      { error: 'Gagal menyesuaikan stok buku.' },
      { status: 500 }
    );
  }
}
