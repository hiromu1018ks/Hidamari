/**
 * Gemini API 入出力のバリデーションを一元管理するユーティリティ。
 * - 不正な入力/レスポンスは GeminiError を throw（呼び出し側で例外制御）。
 * - 検証は副作用なし。表示やロギングは上位層で行う。
 */
import { GeminiError, GeminiErrorCode } from '../types/gemini.ts';

export class GeminiValidation {
  /** 最大許容文字数（プロンプト/提案共通の上限） */
  static readonly MAX_CONTENT_LENGTH = 1000;
  /** 最小許容文字数（空文字の拒否に使用） */
  static readonly MIN_CONTENT_LENGTH = 1;

  /**
   * 入力テキストの型と長さを検証（下限は trim 後、上限は生文字列で判定）。
   * @param content ユーザー入力文字列
   * @throws GeminiError INVALID_INPUT 型不正/短すぎ/長すぎ
   */
  static validateContent(content: string): void {
    if (typeof content !== 'string') {
      throw new GeminiError(
        'Content must be a string',
        GeminiErrorCode.INVALID_INPUT,
      );
    }

    if (content.trim().length < this.MIN_CONTENT_LENGTH) {
      throw new GeminiError(
        'Content is too short',
        GeminiErrorCode.INVALID_INPUT,
      );
    }

    if (content.length > this.MAX_CONTENT_LENGTH) {
      throw new GeminiError(
        'Content exceeds maximum length of 1000 characters',
        GeminiErrorCode.INVALID_INPUT,
      );
    }
  }

  /**
   * Gemini API の解析レスポンスを検証。
   * 期待: score は 0..100 の number、reason は非空 string。
   * @param data API 生レスポンス（AnalysisResult 期待形）
   * @returns 正規化済みの { score, reason }
   * @throws GeminiError PARSING_ERROR フォーマット/範囲不正
   */
  static validateAnalysisResponse(data: unknown): {
    score: number;
    reason: string;
  } {
    if (!data || typeof data !== 'object') {
      throw new GeminiError(
        'Invalid response format from Gemini API',
        GeminiErrorCode.PARSING_ERROR,
      );
    }

    const { score, reason } = data as { score?: unknown; reason?: unknown };

    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new GeminiError(
        'Invalid score in Gemini API response',
        GeminiErrorCode.PARSING_ERROR,
      );
    }

    if (typeof reason !== 'string' || reason.trim().length === 0) {
      throw new GeminiError(
        'Invalid reason in Gemini API response',
        GeminiErrorCode.PARSING_ERROR,
      );
    }

    return { score, reason };
  }

  /**
   * Gemini の提案文を検証（非空・長さ上限）。
   * @param suggestion 提案文字列
   * @throws GeminiError PARSING_ERROR フォーマット/長さ超過
   */
  static validateSuggestion(suggestion: string): void {
    if (typeof suggestion !== 'string' || suggestion.trim().length === 0) {
      throw new GeminiError(
        'Invalid suggestion format',
        GeminiErrorCode.PARSING_ERROR,
      );
    }

    if (suggestion.length > this.MAX_CONTENT_LENGTH) {
      throw new GeminiError(
        'Suggestion exceeds maximum length',
        GeminiErrorCode.PARSING_ERROR,
      );
    }
  }
}
