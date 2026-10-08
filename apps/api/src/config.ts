import type { Env } from "./env.js";

/**
 * Kiểm tra cấu hình bắt buộc theo môi trường. Không bao giờ trả về giá trị bí mật,
 * chỉ trả về TÊN biến còn thiếu hoặc sai định dạng.
 */
export interface ConfigProblem {
  name: string;
  message: string;
}

const isProd = (env: Env) => env.APP_ENV === "production";
const requiresStrict = (env: Env) => env.APP_ENV === "staging" || env.APP_ENV === "production";

export function validateConfig(env: Env): ConfigProblem[] {
  const problems: ConfigProblem[] = [];
  const push = (name: string, message: string) => problems.push({ name, message });

  if (!env.SUPABASE_URL) push("SUPABASE_URL", "Thiếu URL project Supabase");
  else if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(env.SUPABASE_URL.trim()) &&
    requiresStrict(env)
  ) {
    push("SUPABASE_URL", "Phải có dạng https://<project-ref>.supabase.co");
  }
  if (!env.SUPABASE_ANON_KEY)
    push("SUPABASE_ANON_KEY", "Thiếu khóa anon (dùng để kiểm tra email xác minh khi bootstrap)");

  if (!env.DB) push("DB", "Thiếu binding D1");

  const origins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origins.length === 0) push("ALLOWED_ORIGINS", "Chưa có origin nào được phép");
  if (isProd(env)) {
    if (origins.some((o) => !o.startsWith("https://") || o.includes("localhost"))) {
      push("ALLOWED_ORIGINS", "Production chỉ cho phép origin https:// và không chứa localhost");
    }
    if (!env.PUBLIC_APP_URL?.startsWith("https://"))
      push("PUBLIC_APP_URL", "Production phải dùng https://");
    if (!env.INITIAL_ADMIN_EMAIL)
      push("INITIAL_ADMIN_EMAIL", "Cần để khởi tạo quản trị viên đầu tiên");
  }

  if (
    env.SETUP_SECRET !== undefined &&
    env.SETUP_SECRET.length > 0 &&
    env.SETUP_SECRET.length < 32
  ) {
    push("SETUP_SECRET", "Phải có ít nhất 32 ký tự ngẫu nhiên");
  }
  if (requiresStrict(env) && !env.SETUP_SECRET)
    push("SETUP_SECRET", "Cần đặt bằng wrangler secret put");
  if (requiresStrict(env) && !env.SENSITIVE_RATE_LIMITER) {
    push("SENSITIVE_RATE_LIMITER", "Thiếu binding Rate Limiting (bắt buộc ở staging/production)");
  }
  return problems;
}
