/**
 * アプリのエントリポイント。
 * - セキュリティ/負荷/レート制限ミドルウェアを順序通りに適用
 * - Auth.js ルートを `/api/auth` 配下にマウント
 * - プロキシ配下でも正しいクライアントIPを扱えるよう trust proxy を設定
 */
import express from 'express';
import { expressAuth } from './lib/auth.ts';
import rateLimiter from './middleware/rateLimit.ts';
import { setupSecurity } from './middleware/security.ts';

import 'dotenv/config';

const app = express();
// プロキシ配下での正しいIP取得（ALB/NGINX/Cloudflare 等）。
// 本番は `TRUST_PROXY` にホップ数や 'loopback,uniquelocal' などを指定。
app.set('trust proxy', process.env.TRUST_PROXY ?? 'loopback');

// JSON/URL-encoded ボディの受け取り
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = parseInt(process.env.PORT || '3001', 10);

// ミドルウェア（既存順序を維持）
app.use(setupSecurity.helmet); // セキュリティヘッダー
app.use(setupSecurity.cors); // CORS
app.use(rateLimiter); // レート制限
app.use(setupSecurity.serverLoad); // サーバー負荷監視

// Auth.js ルート
app.use('/api/auth', expressAuth);

// 動作確認用エンドポイント
app.get('/hello', (req, res) => {
  res.json({
    message: 'Hello World!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Auth.js 状態確認用
app.get('/auth-status', (req, res) => {
  res.json({
    message: 'Auth.js is configured',
    providers: ['Google', 'GitHub'],
    endpoints: {
      signin: '/auth/signin',
      signout: '/auth/signout',
      session: '/auth/session',
      providers: '/auth/providers',
      csrf: '/auth/csrf',
    },
    timestamp: new Date().toISOString(),
  });
});

// サーバ起動
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
