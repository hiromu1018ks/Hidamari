import rateLimit from 'express-rate-limit';

import 'dotenv/config';

// レート制限の時間窓を設定（デフォルト: 15分）
// 本番環境では RATE_LIMIT_WINDOW_MS（ミリ秒）で監視期間を調整できる
const windowMs: number =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

// 時間窓内での最大リクエスト数を設定（デフォルト: 100回）
// ボット攻撃の兆候があれば RATE_LIMIT_MAX を下げて対応する
const max: number = Number(process.env.RATE_LIMIT_MAX) || 100;

// Express用のレート制限ミドルウェアを作成
const rateLimiter = rateLimit({
  windowMs, // 時間窓（ミリ秒）
  max, // 最大リクエスト数
  standardHeaders: true, // RFC標準のレート制限ヘッダーを送信
  legacyHeaders: false, // 古いX-RateLimit系ヘッダーは無効化
  skip: (req) => {
    // 開発環境のみAuth関連ルートのレート制限を解除（検証を妨げないため）
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
    message: 'リクエストが多すぎます。15分後に再度お試しください。',
  },
});

export default rateLimiter;
