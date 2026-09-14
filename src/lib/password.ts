import bcrypt from 'bcryptjs';

// Hash password menggunakan bcrypt
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

// Verifikasi password terhadap hash
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
