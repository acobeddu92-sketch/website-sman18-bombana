import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyEbookManagementAccess, verifyEbookReadAccess } from '@/lib/library-auth';
import { saveUploadedFile, deleteUploadedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const ALLOWED_EBOOK_MIMES = ['application/pdf', 'application/epub+zip'];
const ALLOWED_EBOOK_EXTS = ['.pdf', '.epub'];
const MAX_EBOOK_SIZE_MB = 25;

// GET: Ambil daftar e-book (Terkontrol RBAC)
export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyEbookReadAccess(request);
  if (errorResponse || !session) return errorResponse;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const categoryId = searchParams.get('category_id')?.trim() || '';
  const isPublishedParam = searchParams.get('is_published');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
  const sort = searchParams.get('sort') || 'created_at_desc';

  try {
    const whereClause: any = {};

    // 1. RBAC Enforced: Siswa HANYA dapat melihat yang is_published = true
    if (session.role === 'siswa') {
      whereClause.is_published = true;
    } else {
      // Administrator & Kepala Perpustakaan dapat memfilter is_published
      if (isPublishedParam === 'true') {
        whereClause.is_published = true;
      } else if (isPublishedParam === 'false') {
        whereClause.is_published = false;
      }
    }

    // 2. Filter Kategori
    if (categoryId) {
      whereClause.category_id = categoryId;
    }

    // 3. Pencarian Kata Kunci
    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
        { publisher: { contains: q, mode: 'insensitive' } },
        { isbn: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 4. Pengurutan
    let orderBy: any = { created_at: 'desc' };
    if (sort === 'title_asc') orderBy = { title: 'asc' };
    else if (sort === 'title_desc') orderBy = { title: 'desc' };
    else if (sort === 'year_desc') orderBy = [{ year: 'desc' }, { created_at: 'desc' }];
    else if (sort === 'year_asc') orderBy = [{ year: 'asc' }, { created_at: 'desc' }];
    else if (sort === 'downloads_desc') orderBy = { download_count: 'desc' };

    const [total, ebooks] = await Promise.all([
      prisma.eBook.count({ where: whereClause }),
      prisma.eBook.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, code: true },
          },
          uploaded_by: {
            select: { id: true, name: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Response diformat aman: jangan ekspos file_url mentah sebagai jalur akses siswa
    const isManager = session.role === 'administrator' || session.role === 'kepala_perpustakaan';

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ebooks: ebooks.map((eb) => ({
        id: eb.id,
        title: eb.title,
        author: eb.author,
        publisher: eb.publisher,
        year: eb.year,
        isbn: eb.isbn,
        description: eb.description,
        category: eb.category,
        file_name: eb.file_name,
        file_size: eb.file_size,
        mime_type: eb.mime_type,
        cover_image: eb.cover_image,
        is_published: eb.is_published,
        download_count: eb.download_count,
        read_url: `/api/library/ebooks/${eb.id}/read`,
        ...(isManager
          ? {
              uploaded_by: eb.uploaded_by,
              created_at: eb.created_at,
              updated_at: eb.updated_at,
            }
          : {}),
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/ebooks:', error);
    return NextResponse.json(
      { error: 'Gagal memuat katalog buku elektronik.' },
      { status: 500 }
    );
  }
}

// POST: Buat koleksi e-book baru (Khusus Administrator & Kepala Perpustakaan)
export async function POST(request: NextRequest) {
  const { session, errorResponse } = await verifyEbookManagementAccess(request);
  if (errorResponse || !session) return errorResponse;

  let uploadedFileUrl: string | undefined;
  let uploadedCoverUrl: string | undefined;

  try {
    const formData = await request.formData();

    const title = (formData.get('title') as string)?.trim();
    const author = (formData.get('author') as string)?.trim();
    const categoryId = (formData.get('category_id') as string)?.trim();
    const publisher = (formData.get('publisher') as string)?.trim() || null;
    const yearRaw = formData.get('year') as string | null;
    const isbn = (formData.get('isbn') as string)?.trim() || null;
    const description = (formData.get('description') as string)?.trim() || null;

    const file = formData.get('file') as File | null;
    const cover = formData.get('cover') as File | null;

    // 1. Validasi Metadata Wajib
    if (!title || !author || !categoryId) {
      return NextResponse.json(
        { error: 'Judul, penulis, dan kategori e-book wajib diisi.' },
        { status: 400 }
      );
    }

    let year: number | null = null;
    if (yearRaw) {
      const parsedYear = parseInt(yearRaw, 10);
      if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
        return NextResponse.json(
          { error: 'Tahun terbit harus berupa tahun yang valid (1900 - 2100).' },
          { status: 400 }
        );
      }
      year = parsedYear;
    }

    // 2. Validasi Kategori Exist
    const categoryExists = await prisma.eBookCategory.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Kategori e-book yang dipilih tidak ditemukan.' },
        { status: 400 }
      );
    }

    // 3. Validasi Dokumen E-Book
    if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
      return NextResponse.json(
        { error: 'Berkas dokumen e-book (PDF atau EPUB) wajib diunggah.' },
        { status: 400 }
      );
    }

    const fileExt = path.extname(file.name).toLowerCase();
    const fileMime = file.type?.toLowerCase();

    if (!ALLOWED_EBOOK_EXTS.includes(fileExt) || !ALLOWED_EBOOK_MIMES.includes(fileMime)) {
      return NextResponse.json(
        { error: 'Format berkas e-book tidak valid. Hanya berkas PDF (.pdf) dan EPUB (.epub) yang diperbolehkan.' },
        { status: 400 }
      );
    }

    const maxFileBytes = MAX_EBOOK_SIZE_MB * 1024 * 1024;
    if (file.size > maxFileBytes) {
      return NextResponse.json(
        { error: `Ukuran berkas e-book melebihi batas maksimal (${MAX_EBOOK_SIZE_MB} MB).` },
        { status: 400 }
      );
    }

    // 4. Validasi Cover Image (Opsional)
    if (cover && cover.size > 0) {
      const coverExt = path.extname(cover.name).toLowerCase();
      const coverMime = cover.type?.toLowerCase();
      const allowedCoverMimes = ['image/jpeg', 'image/png', 'image/webp'];
      const allowedCoverExts = ['.jpg', '.jpeg', '.png', '.webp'];

      if (!allowedCoverMimes.includes(coverMime) || !allowedCoverExts.includes(coverExt)) {
        return NextResponse.json(
          { error: 'Format sampul buku tidak valid. Gunakan format JPG, PNG, atau WEBP.' },
          { status: 400 }
        );
      }

      if (cover.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Ukuran sampul buku melebihi batas maksimal 5 MB.' },
          { status: 400 }
        );
      }
    }

    // 5. Upload Dokumen E-Book
    const fileUploadResult = await saveUploadedFile(file, 'library/ebooks', {
      allowedMimeTypes: ALLOWED_EBOOK_MIMES,
      maxSizeMB: MAX_EBOOK_SIZE_MB,
    });

    if (!fileUploadResult.success || !fileUploadResult.url) {
      return NextResponse.json(
        { error: fileUploadResult.error || 'Gagal menyimpan berkas dokumen e-book.' },
        { status: 500 }
      );
    }
    uploadedFileUrl = fileUploadResult.url;

    // 6. Upload Cover Image (Jika Ada)
    if (cover && cover.size > 0) {
      const coverUploadResult = await saveUploadedFile(cover, 'library/covers', {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeMB: 5,
      });

      if (coverUploadResult.success && coverUploadResult.url) {
        uploadedCoverUrl = coverUploadResult.url;
      }
    }

    // 7. Simpan Record ke Database (uploaded_by_id otomatis dari session, is_published default false)
    try {
      const createdEBook = await prisma.eBook.create({
        data: {
          title,
          author,
          publisher,
          year,
          isbn,
          description,
          category_id: categoryId,
          file_url: uploadedFileUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: fileMime,
          cover_image: uploadedCoverUrl || null,
          download_count: 0,
          is_published: false, // Wajib default false
          uploaded_by_id: session.id, // Selalu dari sesi otentikasi
        },
        include: {
          category: {
            select: { id: true, name: true, code: true },
          },
          uploaded_by: {
            select: { id: true, name: true },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Buku elektronik berhasil ditambahkan dalam status draf (belum dipublikasikan).',
          ebook: {
            id: createdEBook.id,
            title: createdEBook.title,
            author: createdEBook.author,
            publisher: createdEBook.publisher,
            year: createdEBook.year,
            isbn: createdEBook.isbn,
            description: createdEBook.description,
            category: createdEBook.category,
            file_name: createdEBook.file_name,
            file_size: createdEBook.file_size,
            mime_type: createdEBook.mime_type,
            cover_image: createdEBook.cover_image,
            is_published: createdEBook.is_published,
            download_count: createdEBook.download_count,
            read_url: `/api/library/ebooks/${createdEBook.id}/read`,
            uploaded_by: createdEBook.uploaded_by,
            created_at: createdEBook.created_at,
            updated_at: createdEBook.updated_at,
          },
        },
        { status: 201 }
      );
    } catch (dbError) {
      // 8. Rollback Berkas jika DB Create Gagal (Mencegah Orphan Files)
      if (uploadedFileUrl) {
        await deleteUploadedFile(uploadedFileUrl);
      }
      if (uploadedCoverUrl) {
        await deleteUploadedFile(uploadedCoverUrl);
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error in POST /api/library/ebooks:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan buku elektronik.' },
      { status: 500 }
    );
  }
}
