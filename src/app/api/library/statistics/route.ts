import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

// GET: Statistik mendalam aktivitas perpustakaan untuk laporan dan visualisasi
export async function GET(request: NextRequest) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const now = new Date();
    // 6 bulan terakhir
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      categoryDistribution,
      loansStatusBreakdown,
      memberTypeDistribution,
      popularBooks,
      recentMonthsLoans,
    ] = await Promise.all([
      // 1. Distribusi buku per kategori
      prisma.bookCategory.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: { books: true },
          },
        },
        orderBy: { books: { _count: 'desc' } },
      }),

      // 2. Breakdown status peminjaman
      prisma.bookLoan.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // 3. Distribusi peminjam (Siswa vs Guru)
      prisma.bookLoan.groupBy({
        by: ['member_type'],
        _count: { _all: true },
      }),

      // 4. 10 Buku paling sering dipinjam
      prisma.book.findMany({
        take: 10,
        orderBy: {
          loans: { _count: 'desc' },
        },
        select: {
          id: true,
          book_code: true,
          title: true,
          author: true,
          category: {
            select: { name: true },
          },
          _count: {
            select: { loans: true },
          },
        },
      }),

      // 5. Data peminjaman 6 bulan terakhir untuk grafik tren
      prisma.bookLoan.findMany({
        where: {
          loan_date: { gte: sixMonthsAgo },
        },
        select: {
          loan_date: true,
          status: true,
        },
      }),
    ]);

    // Format tren bulanan
    const monthsMap: { [key: string]: { month: string; total_loans: number; returned: number } } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      monthsMap[key] = { month: monthLabel, total_loans: 0, returned: 0 };
    }

    recentMonthsLoans.forEach((loan) => {
      const d = new Date(loan.loan_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap[key]) {
        monthsMap[key].total_loans += 1;
        if (loan.status === 'Kembali' || loan.status === 'Terlambat') {
          monthsMap[key].returned += 1;
        }
      }
    });

    const monthlyTrends = Object.values(monthsMap);

    return NextResponse.json({
      success: true,
      category_distribution: categoryDistribution.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        book_count: c._count.books,
      })),
      status_breakdown: loansStatusBreakdown.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      member_type_breakdown: memberTypeDistribution.map((m) => ({
        member_type: m.member_type,
        count: m._count._all,
      })),
      popular_books: popularBooks.map((b) => ({
        id: b.id,
        book_code: b.book_code,
        title: b.title,
        author: b.author,
        category_name: b.category?.name || 'Umum',
        loan_count: b._count.loans,
      })),
      monthly_trends: monthlyTrends,
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/statistics:', error);
    return NextResponse.json(
      { error: 'Gagal memuat statistik aktivitas perpustakaan.' },
      { status: 500 }
    );
  }
}
