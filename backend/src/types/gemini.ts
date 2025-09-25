export interface AnalysisResult {
  isPositive: boolean;
  score: number;
  reason: string;
  suggestion?: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

export enum GeminiErrorCode {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_INPUT = 'INVALID_INPUT',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code: GeminiErrorCode,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export interface GeminiAnalysisResponse {
  score: number;
  reason: string;
}
