import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface JwtUserPayload {
  id: number;
  email: string;
  role: 'CLIENT' | 'AGENT';
  name: string;
}

export function signToken(user: JwtUserPayload) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): JwtUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) return null;
  return user;
}
