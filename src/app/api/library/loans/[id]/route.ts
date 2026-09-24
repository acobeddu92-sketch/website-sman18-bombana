import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Detail transaksi peminjaman buku
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID transaksi peminjaman wajib disertakan.' }, { status: 400 });
  }

  try {
    const loan = await prisma.bookLoan.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            book_code: true,
            isbn: true,
            title: true,
            author: true,
            publisher: true,
            year: true,
            shelf_location: true,
            available_stock: true,
            total_stock: true,
            category: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            nisn: true,
            gender: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
          },
        },
        handled_by: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Data peminjaman tidak ditemukan.' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isReturned = loan.status === 'Kembali' && loan.return_date !== null;
    const wasReturnedLate =
      isReturned && new Date(loan.return_date!) > new Date(loan.due_date);
    const isOverdue =
      loan.status === 'Dipinjam' && new Date(loan.due_date) < now;

    let daysOverdue = 0;
    if (isOverdue) {
      const diffMs = now.getTime() - new Date(loan.due_date).getTime();
      daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } else if (wasReturnedLate) {
      const diffMs =
        new Date(loan.return_date!).getTime() - new Date(loan.due_date).getTime();
      daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    const displayStatus = isOverdue ? 'Terlambat' : loan.status;

    return NextResponse.json({
      success: true,
      loan: {
        ...loan,
        display_status: displayStatus,
        is_overdue: isOverdue,
        was_returned_late: wasReturnedLate,
        days_overdue: daysOverdue,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/loans/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail transaksi peminjaman.' },
      { status: 500 }
    );
  }
}

// PATCH: Perbarui catatan atau denda transaksi peminjaman (status dilarang dimutasi bebas)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID transaksi peminjaman wajib disertakan.' }, { status: 400 });
  }

  try {
    const existingLoan = await prisma.bookLoan.findUnique({
      where: { id },
    });

    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Data transaksi peminjaman tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { notes, fine_amount, status } = body;

    // FIX 3: Cegah mutasi status ilegal via PATCH
    if (status !== undefined && status !== existingLoan.status) {
      if (status === 'Kembali') {
        return NextResponse.json(
          {
            error:
              'Status transaksi tidak dapat diubah menjadi "Kembali" melalui PATCH. Silakan gunakan endpoint resmi pengembalian: POST /api/library/loans/[id]/return.',
          },
          { status: 400 }
        );
      }
      if (status === 'Hilang') {
        return NextResponse.json(
          {
            error:
              'Penandaan buku hilang tidak dapat dilakukan melalui PATCH. Silakan gunakan endpoint resmi buku hilang: POST /api/library/loans/[id]/lost.',
          },
          { status: 400 }
        );
      }
      if (status === 'Dipinjam') {
        return NextResponse.json(
          {
            error:
              'Tidak dapat mengubah status transaksi yang sudah selesai kembali menjadi "Dipinjam".',
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error:
            'Perubahan status transaksi tidak diperbolehkan melalui endpoint ini.',
        },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    if (fine_amount !== undefined) {
      const parsedFine = parseInt(fine_amount);
      if (isNaN(parsedFine) || parsedFine < 0) {
        return NextResponse.json(
          { error: 'Besaran denda harus berupa bilangan bulat non-negatif.' },
          { status: 400 }
        );
      }
      updateData.fine_amount = parsedFine;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data catatan atau denda yang diperbarui.' },
        { status: 400 }
      );
    }

    const updated = await prisma.bookLoan.update({
      where: { id },
      data: updateData,
      include: {
        book: {
          select: { id: true, title: true, book_code: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Informasi catatan/denda transaksi peminjaman berhasil diperbarui.',
      loan: updated,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/library/loans/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui transaksi peminjaman.' },
      { status: 500 }
    );
  }
}
