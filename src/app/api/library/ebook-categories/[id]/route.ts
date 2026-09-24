import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEbookManagementAccess, verifyEbookReadAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// GET: Ambil detail kategori e-book tertentu (Bisa diakses Admin, Kepala Perpustakaan, dan Siswa)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyEbookReadAccess(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID kategori wajib disertakan.' }, { status: 400 });
  }

  try {
    const category = await prisma.eBookCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { ebooks: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori buku elektronik tidak ditemukan.' },
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
        ebooks_count: category._count.ebooks,
        created_at: category.created_at,
        updated_at: category.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/library/ebook-categories/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail kategori e-book.' },
      { status: 500 }
    );
  }
}

// PATCH: Perbarui kategori e-book (Khusus Administrator & Kepala Perpustakaan)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyEbookManagementAccess(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID kategori wajib disertakan.' }, { status: 400 });
  }

  try {
    const existing = await prisma.eBookCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kategori buku elektronik tidak ditemukan.' },
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
        const conflict = await prisma.eBookCategory.findUnique({
          where: { name: trimmedName },
        });
        if (conflict) {
          return NextResponse.json(
            { error: `Kategori e-book dengan nama "${trimmedName}" sudah ada.` },
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
          { error: 'Kode klasifikasi tidak boleh kosong.' },
          { status: 400 }
        );
      }
      if (trimmedCode !== existing.code) {
        const conflict = await prisma.eBookCategory.findUnique({
          where: { code: trimmedCode },
        });
        if (conflict) {
          return NextResponse.json(
            { error: `Kategori e-book dengan kode "${trimmedCode}" sudah ada.` },
            { status: 409 }
          );
        }
        dataToUpdate.code = trimmedCode;
      }
    }

    if (description !== undefined) {
      dataToUpdate.description = description?.trim() || null;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data valid yang akan diperbarui.' },
        { status: 400 }
      );
    }

    const updated = await prisma.eBookCategory.update({
      where: { id },
      data: dataToUpdate,
      include: {
        _count: { select: { ebooks: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kategori e-book berhasil diperbarui.',
      category: {
        id: updated.id,
        name: updated.name,
        code: updated.code,
        description: updated.description,
        ebooks_count: updated._count.ebooks,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/library/ebook-categories/[id]:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nama atau kode kategori e-book sudah terdaftar (harus unik).' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal memperbarui kategori buku elektronik.' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus kategori e-book (hanya jika belum memiliki relasi buku elektronik)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { errorResponse } = await verifyEbookManagementAccess(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID kategori wajib disertakan.' }, { status: 400 });
  }

  try {
    const category = await prisma.eBookCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { ebooks: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori buku elektronik tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Proteksi Integritas Relasi: Cegah penghapusan jika masih digunakan e-book
    if (category._count.ebooks > 0) {
      return NextResponse.json(
        {
          error: `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh ${category._count.ebooks} judul buku elektronik. Ubah atau hapus koleksi e-book terkait terlebih dahulu.`,
          ebooks_count: category._count.ebooks,
        },
        { status: 400 }
      );
    }

    await prisma.eBookCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Kategori e-book "${category.name}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/library/ebook-categories/[id]:', error);
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Kategori tidak dapat dihapus karena masih terkait dengan data e-book.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal menghapus kategori buku elektronik.' },
      { status: 500 }
    );
  }
}
