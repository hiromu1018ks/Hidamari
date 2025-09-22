/**
 * Prisma クライアントのシングルトン。
 * - dev の HMR でも接続を使い回すため globalThis を利用
 * - 詳細ログが不要なら log 設定を調整
 */

import { PrismaClient } from '../generated/prisma/index.js';

// PrismaClientの型拡張
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: ['query'],
  });

// dev/test は再利用、本番は都度生成（プロセスライフサイクル依存）
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
