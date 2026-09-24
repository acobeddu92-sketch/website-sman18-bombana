import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLibraryAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// GET: Ambil detail kategori tertentu
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID kategori wajib disertakan.' }, { status: 400 });
  }

  try {
    const category = await prisma.bookCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { books: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori buku tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        code: category.code,
        description: category.description,
        books_count: category._count.books,
        created_at: category.created_at,
        updated_at: category.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/categories/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail kategori.' },
      { status: 500 }
    );
  }
}

// PATCH: Perbarui kategori buku
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID kategori wajib disertakan.' }, { status: 400 });
  }

  try {
    const existing = await prisma.bookCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kategori buku tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, code, description } = body;

    const dataToUpdate: any = {};

    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Nama kategori tidak boleh kosong.' },
          { status: 400 }
        );
      }
      if (trimmedName !== existing.name) {
        const conflict = await prisma.bookCategory.findUnique({
          where: { name: trimmedName },
        });
        if (conflict) {
          return NextResponse.json(
            { error: `Kategori dengan nama "${trimmedName}" sudah ada.` },
            { status: 409 }
          );
        }
        dataToUpdate.name = trimmedName;
      }
    }

    if (code !== undefined) {
      const trimmedCode = code?.trim();
      if (!trimmedCode) {
        return NextResponse.json(
          { error: 'Kode kategori tidak boleh kosong.' },
          { status: 400 }
        );
      }
      if (trimmedCode !== existing.code) {
        const conflict = await prisma.bookCategory.findUnique({
          where: { code: trimmedCode },
        });
        if (conflict) {
          return NextResponse.json(
            { error: `Kategori dengan kode "${trimmedCode}" sudah ada.` },
            { status: 409 }
          );
        }
        dataToUpdate.code = trimmedCode;
      }
    }

    if (description !== undefined) {
      dataToUpdate.description = description?.trim() || null;
    }

    const updated = await prisma.bookCategory.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: 'Kategori buku berhasil diperbarui.',
      category: updated,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/library/categories/[id]:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nama atau kode kategori sudah terdaftar (harus unik).' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal memperbarui kategori buku.' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus kategori buku (hanya jika belum memiliki relasi buku)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyLibraryAccess(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID kategori wajib disertakan.' }, { status: 400 });
  }

  try {
    const category = await prisma.bookCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { books: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori buku tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Proteksi Integritas Relasi: Cegah penghapusan jika masih digunakan buku
    if (category._count.books > 0) {
      return NextResponse.json(
        {
          error: `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh ${category._count.books} judul buku. Ubah kategori buku tersebut terlebih dahulu.`,
          books_count: category._count.books,
        },
        { status: 400 }
      );
    }

    await prisma.bookCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Kategori "${category.name}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/library/categories/[id]:', error);
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Kategori tidak dapat dihapus karena masih terkait dengan data buku lain.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal menghapus kategori buku.' },
      { status: 500 }
    );
  }
}
