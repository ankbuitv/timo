import { validateConfig } from "./config.js";
import { Hono } from "hono";
import type { SupabaseJwtVerifier } from "@timo/auth";
import type { Env } from "./env.js";
import { createDb } from "./lib/db.js";
import { ApiError, errors } from "./lib/errors.js";
import { log } from "./lib/logger.js";
import { corsForAllowedOrigins, originGuard, securityHeaders } from "./middleware/security.js";
import type { AppBindings, AppVariables } from "./middleware/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { adminAiRoutes } from "./routes/admin-ai.js";
import { meRoutes } from "./routes/me.js";
import { publicRoutes } from "./routes/public.js";
import { setupRoutes } from "./routes/setup.js";
import { newId } from "./lib/db.js";

export interface AppOptions {
  /** Ghi đè bộ xác thực (dùng khi kiểm thử). */
  verifier?: SupabaseJwtVerifier;
  /** Ghi đè fetch tới Supabase (dùng khi kiểm thử). */
  supabaseFetch?: typeof fetch;
  /** Ghi đè fetch tới nhà cung cấp AI (dùng khi kiểm thử). */
  aiFetch?: typeof fetch;
  /** Ghi đè cách tạo DB (dùng khi kiểm thử). */
  createDb?: (env: Env) => AppVariables["db"];
}

export const APP_VERSION = "0.1.0";

export function createApp(options: AppOptions = {}) {
  const app = new Hono<AppBindings>();

  app.use("*", async (c, next) => {
    const requestId = c.req.header("X-Request-Id")?.slice(0, 64) || newId();
    c.set("requestId", requestId);
    c.set("db", (options.createDb ?? createDb)(c.env));
    if (options.verifier) c.set("verifier", options.verifier);
    if (options.supabaseFetch) c.set("supabaseFetch", options.supabaseFetch);
    if (options.aiFetch) c.set("aiFetch", options.aiFetch);
    c.header("X-Request-Id", requestId);
    const started = Date.now();
    await next();
    log("info", "http.request", {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - started,
    });
  });
  app.use("*", securityHeaders);
  app.use("/api/*", corsForAllowedOrigins);
  app.use("/api/*", originGuard);

  // Cổng cấu hình: staging/production thiếu cấu hình bắt buộc → 503 (không phục vụ dữ liệu).
  // Chỉ ghi TÊN biến vào log, không ghi giá trị.
  app.use("/api/*", async (c, next) => {
    if (c.req.path === "/api/health") return next();
    if ((c.env.APP_ENV ?? "development") === "development") return next();
    const problems = validateConfig(c.env);
    if (problems.length > 0) {
      log("error", "config.invalid", { names: problems.map((p) => p.name) });
      throw errors.unavailable("Hệ thống chưa được cấu hình đầy đủ");
    }
    return next();
  });

  app.get("/api/health", (c) => {
    const environment = c.env.APP_ENV ?? "development";
    return c.json({
      status: "ok",
      service: "timo-api",
      version: APP_VERSION,
      environment,
      configured: environment === "development" ? true : validateConfig(c.env).length === 0,
      time: new Date().toISOString(),
    });
  });

  app.route("/api/public", publicRoutes);
  app.route("/api/me", meRoutes);
  app.route("/api/setup", setupRoutes);
  app.route("/api/admin", adminRoutes);
  app.route("/api/admin/ai", adminAiRoutes);

  app.notFound((c) =>
    c.json({ error: { code: "not_found", message: "Đường dẫn không tồn tại" } }, 404),
  );

  app.onError((err, c) => {
    const requestId = c.var.requestId;
    if (err instanceof ApiError) {
      return c.json(
        {
          error: {
            code: err.code,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
          },
          requestId,
        },
        err.status,
      );
    }
    // Lỗi không lường trước: ghi log an toàn, không trả chi tiết nội bộ cho client.
    log("error", "http.unhandled_error", {
      requestId,
      path: c.req.path,
      name: err instanceof Error ? err.name : "unknown",
      message: err instanceof Error ? err.message.slice(0, 300) : "unknown",
    });
    return c.json(
      {
        error: { code: "internal_error", message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại." },
        requestId,
      },
      500,
    );
  });

  return app;
}
