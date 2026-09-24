import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { getSKById, deleteSK } from '@/lib/sk-archive-store';
import { deleteSKFile } from '@/lib/sk-storage';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// GET: Ambil Detail Tunggal Surat Keputusan
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  }

  try {
    const sk = await getSKById(params.id);
    if (!sk) {
      return NextResponse.json(
        { error: 'Surat Keputusan tidak ditemukan dalam arsip.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, sk });
  } catch (error: any) {
    console.error('Error in GET /api/curriculum/sk/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail Surat Keputusan.' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus Surat Keputusan dari Arsip dan Hapus Berkas Terkait
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { session, errorResponse } = await requireAuth(request, [
    'wakasek_kurikulum',
    'administrator',
  ]);
  if (errorResponse) return errorResponse;
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  }

  try {
    const sk = await getSKById(params.id);
    if (!sk) {
      return NextResponse.json(
        { error: 'Surat Keputusan tidak ditemukan atau sudah dihapus.' },
        { status: 404 }
      );
    }

    // 1. Hapus Berkas dari Storage jika ada
    if (sk.document_file_url) {
      await deleteSKFile(sk.document_file_url);
    }

    // 2. Hapus Record dari Database / Arsip
    const deleted = await deleteSK(params.id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Gagal menghapus Surat Keputusan dari arsip.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Surat Keputusan Nomor '${sk.nomor}' berhasil dihapus dari arsip resmi.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/curriculum/sk/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat menghapus SK.' },
      { status: 500 }
    );
  }
}
