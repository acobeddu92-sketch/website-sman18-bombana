import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { SessionPayload } from '@/lib/auth';
import { UserRole } from '@/lib/constants';

export type LibraryAuthResult =
  | { session: SessionPayload; errorResponse: null }
  | { session: null; errorResponse: NextResponse };

/**
 * Roles with authorized access to the Library Management System:
 * - 'kepala_perpustakaan': Primary operational role with full authority over library modules.
 * - 'administrator': System administration oversight.
 * - 'kepala_sekolah': School executive oversight.
 *
 * All other roles (guru_mapel, wali_kelas, guru_bk, pembina_osis, pembina_pramuka, siswa)
 * are strictly forbidden (403 Forbidden).
 */
export const ALLOWED_LIBRARY_ROLES: UserRole[] = [
  'kepala_perpustakaan',
  'administrator',
  'kepala_sekolah',
];

/**
 * Authenticates and verifies authorization for Library API endpoints.
 */
export async function verifyLibraryAccess(
  request: NextRequest,
  customAllowedRoles: UserRole[] = ALLOWED_LIBRARY_ROLES
): Promise<LibraryAuthResult> {
  const { session, errorResponse } = await requireAuth(request, customAllowedRoles);

  if (errorResponse || !session) {
    return {
      session: null,
      errorResponse:
        (errorResponse as NextResponse) ||
        NextResponse.json({ error: 'Tidak terotentikasi. Silakan login terlebih dahulu.' }, { status: 401 }),
    };
  }

  return {
    session,
    errorResponse: null,
  };
}

/**
 * Roles with full management authority over E-Books:
 * - 'administrator'
 * - 'kepala_perpustakaan'
 */
export const EBOOK_MANAGEMENT_ROLES: UserRole[] = [
  'administrator',
  'kepala_perpustakaan',
];

/**
 * Roles permitted to read/access published E-Books:
 * - 'administrator'
 * - 'kepala_perpustakaan'
 * - 'siswa'
 */
export const EBOOK_READ_ROLES: UserRole[] = [
  'administrator',
  'kepala_perpustakaan',
  'siswa',
];

export async function verifyEbookManagementAccess(
  request: NextRequest
): Promise<LibraryAuthResult> {
  return verifyLibraryAccess(request, EBOOK_MANAGEMENT_ROLES);
}

export async function verifyEbookReadAccess(
  request: NextRequest
): Promise<LibraryAuthResult> {
  return verifyLibraryAccess(request, EBOOK_READ_ROLES);
}
