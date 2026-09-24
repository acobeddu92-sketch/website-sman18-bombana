import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

// GET: Ringkasan statistik dan data ikhtisar untuk Dashboard Kepala Perpustakaan
export async function GET(request: NextRequest) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      booksAggregate,
      totalTitles,
      totalCategories,
      activeLoansCount,
      overdueLoansCount,
      returnedTodayCount,
      finesAggregate,
      totalActiveStudents,
      totalActiveTeachers,
      recentLoans,
      urgentOverdueLoans,
      lowStockBooks,
    ] = await Promise.all([
      // 1. Agregasi total & stok tersedia buku
      prisma.book.aggregate({
        _sum: {
          total_stock: true,
          available_stock: true,
        },
      }),

      // 2. Total judul buku
      prisma.book.count(),

      // 3. Total kategori buku
      prisma.bookCategory.count(),

      // 4. Peminjaman aktif
      prisma.bookLoan.count({
        where: { status: 'Dipinjam' },
      }),

      // 5. Peminjaman terlambat (overdue)
      prisma.bookLoan.count({
        where: {
          status: 'Dipinjam',
          due_date: { lt: now },
        },
      }),

      // 6. Buku dikembalikan hari ini
      prisma.bookLoan.count({
        where: {
          return_date: { gte: startOfToday },
        },
      }),

      // 7. Total denda tercatat
      prisma.bookLoan.aggregate({
        _sum: {
          fine_amount: true,
        },
      }),

      // 8. Total siswa aktif (master data siswa)
      prisma.student.count({
        where: { is_active: true },
      }),

      // 9. Total guru/staf aktif (master data user)
      prisma.user.count({
        where: { is_active: true },
      }),

      // 10. 5 Transaksi peminjaman terbaru
      prisma.bookLoan.findMany({
        take: 5,
        orderBy: { loan_date: 'desc' },
        include: {
          book: {
            select: { title: true, book_code: true },
          },
        },
      }),

      // 11. 5 Transaksi overdue paling mendesak
      prisma.bookLoan.findMany({
        where: {
          status: 'Dipinjam',
          due_date: { lt: now },
        },
        take: 5,
        orderBy: { due_date: 'asc' },
        include: {
          book: {
            select: { title: true, book_code: true },
          },
          student: {
            select: {
              class: { select: { name: true } },
            },
          },
        },
      }),

      // 12. 5 Buku dengan stok habis atau menipis
      prisma.book.findMany({
        where: {
          available_stock: { lte: 1 },
        },
        take: 5,
        orderBy: { available_stock: 'asc' },
        select: {
          id: true,
          book_code: true,
          title: true,
          total_stock: true,
          available_stock: true,
          shelf_location: true,
        },
      }),
    ]);

    const totalStock = booksAggregate._sum.total_stock || 0;
    const availableStock = booksAggregate._sum.available_stock || 0;
    const borrowedStock = Math.max(0, totalStock - availableStock);
    const totalFines = finesAggregate._sum.fine_amount || 0;

    return NextResponse.json({
      success: true,
      stats: {
        total_titles: totalTitles,
        total_stock: totalStock,
        available_stock: availableStock,
        borrowed_stock: borrowedStock,
        total_categories: totalCategories,
        active_loans: activeLoansCount,
        overdue_loans: overdueLoansCount,
        returned_today: returnedTodayCount,
        total_fines: totalFines,
        members: {
          active_students: totalActiveStudents,
          active_staff: totalActiveTeachers,
          total_members: totalActiveStudents + totalActiveTeachers,
        },
      },
      recent_loans: recentLoans.map((l) => ({
        id: l.id,
        loan_code: l.loan_code,
        book_title: l.book.title,
        book_code: l.book.book_code,
        borrower_name: l.borrower_name,
        member_type: l.member_type,
        loan_date: l.loan_date,
        due_date: l.due_date,
        status: l.status,
      })),
      urgent_overdue_loans: urgentOverdueLoans.map((l) => {
        const diffMs = now.getTime() - new Date(l.due_date).getTime();
        const daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return {
          id: l.id,
          loan_code: l.loan_code,
          book_title: l.book.title,
          borrower_name: l.borrower_name,
          member_type: l.member_type,
          class_name: l.student?.class?.name || null,
          due_date: l.due_date,
          days_late: daysLate,
        };
      }),
      low_stock_books: lowStockBooks,
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/dashboard:', error);
    return NextResponse.json(
      { error: 'Gagal memuat ringkasan dashboard perpustakaan.' },
      { status: 500 }
    );
  }
}
