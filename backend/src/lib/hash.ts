import bcrypt from 'bcryptjs';
const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
export async function hashPassword(plain: string) { return bcrypt.hash(plain, ROUNDS); }
export async function verifyPassword(plain: string, hash: string) { return bcrypt.compare(plain, hash); }
