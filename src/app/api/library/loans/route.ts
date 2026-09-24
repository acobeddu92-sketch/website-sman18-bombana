import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Helper untuk generate loan_code unik: PJ-YYYYMMDD-XXXX
function generateLoanCode(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 karakter hex
  return `PJ-${dateStr}-${randomSuffix}`;
}

// GET: Daftar peminjaman buku dengan filter status, tipe peminjam, overdue, search, dan pagination
export async function GET(request: NextRequest) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim() || '';
  const status = searchParams.get('status')?.trim() || ''; // 'Dipinjam' | 'Kembali' | 'Hilang' | 'all'
  const memberType = searchParams.get('member_type')?.trim() || ''; // 'SISWA' | 'GURU' | 'all'
  const overdueOnly = searchParams.get('overdue_only') === 'true';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
  const skip = (page - 1) * limit;

  try {
    const now = new Date();
    const whereClause: any = {};

    if (overdueOnly) {
      whereClause.status = 'Dipinjam';
      whereClause.due_date = { lt: now };
    } else if (status && status !== 'all') {
      if (status === 'Terlambat') {
        // Filter virtual untuk pinjaman aktif yang sudah melewati jatuh tempo
        whereClause.status = 'Dipinjam';
        whereClause.due_date = { lt: now };
      } else {
        whereClause.status = status;
      }
    }

    if (memberType && memberType !== 'all') {
      whereClause.member_type = memberType.toUpperCase();
    }

    if (search) {
      whereClause.OR = [
        { loan_code: { contains: search, mode: 'insensitive' } },
        { borrower_name: { contains: search, mode: 'insensitive' } },
        { book: { title: { contains: search, mode: 'insensitive' } } },
        { book: { book_code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [loans, totalCount] = await Promise.all([
      prisma.bookLoan.findMany({
        where: whereClause,
        include: {
          book: {
            select: {
              id: true,
              book_code: true,
              title: true,
              author: true,
              shelf_location: true,
              available_stock: true,
              total_stock: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              nisn: true,
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
        orderBy: { loan_date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookLoan.count({ where: whereClause }),
    ]);

    const formattedLoans = loans.map((loan) => {
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

      return {
        id: loan.id,
        loan_code: loan.loan_code,
        book_id: loan.book_id,
        book: loan.book,
        member_type: loan.member_type,
        borrower_name: loan.borrower_name,
        student: loan.student,
        user: loan.user,
        loan_date: loan.loan_date,
        due_date: loan.due_date,
        return_date: loan.return_date,
        status: loan.status,
        display_status: displayStatus,
        is_overdue: isOverdue,
        was_returned_late: wasReturnedLate,
        days_overdue: daysOverdue,
        fine_amount: loan.fine_amount,
        notes: loan.notes,
        handled_by: loan.handled_by,
        created_at: loan.created_at,
        updated_at: loan.updated_at,
      };
    });

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
        status,
        member_type: memberType,
        overdue_only: overdueOnly,
      },
      loans: formattedLoans,
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/loans:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar transaksi peminjaman buku.' },
      { status: 500 }
    );
  }
}

// POST: Buat transaksi peminjaman buku baru secara atomik ($transaction) dengan conditional stock decrement
export async function POST(request: NextRequest) {
  const auth = await verifyLibraryAccess(request);
  if (auth.errorResponse) return auth.errorResponse;
  const session = auth.session;

  try {
    const body = await request.json();
    const {
      book_id,
      member_type,
      member_id,
      due_date,
      loan_date,
      notes,
    } = body;

    // 1. Validasi input dasar
    if (!book_id || !member_type || !member_id || !due_date) {
      return NextResponse.json(
        { error: 'Buku, tipe peminjam, ID anggota, dan tanggal jatuh tempo wajib diisi.' },
        { status: 400 }
      );
    }

    const normalizedMemberType = member_type.toUpperCase();
    if (!['SISWA', 'GURU'].includes(normalizedMemberType)) {
      return NextResponse.json(
        { error: 'Tipe peminjam harus "SISWA" atau "GURU".' },
        { status: 400 }
      );
    }

    const parsedDueDate = new Date(due_date);
    if (isNaN(parsedDueDate.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal jatuh tempo (due_date) tidak valid.' },
        { status: 400 }
      );
    }

    const parsedLoanDate = loan_date ? new Date(loan_date) : new Date();
    if (isNaN(parsedLoanDate.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal peminjaman (loan_date) tidak valid.' },
        { status: 400 }
      );
    }

    if (parsedDueDate <= parsedLoanDate) {
      return NextResponse.json(
        { error: 'Tanggal jatuh tempo harus setelah tanggal peminjaman.' },
        { status: 400 }
      );
    }

    // 2. Transaksi atomik untuk peminjaman buku
    const result = await prisma.$transaction(async (tx) => {
      // a. Verifikasi buku exists
      const book = await tx.book.findUnique({
        where: { id: book_id },
      });

      if (!book) {
        throw new Error('NOT_FOUND_BOOK');
      }

      // b. Verifikasi anggota peminjam (SISWA vs GURU)
      let studentId: string | null = null;
      let userId: string | null = null;
      let borrowerName = '';

      if (normalizedMemberType === 'SISWA') {
        const student = await tx.student.findUnique({
          where: { id: member_id },
          include: {
            class: {
              select: { name: true },
            },
          },
        });

        if (!student) {
          throw new Error('NOT_FOUND_STUDENT');
        }

        if (!student.is_active) {
          throw new Error('INACTIVE_STUDENT');
        }

        studentId = student.id;
        borrowerName = student.name;
      } else {
        // GURU: Wajib verifikasi bahwa akun aktif dan bukan role siswa
        const user = await tx.user.findFirst({
          where: {
            id: member_id,
          },
          select: {
            id: true,
            name: true,
            role: true,
            is_active: true,
          },
        });

        if (!user) {
          throw new Error('NOT_FOUND_USER');
        }

        if (user.role === 'siswa') {
          throw new Error('STUDENT_CANNOT_BE_TEACHER_BORROWER');
        }

        if (!user.is_active) {
          throw new Error('INACTIVE_USER');
        }

        userId = user.id;
        borrowerName = user.name;
      }

      // c. FIX 1: Conditional atomic stock decrement
      // Hanya mengupdate jika available_stock > 0 saat baris dikunci oleh PostgreSQL
      const updateStockResult = await tx.book.updateMany({
        where: {
          id: book_id,
          available_stock: { gt: 0 },
        },
        data: {
          available_stock: {
            decrement: 1,
          },
        },
      });

      if (updateStockResult.count !== 1) {
        throw new Error('OUT_OF_STOCK');
      }

      // Ambil data buku terbaru setelah update
      const updatedBook = await tx.book.findUniqueOrThrow({
        where: { id: book_id },
        select: {
          id: true,
          book_code: true,
          title: true,
          available_stock: true,
          total_stock: true,
        },
      });

      // d. Generate unique loan_code
      let loanCode = generateLoanCode();
      let codeExists = await tx.bookLoan.findUnique({ where: { loan_code: loanCode } });
      while (codeExists) {
        loanCode = generateLoanCode();
        codeExists = await tx.bookLoan.findUnique({ where: { loan_code: loanCode } });
      }

      // e. Buat record peminjaman BookLoan
      const newLoan = await tx.bookLoan.create({
        data: {
          loan_code: loanCode,
          book_id: book.id,
          member_type: normalizedMemberType,
          student_id: studentId,
          user_id: userId,
          borrower_name: borrowerName,
          loan_date: parsedLoanDate,
          due_date: parsedDueDate,
          status: 'Dipinjam',
          fine_amount: 0,
          notes: notes?.trim() || null,
          handled_by_id: session.id,
        },
        include: {
          book: {
            select: {
              id: true,
              book_code: true,
              title: true,
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
        loan: newLoan,
        remainingStock: updatedBook.available_stock,
      };
    }, { maxWait: 10000, timeout: 20000 });

    return NextResponse.json(
      {
        success: true,
        message: `Peminjaman buku "${result.loan.book.title}" berhasil dicatat untuk ${result.loan.borrower_name}.`,
        loan: result.loan,
        remaining_stock: result.remainingStock,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/library/loans:', error);

    if (error.message === 'NOT_FOUND_BOOK') {
      return NextResponse.json({ error: 'Buku yang dipilih tidak ditemukan di katalog.' }, { status: 404 });
    }
    if (error.message === 'OUT_OF_STOCK') {
      return NextResponse.json(
        { error: 'Stok buku ini sedang habis (tersedia: 0). Tidak dapat meminjam saat ini.' },
        { status: 400 }
      );
    }
    if (error.message === 'NOT_FOUND_STUDENT') {
      return NextResponse.json({ error: 'Data siswa peminjam tidak ditemukan di master data.' }, { status: 404 });
    }
    if (error.message === 'INACTIVE_STUDENT') {
      return NextResponse.json(
        { error: 'Status siswa tidak aktif. Peminjaman hanya diperbolehkan untuk siswa aktif.' },
        { status: 400 }
      );
    }
    if (error.message === 'NOT_FOUND_USER') {
      return NextResponse.json({ error: 'Data guru/staf peminjam tidak ditemukan di sistem.' }, { status: 404 });
    }
    if (error.message === 'STUDENT_CANNOT_BE_TEACHER_BORROWER') {
      return NextResponse.json(
        { error: 'Akun siswa tidak dapat dicatat sebagai peminjam bertipe GURU.' },
        { status: 400 }
      );
    }
    if (error.message === 'INACTIVE_USER') {
      return NextResponse.json(
        { error: 'Akun guru/staf tidak aktif.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal memproses transaksi peminjaman buku.' },
      { status: 500 }
    );
  }
}
