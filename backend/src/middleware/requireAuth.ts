import { getSession, type Session } from '@auth/express';
import { NextFunction, Request, Response } from 'express';
import { authConfig } from '../lib/auth.ts';

type ReqWithAuth = Request & { auth?: Session | null };

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = req.auth ?? (await getSession(req, authConfig));
    (req as ReqWithAuth).auth = session ?? null;

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  } catch (err) {
    next(err);
  }
}
