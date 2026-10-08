export type AppEnvironment = "development" | "staging" | "production";

/** Bindings và biến môi trường của Worker. */
export interface Env {
  DB: D1Database;
  SENSITIVE_RATE_LIMITER?: RateLimit;

  APP_ENV?: AppEnvironment;
  PUBLIC_APP_URL?: string;
  SUPABASE_URL?: string;
  /** Danh sách origin, phân tách bằng dấu phẩy. */
  ALLOWED_ORIGINS?: string;
  INITIAL_ADMIN_EMAIL?: string;

  /** Secrets (wrangler secret put) */
  SETUP_SECRET?: string;
}
