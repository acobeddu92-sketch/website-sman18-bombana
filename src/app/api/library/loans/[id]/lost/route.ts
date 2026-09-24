import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Menandai buku hilang pada transaksi aktif peminjaman secara aman ($transaction)
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
    const { fine_amount, notes } = body;

    let validatedFine = 0;
    if (fine_amount !== undefined) {
      validatedFine = Math.max(0, parseInt(fine_amount) || 0);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verifikasi eksistensi dan status pinjaman
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
        throw new Error('ALREADY_LOST');
      }

      if (loan.status !== 'Dipinjam') {
        throw new Error('INVALID_LOAN_STATE');
      }

      let updatedNotes = loan.notes || '';
      if (notes && notes.trim()) {
        updatedNotes = updatedNotes ? `${updatedNotes} | ${notes.trim()}` : notes.trim();
      }

      // 2. Atomic conditional update: hanya ubah jika status saat ini 'Dipinjam' dan return_date IS NULL
      const updateResult = await tx.bookLoan.updateMany({
        where: {
          id,
          return_date: null,
          status: 'Dipinjam',
        },
        data: {
          status: 'Hilang',
          fine_amount: validatedFine,
          notes: updatedNotes || null,
        },
      });

      if (updateResult.count !== 1) {
        throw new Error('INVALID_LOAN_STATE');
      }

      // Buku hilang tidak dikembalikan ke rak fisik -> available_stock TIDAK bertambah (+0)
      const updatedLoan = await tx.bookLoan.findUniqueOrThrow({
        where: { id },
        include: {
          book: {
            select: {
              id: true,
              book_code: true,
              title: true,
              author: true,
              available_stock: true,
              total_stock: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
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

      return updatedLoan;
    }, { maxWait: 10000, timeout: 20000 });

    return NextResponse.json({
      success: true,
      message: `Buku "${result.book.title}" pada transaksi ${result.loan_code} berhasil ditandai hilang.`,
      loan: result,
      fine_amount: validatedFine,
    });
  } catch (error: any) {
    console.error('Error in POST /api/library/loans/[id]/lost:', error);

    if (error.message === 'NOT_FOUND_LOAN') {
      return NextResponse.json({ error: 'Data peminjaman tidak ditemukan.' }, { status: 404 });
    }
    if (error.message === 'ALREADY_RETURNED') {
      return NextResponse.json(
        { error: 'Buku sudah dikembalikan sebelumnya. Tidak dapat ditandai hilang.' },
        { status: 400 }
      );
    }
    if (error.message === 'ALREADY_LOST') {
      return NextResponse.json(
        { error: 'Buku pada transaksi ini sudah ditandai hilang sebelumnya.' },
        { status: 400 }
      );
    }
    if (error.message === 'INVALID_LOAN_STATE') {
      return NextResponse.json(
        { error: 'Hanya transaksi dengan status aktif "Dipinjam" yang dapat ditandai hilang.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal memproses penandaan buku hilang.' },
      { status: 500 }
    );
  }
}
