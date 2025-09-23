import type { Session } from '@auth/core/types';
import { getSession } from '@auth/express';
import type { NextFunction, Request, Response } from 'express';
import { authConfig } from '../lib/auth.ts';

type ReqWithAuth = Request & { auth?: Session | null };

export async function authSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await getSession(req, authConfig);

    (req as ReqWithAuth).auth = session;
    res.locals.session = session;

    next();
  } catch (err) {
    next(err);
  }
}
