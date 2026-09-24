import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEbookManagementAccess } from '@/lib/library-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// POST: Tarik kembali publikasi e-book (jadikan draf internal)
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
    });

    if (!ebook) {
      return NextResponse.json(
        { error: 'Buku elektronik tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updated = await prisma.eBook.update({
      where: { id },
      data: { is_published: false },
      select: {
        id: true,
        title: true,
        is_published: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Publikasi buku elektronik "${updated.title}" berhasil ditarik kembali (menjadi draf).`,
      ebook: updated,
    });
  } catch (error: any) {
    console.error('Error in POST /api/library/ebooks/[id]/unpublish:', error);
    return NextResponse.json(
      { error: 'Gagal menarik publikasi buku elektronik.' },
      { status: 500 }
    );
  }
}
