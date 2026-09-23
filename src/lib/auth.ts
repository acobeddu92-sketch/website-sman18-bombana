import { SignJWT, jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME, UserRole } from './constants';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sman18bombana_default_super_secret_jwt_key_2026'
);

export interface SessionPayload {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  email: string;
  force_password_change?: boolean;
}

// Enkripsi dan pembuatan token JWT (Murni Edge runtime safe menggunakan jose)
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Verifikasi token JWT (Murni Edge runtime safe menggunakan jose)
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      username: payload.username as string,
      role: payload.role as UserRole,
      email: payload.email as string,
      force_password_change: Boolean(payload.force_password_change),
    };
  } catch {
    return null;
  }
}

// Cookie config
export const cookieOptions = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 hari
};
