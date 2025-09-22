/**
 * Auth.js 設定と Express ミドルウェア。
 * - プロバイダ: Google/GitHub（環境変数が必須）
 * - セッション: DB ストラテジー、30日
 * - 使い方: app.use('/api/auth', expressAuth)
 */
import { ExpressAuth, ExpressAuthConfig } from '@auth/express';
import Github from '@auth/express/providers/github';
import Google from '@auth/express/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma.ts';

import 'dotenv/config';

export const authConfig = {
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
} satisfies ExpressAuthConfig;

export const expressAuth = ExpressAuth(authConfig);
