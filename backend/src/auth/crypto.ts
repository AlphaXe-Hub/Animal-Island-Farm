import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { JWT_EXPIRES, JWT_SECRET } from '../config.js';

const SALT = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  } as SignOptions);
}

export function verifyToken(token: string): { sub: string } {
  const p = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  if (typeof p.sub !== 'string') throw new Error('Invalid token');
  return { sub: p.sub };
}
