/**
 * セキュリティ関連ミドルウェアの集約（Helmet/CORS/過負荷制御）。
 * 推奨適用順: serverLoad → helmet → cors
 * プロセス終了時は toobusy のリソースを解放すること。
 */
import cors from 'cors';
import { type NextFunction, type Request, type Response } from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import toobusy from 'toobusy-js';

import 'dotenv/config';

// process.on('SIGINT', () => toobusy.shutdown()) などで終了時に解放

// ============================================
// CORS 設定
// ============================================
// 許可オリジン。未設定時はローカルを許可。
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_STAGING_URL,
  process.env.FRONTEND_PREVIEW_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter((origin): origin is string => Boolean(origin));

export const corsOptions = {
  // 明示リストで検証（ワイルドカード禁止）
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      // same-origin やサーバー間通信（Origin 無し）は許可
      callback(null, true);

      return;
    }

    if (origin === 'null' && process.env.NODE_ENV !== 'production') {
      // file:/ などで Origin が "null" になる開発用途を許可
      callback(null, true);

      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);

      return;
    }

    callback(
      new Error(`Origin ${origin} is not allowed by CORS policy`),
      false,
    );
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// ============================================
// サーバー負荷監視ミドルウェア
// ============================================
export const serverLoadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // イベントループ遅延が閾値超過なら 503 を返して早期遮断
  if (toobusy()) {
    res.status(503).json({
      error: 'Server too busy',
      message:
        'サーバーが混雑しています。しばらく時間をおいてから再度お試しください。',
    });

    return;
  }

  next();
};

// ============================================
// Helmet（セキュリティヘッダー）
// ============================================
const helmetOptions: HelmetOptions = {
  // COEP は Auth.js の一部と相性が悪いため無効化
  crossOriginEmbedderPolicy: false,
};

if (process.env.NODE_ENV === 'development') {
  // 開発中は HMR などのため CSP を無効化
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
      styleSrc: [
        "'self'",
        'https://fonts.googleapis.com',
        'https://authjs.dev',
      ],
      connectSrc: ["'self'", 'https://authjs.dev'], // 外部 API を増やしたらここに追加
      formAction: ["'self'", 'https://accounts.google.com'],
    },
  };
}

// ルート側でまとめて適用できるエイリアス。必要に応じて個別にも使用可。
// 例: app.use(setupSecurity.serverLoad); app.use(setupSecurity.helmet); app.use(setupSecurity.cors);
export const setupSecurity = {
  helmet: helmet(helmetOptions),
  cors: cors(corsOptions),
  serverLoad: serverLoadMiddleware,
};
