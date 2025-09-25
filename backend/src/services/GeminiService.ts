/**
 * Gemini API 連携サービス
 * - APIキー検証 / クライアント初期化 / タイムアウト制御 / 再試行戦略
 * - 外部: analyzePositivity, generateSuggestion
 * - 内部: 共通リクエスト + エラーマッピング + 再試行ラッパ
 * - 例外は全て GeminiError に正規化
 */
import { GoogleGenAI } from '@google/genai';
import {
  AnalysisResult,
  GeminiConfig,
  GeminiError,
  GeminiErrorCode,
} from '../types/gemini.ts';
import { GeminiValidation } from '../utils/geminiValidation.ts';

import 'dotenv/config';

export class GeminiService {
  private client: GoogleGenAI;
  private config: GeminiConfig;

  /** ポジティブ判定しきい値（0-100） */
  private static readonly POSITIVE_THRESHOLD = 70;

  /**
   * 必須 ENV(GEMINI_API_KEY) を検証しクライアント初期化。欠如時は起動即失敗。
   * @throws GeminiError AUTHENTICATION_ERROR
   */
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new GeminiError(
        'GEMINI_API_KEY environment variable is required',
        GeminiErrorCode.AUTHENTICATION_ERROR,
      );
    }

    this.config = {
      apiKey,
      model: 'gemini-2.0-flash',
      timeout: 10000,
      maxRetries: 3,
    };

    this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
  }

  /**
   * コンテンツのポジティブ度合いを解析。
   * - 入力検証 → プロンプト生成 → API 呼出 → レスポンス構文解析
   * - ネガティブ時は改善提案を追加生成
   */
  async analyzePositivity(content: string): Promise<AnalysisResult> {
    GeminiValidation.validateContent(content);

    const prompt = this.buildPositivityAnalysisPrompt(content);

    return this.withRetry(async () => {
      const response = await this.makeGeminiRequest(prompt);

      return this.parseAnalysisResponse(response, content);
    });
  }

  /**
   * ポジティブ度解析用プロンプト生成。
   * @param content 元投稿
   * @returns Gemini へ送信する指示テキスト
   */
  private buildPositivityAnalysisPrompt(content: string): string {
    return `
あなたは日本語の投稿内容のポジティブ度を分析する専門家です。
以下の基準で0-100点のスコアを付けてください：

【高得点の要素（70-100点）】
- 感謝、喜び、希望を表現している
- 建設的で前向きな内容
- 他者への配慮や思いやりがある
- 学びや成長を示している

【中程度の要素（40-69点）】
- 中立的な情報共有
- 客観的な事実の記述
- 軽微な不満や困りごと

【低得点の要素（0-39点）】
- 強い批判、愚痴、ネガティブな感情
- 攻撃的な表現や誹謗中傷
- 絶望的な内容
- 他者を不快にさせる可能性がある表現

投稿内容: "${content}"

以下のJSON形式で回答してください（他の文字は含めないでください）：
{
  "score": 85,
  "reason": "感謝の気持ちと前向きな展望が表現されており、読む人に良い印象を与える内容のため"
}`;
  }

  /**
   * 解析レスポンス文字列から JSON 部分を抽出し構造化。
   * - 最初に出現する {} を単純正規表現で抜き出し（先頭/末尾に装飾が付くケース対策）
   * - JSON 解析後にバリデーション（score 範囲 / reason 非空）
   * - 閾値判定後、必要なら suggestion を追加取得
   * @throws GeminiError PARSING_ERROR JSON 取得/解析失敗
   */
  private async parseAnalysisResponse(
    response: string,
    originalContent: string,
  ): Promise<AnalysisResult> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data: unknown = JSON.parse(jsonMatch[0]);
      const { score, reason } = GeminiValidation.validateAnalysisResponse(data);

      const result: AnalysisResult = {
        isPositive: score >= GeminiService.POSITIVE_THRESHOLD,
        score,
        reason,
      };

      if (!result.isPositive) {
        result.suggestion = await this.generateSuggestion(originalContent);
      }

      return result;
    } catch (error) {
      throw new GeminiError(
        `Failed to parse Gemini API response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GeminiErrorCode.PARSING_ERROR,
      );
    }
  }

  /**
   * 改善提案生成。
   * - 入力検証 → プロンプト生成 → API 呼出 → 文字数/空判定
   */
  async generateSuggestion(content: string): Promise<string> {
    GeminiValidation.validateContent(content);

    const prompt = this.buildSuggestionPrompt(content);

    return this.withRetry(async () => {
      const suggestion = await this.makeGeminiRequest(prompt);
      GeminiValidation.validateSuggestion(suggestion);

      return suggestion;
    });
  }

  /**
   * 改善提案用プロンプト生成。
   * @param content 元投稿
   */
  private buildSuggestionPrompt(content: string): string {
    return `
あなたは投稿内容をより前向きで建設的な表現に変換する専門家です。

元の投稿の主旨を保ちながら、以下の点を改善してください：
- ネガティブな表現をポジティブに変換
- 批判的な内容を建設的な提案に変更
- 感情的な表現を落ち着いた表現に調整
- 読む人が不快にならない表現に修正
- 文字数は元の投稿と同程度にする

元の投稿: "${content}"

修正版の投稿を日本語で提案してください（説明や前置きは不要で、修正された投稿内容のみを出力してください）：`;
  }

  /**
   * 単発リクエスト共通処理。
   * - 手動タイムアウト → モデル生成 → 空レスポンス検知 → トリム
   * - エラーは handleGeminiError に集約
   */
  private async makeGeminiRequest(prompt: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: prompt,
        config: {
          abortSignal: controller.signal,
          maxOutputTokens: 1000,
          temperature: 0.1,
        },
      });

      clearTimeout(timeoutId);

      if (!response.text) {
        throw new GeminiError(
          'Empty response from Gemini API',
          GeminiErrorCode.SERVICE_UNAVAILABLE,
        );
      }

      return response.text.trim();
    } catch (error) {
      this.handleGeminiError(error);
    }
  }

  /**
   * エラーを GeminiError にマッピング。
   * - 判定順: 既存 GeminiError → Timeout → Auth → RateLimit → ServiceDown → Unknown
   */
  private handleGeminiError(error: unknown): never {
    if (error instanceof GeminiError) {
      throw error;
    }

    if (error instanceof Error) {
      // AbortController timeout
      if (error.name === 'AbortError') {
        throw new GeminiError(
          'Gemini API request timed out',
          GeminiErrorCode.TIMEOUT_ERROR,
        );
      }

      // API認証エラー
      if (
        error.message.includes('API_KEY') ||
        error.message.includes('authentication')
      ) {
        throw new GeminiError(
          'Gemini API authentication failed',
          GeminiErrorCode.AUTHENTICATION_ERROR,
        );
      }

      // レート制限エラー
      if (
        error.message.includes('rate limit') ||
        error.message.includes('quota')
      ) {
        throw new GeminiError(
          'Gemini API rate limit exceeded',
          GeminiErrorCode.RATE_LIMIT_ERROR,
        );
      }

      // サービス利用不可
      if (
        error.message.includes('service unavailable') ||
        error.message.includes('503')
      ) {
        throw new GeminiError(
          'Gemini API service unavailable',
          GeminiErrorCode.SERVICE_UNAVAILABLE,
        );
      }
    }

    // 不明なエラー
    throw new GeminiError(
      'Unknown error occurred while calling Gemini API',
      GeminiErrorCode.UNKNOWN_ERROR,
    );
  }

  /**
   * 再試行ラッパ（指数バックオフ）。将来必要なら jitter 追加を検討。
   * @param operation 実行クロージャ
   * @param attempt 現在試行回数
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    attempt = 1,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }

      if (error instanceof GeminiError) {
        const retryableErrors = [
          GeminiErrorCode.TIMEOUT_ERROR,
          GeminiErrorCode.RATE_LIMIT_ERROR,
          GeminiErrorCode.SERVICE_UNAVAILABLE,
        ];

        if (!retryableErrors.includes(error.code)) {
          throw error;
        }
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // 指数バックオフ（上限8秒）
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.withRetry(operation, attempt + 1);
    }
  }
}
