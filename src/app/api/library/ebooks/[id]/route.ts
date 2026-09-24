import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import { verifyEbookManagementAccess, verifyEbookReadAccess } from '@/lib/library-auth';
import { saveUploadedFile, deleteUploadedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

const ALLOWED_EBOOK_MIMES = ['application/pdf', 'application/epub+zip'];
const ALLOWED_EBOOK_EXTS = ['.pdf', '.epub'];
const MAX_EBOOK_SIZE_MB = 25;

// GET: Ambil detail e-book
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { session, errorResponse } = await verifyEbookReadAccess(request);
  if (errorResponse || !session) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID e-book wajib disertakan.' }, { status: 400 });
  }

  try {
    const ebook = await prisma.eBook.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, code: true, description: true },
        },
        uploaded_by: {
          select: { id: true, name: true },
        },
      },
    });

    if (!ebook) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak ditemukan.' },
        { status: 404 }
      );
    }

    // RBAC Enforced: Siswa HANYA dapat mengakses e-book yang berstatus is_published = true
    if (session.role === 'siswa' && !ebook.is_published) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak ditemukan.' },
        { status: 404 }
      );
    }

    const isManager = session.role === 'administrator' || session.role === 'kepala_perpustakaan';

    return NextResponse.json({
      success: true,
      ebook: {
        id: ebook.id,
        title: ebook.title,
        author: ebook.author,
        publisher: ebook.publisher,
        year: ebook.year,
        isbn: ebook.isbn,
        description: ebook.description,
        category: ebook.category,
        file_name: ebook.file_name,
        file_size: ebook.file_size,
        mime_type: ebook.mime_type,
        cover_image: ebook.cover_image,
        is_published: ebook.is_published,
        download_count: ebook.download_count,
        read_url: `/api/library/ebooks/${ebook.id}/read`,
        ...(isManager
          ? {
              file_url: ebook.file_url,
              uploaded_by: ebook.uploaded_by,
              created_at: ebook.created_at,
              updated_at: ebook.updated_at,
            }
          : {}),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/ebooks/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail buku elektronik.' },
      { status: 500 }
    );
  }
}

// PATCH: Perbarui metadata / ganti file e-book (Khusus Administrator & Kepala Perpustakaan)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyEbookManagementAccess(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID e-book wajib disertakan.' }, { status: 400 });
  }

  try {
    const existing = await prisma.eBook.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak ditemukan.' },
        { status: 404 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const updateData: any = {};

    let newFileUploadUrl: string | undefined;
    let newCoverUploadUrl: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const title = formData.get('title') as string | null;
      const author = formData.get('author') as string | null;
      const categoryId = formData.get('category_id') as string | null;
      const publisher = formData.get('publisher') as string | null;
      const yearRaw = formData.get('year') as string | null;
      const isbn = formData.get('isbn') as string | null;
      const description = formData.get('description') as string | null;

      const newFile = formData.get('file') as File | null;
      const newCover = formData.get('cover') as File | null;

      if (title !== null) {
        const trimmed = title.trim();
        if (!trimmed) {
          return NextResponse.json({ error: 'Judul tidak boleh kosong.' }, { status: 400 });
        }
        updateData.title = trimmed;
      }

      if (author !== null) {
        const trimmed = author.trim();
        if (!trimmed) {
          return NextResponse.json({ error: 'Penulis tidak boleh kosong.' }, { status: 400 });
        }
        updateData.author = trimmed;
      }

      if (categoryId !== null) {
        const trimmed = categoryId.trim();
        const cat = await prisma.eBookCategory.findUnique({ where: { id: trimmed } });
        if (!cat) {
          return NextResponse.json({ error: 'Kategori e-book tidak valid.' }, { status: 400 });
        }
        updateData.category_id = trimmed;
      }

      if (publisher !== null) updateData.publisher = publisher.trim() || null;
      if (isbn !== null) updateData.isbn = isbn.trim() || null;
      if (description !== null) updateData.description = description.trim() || null;

      if (yearRaw !== null) {
        if (yearRaw.trim() === '') {
          updateData.year = null;
        } else {
          const parsed = parseInt(yearRaw, 10);
          if (isNaN(parsed) || parsed < 1900 || parsed > 2100) {
            return NextResponse.json({ error: 'Tahun terbit tidak valid.' }, { status: 400 });
          }
          updateData.year = parsed;
        }
      }

      // Penggantian Berkas Dokumen (Jika Ada)
      if (newFile && typeof newFile.arrayBuffer === 'function' && newFile.size > 0) {
        const ext = path.extname(newFile.name).toLowerCase();
        const mime = newFile.type?.toLowerCase();

        if (!ALLOWED_EBOOK_EXTS.includes(ext) || !ALLOWED_EBOOK_MIMES.includes(mime)) {
          return NextResponse.json(
            { error: 'Format berkas baru tidak valid. Gunakan PDF (.pdf) atau EPUB (.epub).' },
            { status: 400 }
          );
        }

        if (newFile.size > MAX_EBOOK_SIZE_MB * 1024 * 1024) {
          return NextResponse.json(
            { error: `Ukuran berkas baru melebihi batas maksimal (${MAX_EBOOK_SIZE_MB} MB).` },
            { status: 400 }
          );
        }

        const uploadRes = await saveUploadedFile(newFile, 'library/ebooks', {
          allowedMimeTypes: ALLOWED_EBOOK_MIMES,
          maxSizeMB: MAX_EBOOK_SIZE_MB,
        });

        if (!uploadRes.success || !uploadRes.url) {
          return NextResponse.json({ error: 'Gagal mengunggah berkas pengganti.' }, { status: 500 });
        }

        newFileUploadUrl = uploadRes.url;
        updateData.file_url = uploadRes.url;
        updateData.file_name = newFile.name;
        updateData.file_size = newFile.size;
        updateData.mime_type = mime;
      }

      // Penggantian Sampul (Jika Ada)
      if (newCover && typeof newCover.arrayBuffer === 'function' && newCover.size > 0) {
        const coverExt = path.extname(newCover.name).toLowerCase();
        const coverMime = newCover.type?.toLowerCase();
        const allowedCoverMimes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedCoverMimes.includes(coverMime) || !['.jpg', '.jpeg', '.png', '.webp'].includes(coverExt)) {
          return NextResponse.json({ error: 'Format sampul tidak valid (JPG, PNG, WEBP).' }, { status: 400 });
        }

        if (newCover.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'Ukuran sampul melebihi 5 MB.' }, { status: 400 });
        }

        const coverUploadRes = await saveUploadedFile(newCover, 'library/covers', {
          allowedMimeTypes: allowedCoverMimes,
          maxSizeMB: 5,
        });

        if (coverUploadRes.success && coverUploadRes.url) {
          newCoverUploadUrl = coverUploadRes.url;
          updateData.cover_image = coverUploadRes.url;
        }
      }
    } else {
      // JSON body
      const body = await request.json();
      const { title, author, category_id, publisher, year, isbn, description } = body;

      if (title !== undefined) {
        const trimmed = title?.trim();
        if (!trimmed) {
          return NextResponse.json({ error: 'Judul tidak boleh kosong.' }, { status: 400 });
        }
        updateData.title = trimmed;
      }

      if (author !== undefined) {
        const trimmed = author?.trim();
        if (!trimmed) {
          return NextResponse.json({ error: 'Penulis tidak boleh kosong.' }, { status: 400 });
        }
        updateData.author = trimmed;
      }

      if (category_id !== undefined) {
        const trimmed = category_id?.trim();
        const cat = await prisma.eBookCategory.findUnique({ where: { id: trimmed } });
        if (!cat) {
          return NextResponse.json({ error: 'Kategori e-book tidak valid.' }, { status: 400 });
        }
        updateData.category_id = trimmed;
      }

      if (publisher !== undefined) updateData.publisher = publisher?.trim() || null;
      if (isbn !== undefined) updateData.isbn = isbn?.trim() || null;
      if (description !== undefined) updateData.description = description?.trim() || null;

      if (year !== undefined) {
        if (year === null || year === '') {
          updateData.year = null;
        } else {
          const parsed = parseInt(year, 10);
          if (isNaN(parsed) || parsed < 1900 || parsed > 2100) {
            return NextResponse.json({ error: 'Tahun terbit tidak valid.' }, { status: 400 });
          }
          updateData.year = parsed;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan data.' }, { status: 400 });
    }

    try {
      const updated = await prisma.eBook.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: { id: true, name: true, code: true },
          },
          uploaded_by: {
            select: { id: true, name: true },
          },
        },
      });

      // Jika update DB berhasil dan ada berkas baru, hapus berkas lama dari storage
      if (newFileUploadUrl && existing.file_url) {
        const oldFileDeleted = await deleteUploadedFile(existing.file_url);
        if (!oldFileDeleted) {
          console.warn(
            `[EBook Update] Berkas baru aktif, namun berkas lama gagal dibersihkan dari storage: ${existing.file_url}`
          );
        }
      }
      if (newCoverUploadUrl && existing.cover_image) {
        const oldCoverDeleted = await deleteUploadedFile(existing.cover_image);
        if (!oldCoverDeleted) {
          console.warn(
            `[EBook Update] Sampul baru aktif, namun sampul lama gagal dibersihkan dari storage: ${existing.cover_image}`
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Buku elektronik berhasil diperbarui.',
        ebook: {
          id: updated.id,
          title: updated.title,
          author: updated.author,
          publisher: updated.publisher,
          year: updated.year,
          isbn: updated.isbn,
          description: updated.description,
          category: updated.category,
          file_name: updated.file_name,
          file_size: updated.file_size,
          mime_type: updated.mime_type,
          cover_image: updated.cover_image,
          is_published: updated.is_published,
          download_count: updated.download_count,
          read_url: `/api/library/ebooks/${updated.id}/read`,
          uploaded_by: updated.uploaded_by,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        },
      });
    } catch (dbError) {
      // Jika DB update gagal, hapus berkas baru yang baru saja diunggah agar berkas lama tidak hilang
      if (newFileUploadUrl) {
        await deleteUploadedFile(newFileUploadUrl);
      }
      if (newCoverUploadUrl) {
        await deleteUploadedFile(newCoverUploadUrl);
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error in PATCH /api/library/ebooks/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui buku elektronik.' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus buku elektronik dan bersihkan berkas di penyimpanan
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyEbookManagementAccess(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID e-book wajib disertakan.' }, { status: 400 });
  }

  try {
    const existing = await prisma.eBook.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 1. Buat buffer backup file dokumen & sampul di memori sebelum dihapus dari storage
    // Ini digunakan sebagai compensating action jika terjadi kegagalan transaksi database
    let fileBackupBuffer: Buffer | null = null;
    let coverBackupBuffer: Buffer | null = null;
    let localFilePath: string | null = null;
    let localCoverPath: string | null = null;

    if (existing.file_url) {
      if (existing.file_url.startsWith('/uploads/')) {
        const relativePath = existing.file_url.replace(/^\/uploads\//, '');
        const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
        localFilePath = path.join(process.cwd(), 'public', 'uploads', safePath);
        if (fs.existsSync(localFilePath)) {
          try {
            fileBackupBuffer = fs.readFileSync(localFilePath);
          } catch (readErr) {
            console.warn('[EBook Delete] Gagal membaca buffer file lokal:', readErr);
          }
        }
      } else if (existing.file_url.startsWith('http://') || existing.file_url.startsWith('https://')) {
        try {
          const res = await fetch(existing.file_url);
          if (res.ok) {
            fileBackupBuffer = Buffer.from(await res.arrayBuffer());
          }
        } catch (fetchErr) {
          console.warn('[EBook Delete] Gagal membaca buffer file remote:', fetchErr);
        }
      }
    }

    if (existing.cover_image && existing.cover_image.startsWith('/uploads/')) {
      const relativeCoverPath = existing.cover_image.replace(/^\/uploads\//, '');
      const safeCoverPath = path.normalize(relativeCoverPath).replace(/^(\.\.[\/\\])+/, '');
      localCoverPath = path.join(process.cwd(), 'public', 'uploads', safeCoverPath);
      if (fs.existsSync(localCoverPath)) {
        try {
          coverBackupBuffer = fs.readFileSync(localCoverPath);
        } catch (readCoverErr) {
          console.warn('[EBook Delete] Gagal membaca buffer sampul lokal:', readCoverErr);
        }
      }
    }

    // 2. Bersihkan berkas fisik dokumen di media penyimpanan terlebih dahulu (Option C)
    if (existing.file_url) {
      const fileDeleted = await deleteUploadedFile(existing.file_url);
      if (!fileDeleted) {
        console.error(`[EBook Delete] Gagal menghapus file storage: ${existing.file_url}`);
        return NextResponse.json(
          {
            error:
              'Gagal menghapus berkas di media penyimpanan storage. Penghapusan dibatalkan demi keamanan data.',
          },
          { status: 502 }
        );
      }
    }

    // 3. Bersihkan sampul jika ada
    if (existing.cover_image) {
      const coverDeleted = await deleteUploadedFile(existing.cover_image);
      if (!coverDeleted) {
        console.warn(`[EBook Delete] Gagal menghapus cover storage: ${existing.cover_image}`);
      }
    }

    // 4. Hapus record dari database dengan perlindungan Compensating Action
    try {
      // Test hook khusus simulasi kegagalan database pada automated testing terisolasi
      if (request.headers.get('x-test-simulate-db-failure') === 'true') {
        throw new Error('SIMULATED_DATABASE_DELETE_FAILURE');
      }

      await prisma.eBook.delete({
        where: { id },
      });
    } catch (dbError: any) {
      console.error(
        `[CRITICAL EBOOK DELETE ERROR] Berkas storage telah terhapus, namun penghapusan record DB gagal untuk e-book ${id}:`,
        dbError
      );

      // COMPENSATING ACTION (Pemulihan Storage):
      // Pulihkan kembali berkas fisik ke media penyimpanan agar database TIDAK menunjuk berkas yang hilang
      let fileRestored = false;
      if (fileBackupBuffer && localFilePath) {
        try {
          const dir = path.dirname(localFilePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(localFilePath, fileBackupBuffer);
          fileRestored = true;
          console.log(
            `[EBook Delete Recovery] Berkas lokal berhasil dipulihkan ke ${localFilePath}. Referensi database tetap utuh dan valid.`
          );
        } catch (restoreErr) {
          console.error('[EBook Delete Recovery] Gagal memulihkan berkas lokal:', restoreErr);
        }
      }

      if (coverBackupBuffer && localCoverPath) {
        try {
          const dir = path.dirname(localCoverPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(localCoverPath, coverBackupBuffer);
        } catch (restoreCoverErr) {
          console.warn('[EBook Delete Recovery] Gagal memulihkan sampul lokal:', restoreCoverErr);
        }
      }

      // Jika pemulihan berkas gagal, fallback: unpublish e-book agar siswa tidak dapat mengakses link rusak
      if (!fileRestored) {
        try {
          await prisma.eBook.update({
            where: { id },
            data: { is_published: false },
          });
          console.log(`[EBook Delete Recovery] E-Book ${id} berhasil di-unpublish sebagai langkah pengamanan data.`);
        } catch (unpublishErr) {
          console.error('[EBook Delete Recovery] Unpublish fallback gagal:', unpublishErr);
        }
      }

      return NextResponse.json(
        {
          error:
            'Gagal menghapus data buku dari database. Mekanisme pemulihan (compensating action) telah dijalankan demi integritas sistem.',
          recovery_executed: true,
          file_restored: fileRestored,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Buku elektronik "${existing.title}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/library/ebooks/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus buku elektronik.' },
      { status: 500 }
    );
  }
}
