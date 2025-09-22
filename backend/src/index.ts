import express from 'express';
import { expressAuth } from './lib/auth.ts';
import rateLimiter from './middleware/rateLimit.ts';
import { setupSecurity } from './middleware/security.ts';

import 'dotenv/config';

// Express アプリケーションインスタンスを作成
const app = express();
// プロキシ配下でもクライアントIPを正しく取得するための設定
// 本番では TRUST_PROXY にプロキシのホップ数などを指定し、未設定時はローカル開発のみ許可する
app.set('trust proxy', process.env.TRUST_PROXY ?? 'loopback');

// フォーム送信やJSON APIのペイロードを受け取れるようボディパーサーを有効化
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ポート番号を環境変数から取得（デフォルト: 3001）
const port = parseInt(process.env.PORT || '3001', 10);

// ミドルウェアの設定（順序が重要）
app.use(setupSecurity.helmet); // セキュリティヘッダーを設定
app.use(setupSecurity.cors); // CORS設定を適用
app.use(rateLimiter); // レート制限
app.use(setupSecurity.serverLoad); // サーバー負荷監視

// Auth.js のルート設定（Express 5.x 互換性のため修正）
app.use('/api/auth', expressAuth);

// テスト用のエンドポイント
app.get('/hello', (req, res) => {
  res.json({
    message: 'Hello World!', // 挨拶メッセージ
    timestamp: new Date().toISOString(), // 現在のタイムスタンプ
    environment: process.env.NODE_ENV || 'development', // 実行環境
  });
});

// Auth.js の動作確認用エンドポイント
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

// サーバーを指定ポートで起動
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
