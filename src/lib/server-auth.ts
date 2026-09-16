import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifySessionToken, SessionPayload } from './auth';
import { AUTH_COOKIE_NAME, UserRole } from './constants';

export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ session: SessionPayload | null; errorResponse: Response | null }> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      session: null,
      errorResponse: new Response(
        JSON.stringify({ error: 'Akses ditolak. Silakan login terlebih dahulu.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(session.role);
    if (!isAllowed) {
      return {
        session,
        errorResponse: new Response(
          JSON.stringify({ error: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses layanan ini.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
  }

  return { session, errorResponse: null };
}
