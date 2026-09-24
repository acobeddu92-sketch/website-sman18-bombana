import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Transaksi pengembalian buku secara atomik ($transaction)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const auth = await verifyLibraryAccess(request);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID transaksi peminjaman wajib disertakan.' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { return_date, fine_amount, notes } = body;

    const parsedReturnDate = return_date ? new Date(return_date) : new Date();
    if (isNaN(parsedReturnDate.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal pengembalian (return_date) tidak valid.' },
        { status: 400 }
      );
    }

    // Transaksi atomik pengembalian buku dengan conditional state lock
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data peminjaman untuk verifikasi awal
      const loan = await tx.bookLoan.findUnique({
        where: { id },
        include: {
          book: true,
        },
      });

      if (!loan) {
        throw new Error('NOT_FOUND_LOAN');
      }

      if (loan.status === 'Kembali' || loan.return_date !== null) {
        throw new Error('ALREADY_RETURNED');
      }

      if (loan.status === 'Hilang') {
        throw new Error('LOAN_MARKED_LOST');
      }

      if (loan.status !== 'Dipinjam') {
        throw new Error('INVALID_LOAN_STATE');
      }

      // 2. Hitung keterlambatan dan denda
      const dueDate = new Date(loan.due_date);
      const isLate = parsedReturnDate > dueDate;
      let calculatedDaysLate = 0;
      if (isLate) {
        const diffMs = parsedReturnDate.getTime() - dueDate.getTime();
        calculatedDaysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }

      // Besaran denda: jika dikirim spesifik gunakan nilai tersebut, jika tidak gunakan Rp 1.000 / hari
      let finalFine = 0;
      if (fine_amount !== undefined) {
        finalFine = Math.max(0, parseInt(fine_amount) || 0);
      } else if (calculatedDaysLate > 0) {
        finalFine = calculatedDaysLate * 1000; // Standar Rp 1.000 / hari keterlambatan
      }

      let updatedNotes = loan.notes || '';
      if (notes && notes.trim()) {
        updatedNotes = updatedNotes ? `${updatedNotes} | ${notes.trim()}` : notes.trim();
      }

      // 3. FIX 2: Atomic conditional update pada BookLoan
      // Mencegah double return concurrent: hanya mengupdate jika return_date IS NULL dan status = 'Dipinjam'
      const updateLoanResult = await tx.bookLoan.updateMany({
        where: {
          id,
          return_date: null,
          status: 'Dipinjam',
        },
        data: {
          return_date: parsedReturnDate,
          status: 'Kembali', // Aturan final: selalu "Kembali"
          fine_amount: finalFine,
          notes: updatedNotes || null,
        },
      });

      if (updateLoanResult.count !== 1) {
        throw new Error('ALREADY_RETURNED');
      }

      // 4. Tambah available_stock buku (+1) tepat satu kali
      const updatedBook = await tx.book.update({
        where: { id: loan.book_id },
        data: {
          available_stock: {
            increment: 1,
          },
        },
        select: {
          id: true,
          book_code: true,
          title: true,
          available_stock: true,
          total_stock: true,
        },
      });

      // Validasi keamanan batas atas: available_stock tidak boleh melebihi total_stock
      if (updatedBook.available_stock > updatedBook.total_stock) {
        await tx.book.update({
          where: { id: loan.book_id },
          data: {
            available_stock: updatedBook.total_stock,
          },
        });
      }

      // 5. Ambil data peminjaman yang sudah berhasil diperbarui
      const returnedLoan = await tx.bookLoan.findUniqueOrThrow({
        where: { id },
        include: {
          book: {
            select: {
              id: true,
              book_code: true,
              title: true,
              author: true,
              shelf_location: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              class: { select: { name: true } },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          handled_by: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        loan: returnedLoan,
        book: updatedBook,
        daysLate: calculatedDaysLate,
        fineAmount: finalFine,
        isLate,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Buku "${result.loan.book.title}" berhasil dikembalikan oleh ${result.loan.borrower_name}. Stok buku kini bertambah menjadi ${result.book.available_stock}.`,
      loan: result.loan,
      return_summary: {
        return_date: result.loan.return_date,
        was_returned_late: result.isLate,
        days_overdue: result.daysLate,
        fine_amount: result.fineAmount,
        updated_available_stock: result.book.available_stock,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/library/loans/[id]/return:', error);

    if (error.message === 'NOT_FOUND_LOAN') {
      return NextResponse.json({ error: 'Data peminjaman tidak ditemukan.' }, { status: 404 });
    }
    if (error.message === 'ALREADY_RETURNED') {
      return NextResponse.json(
        { error: 'Buku untuk transaksi ini sudah dikembalikan sebelumnya.' },
        { status: 400 }
      );
    }
    if (error.message === 'LOAN_MARKED_LOST') {
      return NextResponse.json(
        { error: 'Buku pada transaksi ini sudah ditandai hilang. Tidak dapat dikembalikan secara langsung.' },
        { status: 400 }
      );
    }
    if (error.message === 'INVALID_LOAN_STATE') {
      return NextResponse.json(
        { error: 'Transaksi tidak berada dalam status aktif yang dapat dikembalikan.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal memproses pengembalian buku.' },
      { status: 500 }
    );
  }
}
