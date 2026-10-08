import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "./auth.js";
import { errors } from "../lib/errors.js";
import { log } from "../lib/logger.js";

/**
 * Giới hạn tốc độ cho endpoint nhạy cảm bằng Cloudflare Rate Limiting binding.
 *
 * - KHÔNG dùng Map trong bộ nhớ: mỗi isolate Worker có bộ nhớ riêng, không chia sẻ giữa các
 *   vị trí edge, nên không đủ để chống lạm dụng.
 * - Binding là eventually consistent và đếm theo vị trí (location), nên đây là lớp chống lạm dụng,
 *   KHÔNG phải hạn mức chính xác. Không dùng để tính tiền hay quota.
 * - Fail CLOSED ở staging/production: thiếu binding → 503. Chỉ bỏ qua ở môi trường development.
 */
export function rateLimit(scope: string): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const limiter = c.env.SENSITIVE_RATE_LIMITER;
    const env = c.env.APP_ENV ?? "development";
    if (!limiter) {
      if (env === "development") {
        log("debug", "ratelimit.binding_missing_dev", { scope });
        return next();
      }
      log("error", "ratelimit.binding_missing", { scope, environment: env });
      throw errors.unavailable("Hệ thống chưa sẵn sàng (thiếu cấu hình giới hạn tốc độ)");
    }
    // CF-Connecting-IP do Cloudflare đặt, không thể bị client giả mạo qua proxy Cloudflare.
    const ip = c.req.header("CF-Connecting-IP");
    if (!ip) {
      // Không có IP tin cậy (ví dụ gọi trực tiếp không qua Cloudflare) → từ chối thay vì gộp chung bucket.
      throw errors.rateLimited("Yêu cầu không hợp lệ, vui lòng thử lại");
    }
    const { success } = await limiter.limit({ key: `${scope}:${ip}` });
    if (!success) {
      c.header("Retry-After", "60");
      throw errors.rateLimited();
    }
    await next();
  };
}
