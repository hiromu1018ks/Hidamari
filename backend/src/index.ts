import express from "express";
import "dotenv/config";
import rateLimiter from "./middleware/rateLimit";
import { setupSecurity } from "./middleware/security";

// Express アプリケーションインスタンスを作成
const app = express();
// ポート番号を環境変数から取得（デフォルト: 3001）
const port = parseInt(process.env.PORT || "3001", 10);

// ミドルウェアの設定（順序が重要）
app.use(setupSecurity.helmet); // セキュリティヘッダーを設定
app.use(setupSecurity.serverLoad); // サーバー負荷監視
app.use(rateLimiter); // レート制限を適用
app.use(setupSecurity.cors); // CORS設定を適用

// テスト用のエンドポイント
app.get("/hello", (req, res) => {
  res.json({
    message: "Hello World!", // 挨拶メッセージ
    timestamp: new Date().toISOString(), // 現在のタイムスタンプ
    environment: process.env.NODE_ENV || "development", // 実行環境
  });
});

// サーバーを指定ポートで起動
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});
