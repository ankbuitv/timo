import { Hono } from "hono";
import * as s from "@timo/database/schema";
import { eq } from "drizzle-orm";
import { bootstrapSchema } from "@timo/validation";
import type { AppBindings } from "../middleware/auth.js";
import { loadOrProvisionUser, bearerToken, getVerifier } from "../middleware/auth.js";
import { BOOTSTRAP_SETTING_KEY } from "../middleware/constants.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { ApiError, errors } from "../lib/errors.js";
import { log } from "../lib/logger.js";
import { writeAudit } from "../lib/audit.js";
import { now } from "../lib/db.js";

export const setupRoutes = new Hono<AppBindings>();

/** So sánh hằng-thời-gian cho chuỗi bí mật (băm SHA-256 trước để độ dài không rò rỉ). */
async function timingSafeEqualString(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i]! ^ vb[i]!;
  return diff === 0;
}

/**
 * Trạng thái bootstrap (công khai, không lộ thông tin nhạy cảm).
 */
setupRoutes.get("/status", async (c) => {
  const row = await c.var.db
    .select({ key: s.systemSettings.key })
    .from(s.systemSettings)
    .where(eq(s.systemSettings.key, BOOTSTRAP_SETTING_KEY))
    .get();
  return c.json({ data: { initialized: !!row } });
});

/**
 * Khởi tạo quản trị viên đầu tiên – CHỈ CHẠY MỘT LẦN.
 * Điều kiện:
 *  1. Người gọi đăng nhập bằng Supabase Auth.
 *  2. Email trùng với INITIAL_ADMIN_EMAIL (cấu hình biến môi trường).
 *  3. Body chứa SETUP_SECRET đúng (Cloudflare Secret).
 *  4. Chưa từng bootstrap (ghi nhận bằng system_settings, INSERT ... ON CONFLICT DO NOTHING).
 */
setupRoutes.post(
  "/bootstrap",
  rateLimit("bootstrap"),
  async (c, next) => {
    // Xác thực người gọi trước để không tiết lộ trạng thái cho người lạ.
    const token = bearerToken(c.req.header("Authorization"));
    if (!token) throw errors.unauthorized();
    const verified = await (c.var.verifier ?? getVerifier(c.env)).verify(token).catch(() => {
      throw errors.unauthorized("Phiên đăng nhập không hợp lệ");
    });
    c.set("auth", await loadOrProvisionUser(c.var.db, verified));
    await next();
  },
  async (c) => {
    const auth = c.var.auth!;
    const configuredSecret = c.env.SETUP_SECRET ?? "";
    const adminEmail = (c.env.INITIAL_ADMIN_EMAIL ?? "").trim().toLowerCase();
    if (configuredSecret.length < 32 || !adminEmail) {
      throw errors.unavailable("Chưa cấu hình SETUP_SECRET hoặc INITIAL_ADMIN_EMAIL");
    }

    const body = await c.req.json().catch(() => null);
    const parsed = bootstrapSchema.safeParse(body);
    if (!parsed.success) throw errors.badRequest("Dữ liệu cài đặt không hợp lệ");

    const secretOk = await timingSafeEqualString(parsed.data.setupSecret, configuredSecret);
    if (!secretOk) {
      log("warn", "bootstrap.invalid_secret", { userId: auth.userId });
      throw errors.forbidden("Không thể khởi tạo quản trị viên");
    }
    if ((auth.email ?? "").toLowerCase() !== adminEmail) {
      log("warn", "bootstrap.email_mismatch", { userId: auth.userId });
      throw errors.forbidden("Tài khoản không phải quản trị viên được chỉ định");
    }

    const superAdminRole = await c.var.db
      .select({ id: s.roles.id })
      .from(s.roles)
      .where(eq(s.roles.key, "super_admin"))
      .get();
    if (!superAdminRole) throw errors.unavailable("Thiếu vai trò super_admin – kiểm tra migration");

    // Ghi cờ một lần. Nếu hàng đã tồn tại, changes = 0 và bootstrap bị từ chối.
    const ts = now();
    const claim = await c.var.db
      .insert(s.systemSettings)
      .values({ key: BOOTSTRAP_SETTING_KEY, value: { by: auth.userId, at: ts }, updatedAt: ts })
      .onConflictDoNothing()
      .run();
    if (claim.meta.changes === 0) {
      throw new ApiError("conflict", "Hệ thống đã được khởi tạo trước đó");
    }

    await c.var.db
      .insert(s.userRoles)
      .values({ userId: auth.userId, roleId: superAdminRole.id, createdAt: ts })
      .onConflictDoNothing();

    await writeAudit(c.var.db, {
      actorId: auth.userId,
      action: "bootstrap.completed",
      entityType: "system",
      entityId: BOOTSTRAP_SETTING_KEY,
      ip: c.req.header("CF-Connecting-IP") ?? null,
    });
    log("info", "bootstrap.completed", { userId: auth.userId });
    return c.json({ data: { initialized: true, role: "super_admin" } }, 201);
  },
);
