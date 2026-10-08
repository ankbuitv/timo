import type { MiddlewareHandler } from "hono";
import type { Env } from "../env.js";

/** Tiêu đề bảo mật cho mọi phản hồi API. */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  h.set("Cross-Origin-Resource-Policy", "same-site");
  h.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  if (c.env && (c.env as Env).APP_ENV === "production") {
    h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  // Dữ liệu cá nhân và quản trị không được lưu cache trung gian.
  if (c.req.path.startsWith("/api/admin") || c.req.path === "/api/me") {
    h.set("Cache-Control", "no-store");
  }
};

/**
 * CORS theo danh sách origin cấu hình sẵn (ALLOWED_ORIGINS).
 * Không dùng wildcard, không phản hồi credentials cho origin lạ.
 */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter((o) => o.length > 0);
}

export const corsForAllowedOrigins: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header("Origin");
  const allowed = parseAllowedOrigins((c.env as Env | undefined)?.ALLOWED_ORIGINS);
  const isAllowed = !!origin && allowed.includes(origin);

  if (c.req.method === "OPTIONS") {
    if (!isAllowed) return c.body(null, 403);
    return c.body(null, 204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization,Content-Type",
      "Access-Control-Max-Age": "600",
      Vary: "Origin",
    });
  }

  await next();
  if (isAllowed) {
    c.res.headers.set("Access-Control-Allow-Origin", origin);
    c.res.headers.append("Vary", "Origin");
  }
};

/** Chặn thay đổi trạng thái từ origin không được phép (CSRF phòng thủ chiều sâu). */
export const originGuard: MiddlewareHandler = async (c, next) => {
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method);
  if (unsafe && c.req.header("Authorization") === undefined) {
    // Yêu cầu không dùng Bearer token không được phép thay đổi dữ liệu.
    return c.json(
      { error: { code: "unauthorized", message: "Cần đăng nhập để thực hiện thao tác này" } },
      401,
    );
  }
  const origin = c.req.header("Origin");
  if (unsafe && origin) {
    const allowed = parseAllowedOrigins((c.env as Env | undefined)?.ALLOWED_ORIGINS);
    if (!allowed.includes(origin)) {
      return c.json({ error: { code: "forbidden", message: "Origin không được phép" } }, 403);
    }
  }
  await next();
};
