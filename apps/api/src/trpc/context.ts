import { inferAsyncReturnType } from '@trpc/server';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export async function createContext(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
        id: string;
        email: string;
        role: string;
      };
      user = decoded;
    } catch (err) {
      // Invalid token
    }
  }

  return {
    prisma,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
