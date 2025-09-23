import type { Session } from '@auth/express';

declare global {
  namespace Express {
    interface Request {
      auth?: Session | null;
    }
  }
}

export {};
