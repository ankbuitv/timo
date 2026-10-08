/**
 * Cấu hình phía client. Tất cả giá trị đến từ biến VITE_* lúc build.
 * Không có bí mật nào ở đây – chỉ có URL công khai và khóa anon.
 */
function clean(value: string | undefined, fallback = ""): string {
  return (value ?? fallback).trim().replace(/\/+$/, "");
}

export const config = {
  apiBaseUrl: clean(import.meta.env.VITE_API_BASE_URL),
  supabaseUrl: clean(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim(),
  appUrl: clean(import.meta.env.VITE_PUBLIC_APP_URL, "http://localhost:5173"),
  supportUrl: clean(import.meta.env.VITE_PUBLIC_SUPPORT_URL),
  statusUrl: clean(import.meta.env.VITE_PUBLIC_STATUS_URL),
  appEnv: import.meta.env.VITE_APP_ENV ?? "development",
} as const;

export const isSupabaseConfigured =
  config.supabaseUrl.length > 0 && config.supabaseAnonKey.length > 0;
