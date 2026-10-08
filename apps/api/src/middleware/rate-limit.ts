import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "./auth.js";
import { errors } from "../lib/errors.js";
import { log } from "../lib/logger.js";

/**
 * Giới hạn tốc độ theo IP cho các endpoint nhạy cảm, dùng Cloudflare Rate Limiting binding.
 * Nếu binding không tồn tại (môi trường phát triển cục bộ), bỏ qua và ghi cảnh báo.
 */
export function rateLimit(scope: string): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const limiter = c.env.SENSITIVE_RATE_LIMITER;
    if (!limiter) {
      log("debug", "ratelimit.binding_missing", { scope });
      return next();
    }
    const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
    const { success } = await limiter.limit({ key: `${scope}:${ip}` });
    if (!success) throw errors.rateLimited();
    await next();
  };
}
