import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

async function getAdminSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || session.role !== 'administrator') return null;
  return session;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { content, category, author, is_active } = body;

    const updateData: any = {};
    if (content) updateData.content = String(content).trim();
    if (category) updateData.category = category;
    if (author !== undefined) updateData.author = String(author).trim();
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updated = await prisma.dailyMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal memperbarui kata harian.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  const { id } = params;

  try {
    await prisma.dailyMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Kata harian berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal menghapus kata harian.' }, { status: 500 });
  }
}
