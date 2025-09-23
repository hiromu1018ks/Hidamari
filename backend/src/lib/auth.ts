/**
 * Auth.js 設定（Express ミドルウェア）の要点
 * - プロバイダ: Google/GitHub（ENV 必須）
 * - セッション: DB 戦略、maxAge 30日
 * - 使い方: app.use('/api/auth', expressAuth)
 * - PrismaAdapter によりユーザー/セッションを永続化
 */
import { ExpressAuth, ExpressAuthConfig } from '@auth/express';
import Github from '@auth/express/providers/github';
import Google from '@auth/express/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma.ts';

import 'dotenv/config'; // .env を読み込む（ローカル/開発環境向け）

// 起動時に必須な環境変数（不足時は即エラーで fail-fast）
const requiredAuthEnv = [
  'AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
] as const;

type AuthEnvKey = (typeof requiredAuthEnv)[number];
type AuthEnv = Record<AuthEnvKey, string>;

/**
 * 必須ENVを検証して Record で返す。欠如があれば Error を投げて起動を停止。
 */
function readAuthEnv(allKeys: readonly AuthEnvKey[]): AuthEnv {
  const missing: AuthEnvKey[] = [];
  const pairs: [AuthEnvKey, string][] = [];

  for (const key of allKeys) {
    const raw = process.env[key];
    const value = typeof raw === 'string' ? raw.trim() : '';

    if (!value) {
      missing.push(key);
    } else {
      pairs.push([key, value]);
    }
  }

  if (missing.length) {
    console.error('[auth] Missing environment variables:', missing);
    throw new Error(`Missing env: ${missing.join(', ')}`);
  }

  return Object.fromEntries(pairs) as AuthEnv;
}

const authEnv = readAuthEnv(requiredAuthEnv); // 一度だけ読み込み、以降は参照のみ

/**
 * Auth.js の構成。Express にマウントして利用する。
 * - 例: app.use('/api/auth', expressAuth)
 */
export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: authEnv.GOOGLE_CLIENT_ID,
      clientSecret: authEnv.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: authEnv.GITHUB_CLIENT_ID,
      clientSecret: authEnv.GITHUB_CLIENT_SECRET,
    }),
  ],
  secret: authEnv.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'database', // DB セッション
    maxAge: 30 * 24 * 60 * 60, // 30 日
  },
} satisfies ExpressAuthConfig;

// ルータにマウントするミドルウェア
export const expressAuth = ExpressAuth(authConfig);
