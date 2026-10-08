export type AppEnvironment = "development" | "staging" | "production";

/** Bindings và biến môi trường của Worker. */
export interface Env {
  DB: D1Database;
  SENSITIVE_RATE_LIMITER?: RateLimit;

  APP_ENV?: AppEnvironment;
  PUBLIC_APP_URL?: string;
  SUPABASE_URL?: string;
  /** Khóa anon (công khai). Dùng để gọi /auth/v1/user khi kiểm tra email đã xác minh. */
  SUPABASE_ANON_KEY?: string;
  /** Danh sách origin, phân tách bằng dấu phẩy. */
  ALLOWED_ORIGINS?: string;
  INITIAL_ADMIN_EMAIL?: string;

  /** Danh sách host Ollama được phép (phân tách bằng dấu phẩy). Mặc định: ollama.com */
  AI_ALLOWED_HOSTS?: string;

  /** Secrets (wrangler secret put) */
  SETUP_SECRET?: string;
  /** 32 byte ngẫu nhiên, base64. Mã hóa AES-256-GCM cho API key Ollama. KHÔNG lưu trong D1. */
  TIMO_AI_ENCRYPTION_KEY?: string;
}
