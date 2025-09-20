import "dotenv/config";
import rateLimit from "express-rate-limit";

// レート制限の時間窓を設定（デフォルト: 15分）
const windowMs: number =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

// 時間窓内での最大リクエスト数を設定（デフォルト: 100回）
const max: number = Number(process.env.RATE_LIMIT_MAX) || 100;

// Express用のレート制限ミドルウェアを作成
const rateLimiter = rateLimit({
  windowMs, // 時間窓（ミリ秒）
  max, // 最大リクエスト数
  // 制限に達した際のエラーメッセージ
  message: {
    error: "Too many requests",
    message: "リクエストが多すぎます。15分後に再度お試しください。",
  },
  standardHeaders: true, // 標準的なレート制限ヘッダーを送信
  legacyHeaders: false, // 古いレート制限ヘッダーは無効化
});

export default rateLimiter;
