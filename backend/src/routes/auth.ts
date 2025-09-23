import type { Session } from '@auth/express';
import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.ts';

type ReqWithAuth = Express.Request & { auth?: Session | null };

export const authRouter: ExpressRouter = Router();

authRouter.get('/me', requireAuth, (req, res) => {
  const user = (req as ReqWithAuth).auth!.user;
  res.json({ user });
});

authRouter.get('/session', (req, res) => {
  const session = (req as ReqWithAuth).auth ?? null;
  res.json({ session });
});
