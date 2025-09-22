/**
 * グローバルなレート制限。
 * 注意: プロキシ配下では `app.set('trust proxy', ...)` が必須。
 * 調整: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX
 */
import { rateLimit } from 'express-rate-limit';

import 'dotenv/config';

// 監視窓（ms）。未設定は 15 分。
const windowMs: number =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

// 窓内の最大リクエスト数。未設定は 100。
const max: number = Number(process.env.RATE_LIMIT_MAX) || 100;

/**
 * - 単位: クライアントIPごとに windowMs 内 max 回
 * - 標準ヘッダーを有効化（RFC準拠）、旧ヘッダーは無効
 * - 使い方: app.use('/api', rateLimiter)
 * - CI/E2E でノイジーな場合は env を緩めるか skip を拡張
 */
const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 開発中は認証フロー検証の邪魔にならないよう一部除外。
    // 追加除外は IP/パス前方一致などでここに拡張。
    if (
      process.env.NODE_ENV === 'development' &&
      req.path.startsWith('/auth')
    ) {
      return true;
    }

    return false;
  },
  message: {
    error: 'Too many requests',
    message: 'リクエストが多すぎます。しばらくして再度お試しください。',
  },
});

export default rateLimiter;
