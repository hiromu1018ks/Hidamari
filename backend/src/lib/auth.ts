import { ExpressAuth } from '@auth/express';
import Github from '@auth/express/providers/github';
import Google from '@auth/express/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma.ts';

import 'dotenv/config';

export const expressAuth = ExpressAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },
  // pages: {
  //   signIn: `${process.env.FRONTEND_URL}/auth/signin`,
  //   error: `${process.env.FRONTEND_URL}/auth/error`,
  // },
});
