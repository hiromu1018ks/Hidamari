import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
// CORS（Cross-Origin Resource Sharing）設定
import { type HelmetOptions } from 'helmet';
import toobusy from 'toobusy-js';

import 'dotenv/config';

export const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3001', // バックエンド自身（Auth.js用）
    'https://accounts.google.com', // Google OAuth
    'https://github.com', // GitHub OAuth
  ], // 許可するオリジン（フロントエンドURL）
  credentials: true, // Cookieやクレデンシャル情報を含むリクエストを許可
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 許可するHTTPメソッド
  allowedHeaders: ['Content-Type', 'Authorization'], // 許可するリクエストヘッダー
  optionsSuccessStatus: 200, // プリフライトリクエスト成功時のステータスコード
};

// サーバー負荷チェックミドルウェア
// サーバーが高負荷状態の場合にリクエストを拒否する
export const serverLoadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // サーバーが忙しい状態かどうかをチェック
  if (toobusy()) {
    // 503 Service Unavailableエラーを返してリクエストを拒否
    res.status(503).json({
      error: 'Server too busy',
      message:
        'サーバーが混雑しています。しばらく時間をおいてから再度お試しください。',
    });

    return;
  }
  // サーバーが正常な場合は次のミドルウェアへ
  next();
};

// セキュリティ関連のミドルウェアをまとめて設定
const helmetOptions: HelmetOptions = {
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
};

if (process.env.NODE_ENV === 'development') {
  helmetOptions.contentSecurityPolicy = false;
} else {
  helmetOptions.contentSecurityPolicy = {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://authjs.dev'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      formAction: ["'self'", 'https://accounts.google.com'],
    },
  };
}

export const setupSecurity = {
  helmet: helmet(helmetOptions),
  cors: cors(corsOptions), // CORS設定を適用
  serverLoad: serverLoadMiddleware, // サーバー負荷監視
};
