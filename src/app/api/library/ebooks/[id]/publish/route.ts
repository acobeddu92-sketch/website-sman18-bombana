import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEbookManagementAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// POST: Publikasikan e-book agar dapat dibaca oleh siswa
export async function POST(
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
    const ebook = await prisma.eBook.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!ebook) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (!ebook.category) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak memiliki kategori yang valid.' },
        { status: 400 }
      );
    }

    if (!ebook.file_url) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak memiliki berkas dokumen yang terunggah.' },
        { status: 400 }
      );
    }

    const updated = await prisma.eBook.update({
      where: { id },
      data: { is_published: true },
      select: {
        id: true,
        title: true,
        is_published: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Buku elektronik "${updated.title}" berhasil dipublikasikan untuk siswa.`,
      ebook: updated,
    });
  } catch (error: any) {
    console.error('Error in POST /api/library/ebooks/[id]/publish:', error);
    return NextResponse.json(
      { error: 'Gagal mempublikasikan buku elektronik.' },
      { status: 500 }
    );
  }
}
