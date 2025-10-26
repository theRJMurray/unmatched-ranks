import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function generateToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function setTokenCookie(res: NextResponse, token: string) {
  res.cookies.set('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
}

export function clearTokenCookie(res: NextResponse) {
  res.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'strict'
  });
}

export function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get('token')?.value || null;
}

export function getCurrentUser(req: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  
  return verifyToken(token);
}
