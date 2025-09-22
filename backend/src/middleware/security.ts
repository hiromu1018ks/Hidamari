import cors from 'cors';
import { type NextFunction, type Request, type Response } from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import toobusy from 'toobusy-js';

import 'dotenv/config';

// ============================================
// CORS 設定
// ============================================
// 許可したいフロントエンドのオリジン一覧をまとめて管理する。
// 環境変数が未設定の場合はローカル開発用URLのみを許可する。
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_STAGING_URL,
  process.env.FRONTEND_PREVIEW_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter((origin): origin is string => Boolean(origin));

export const corsOptions = {
  // オリジンが許可リストに含まれているかを実行時にチェックする
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      // same-origin やサーバー間通信など Origin ヘッダーが無いケースは許可
      callback(null, true);

      return;
    }

    if (origin === 'null' && process.env.NODE_ENV !== 'production') {
      // ブラウザ拡張やローカルファイルなどで Origin ヘッダーが "null" になるケースを開発/検証用に許可
      callback(null, true);

      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);

      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS policy`), false);
  },
  credentials: true, // 認証Cookieを扱うためにクレデンシャル付きリクエストを許可
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 利用するHTTPメソッドのみを許可
  allowedHeaders: ['Content-Type', 'Authorization'], // 必要なヘッダーだけを許可
  optionsSuccessStatus: 204, // プリフライト成功時のレスポンス（ボディ不要の204）
};

// ============================================
// サーバー負荷監視ミドルウェア
// ============================================
export const serverLoadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // toobusy-js が閾値を超えた場合は高負荷と判定する
  if (toobusy()) {
    res.status(503).json({
      error: 'Server too busy',
      message: 'サーバーが混雑しています。しばらく時間をおいてから再度お試しください。',
    });

    return;
  }

  next();
};

// ============================================
// Helmet（セキュリティヘッダー）設定
// ============================================
const helmetOptions: HelmetOptions = {
  // COEP を有効化すると Auth.js が配信する一部リソースがブロックされるため無効化
  crossOriginEmbedderPolicy: false,
};

if (process.env.NODE_ENV === 'development') {
  // 開発中はCSPを無効化してホットリロード等を容易にする
  helmetOptions.contentSecurityPolicy = false;
} else {
  helmetOptions.contentSecurityPolicy = {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://authjs.dev'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://authjs.dev'],
      connectSrc: ["'self'", 'https://authjs.dev'],
      formAction: ["'self'", 'https://accounts.google.com'],
    },
  };
}

// ルート側でセキュリティ関連ミドルウェアをまとめて利用できるようにエクスポート
export const setupSecurity = {
  helmet: helmet(helmetOptions),
  cors: cors(corsOptions),
  serverLoad: serverLoadMiddleware,
};
