import "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import toobusy from "toobusy-js";
import { Request, Response, NextFunction } from "express";

// CORS（Cross-Origin Resource Sharing）設定
export const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // 許可するオリジン（フロントエンドURL）
  credentials: true, // Cookieやクレデンシャル情報を含むリクエストを許可
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 許可するHTTPメソッド
  allowedHeaders: ["Content-Type", "Authorization"], // 許可するリクエストヘッダー
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
      error: "Server too busy",
      message:
        "サーバーが混雑しています。しばらく時間をおいてから再度お試しください。",
    });
    return;
  }
  // サーバーが正常な場合は次のミドルウェアへ
  next();
};

// セキュリティ関連のミドルウェアをまとめて設定
export const setupSecurity = {
  helmet: helmet(), // セキュリティヘッダーを自動設定（XSS、CSRF対策など）
  cors: cors(corsOptions), // CORS設定を適用
  serverLoad: serverLoadMiddleware, // サーバー負荷監視
};
