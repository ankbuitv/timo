import { Hono } from "hono";
import * as s from "@timo/database/schema";
import { and, eq, sql } from "drizzle-orm";
import { bootstrapSchema } from "@timo/validation";
import type { AppBindings } from "../middleware/auth.js";
import { loadOrProvisionUser, bearerToken, getVerifier } from "../middleware/auth.js";
import { BOOTSTRAP_SETTING_KEY } from "../middleware/constants.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { ApiError, errors } from "../lib/errors.js";
import { log } from "../lib/logger.js";
import { writeAudit } from "../lib/audit.js";
import { fetchSupabaseUser } from "../lib/supabase-user.js";
import { now } from "../lib/db.js";

export const setupRoutes = new Hono<AppBindings>();

/** So sánh hằng-thời-gian cho chuỗi bí mật (băm SHA-256 trước để độ dài không rò rỉ). */
export async function timingSafeEqualString(a: string, b: string): Promise<boolean> {
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

setupRoutes.get("/status", async (c) => {
  const row = await c.var.db
    .select({ key: s.systemSettings.key })
    .from(s.systemSettings)
    .where(eq(s.systemSettings.key, BOOTSTRAP_SETTING_KEY))
    .get();
  return c.json({ data: { initialized: !!row } });
});

async function denied(
  c: { var: AppBindings["Variables"]; req: { header: (n: string) => string | undefined } },
  reason: string,
  userId: string | null,
  message: string,
): Promise<never> {
  log("warn", "bootstrap.denied", { reason, userId });
  await writeAudit(c.var.db, {
    actorId: userId,
    action: "bootstrap.denied",
    entityType: "system",
    entityId: BOOTSTRAP_SETTING_KEY,
    metadata: { reason },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  throw errors.forbidden(message);
}

/**
 * Khởi tạo Super Admin (một lần). Mọi điều kiện phải đúng:
 *  1. Access token hợp lệ (JWKS, issuer, audience, exp).
 *  2. Supabase xác nhận token còn hiệu lực, tài khoản không bị khóa, email ĐÃ XÁC MINH.
 *  3. Email trùng INITIAL_ADMIN_EMAIL.
 *  4. SETUP_SECRET (≥32 ký tự) khớp, so sánh hằng-thời-gian.
 *  5. Tài khoản local ở trạng thái active.
 *  6. Chưa từng bootstrap: cờ + cấp quyền ghi trong MỘT batch (transaction D1).
 * Mọi lần từ chối được ghi audit (không ghi secret).
 */
setupRoutes.post("/bootstrap", rateLimit("bootstrap"), async (c) => {
  const token = bearerToken(c.req.header("Authorization"));
  if (!token) throw errors.unauthorized();
  const verified = await (c.var.verifier ?? getVerifier(c.env)).verify(token).catch(() => {
    throw errors.unauthorized("Phiên đăng nhập không hợp lệ");
  });

  const configuredSecret = c.env.SETUP_SECRET ?? "";
  const adminEmail = (c.env.INITIAL_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const anonKey = c.env.SUPABASE_ANON_KEY ?? "";
  if (configuredSecret.length < 32 || !adminEmail || !c.env.SUPABASE_URL || !anonKey) {
    throw errors.unavailable(
      "Chưa cấu hình đầy đủ SETUP_SECRET, INITIAL_ADMIN_EMAIL, SUPABASE_URL, SUPABASE_ANON_KEY",
    );
  }

  const body = await c.req.json().catch(() => null);
  const parsed = bootstrapSchema.safeParse(body);
  if (!parsed.success) throw errors.badRequest("Dữ liệu cài đặt không hợp lệ");

  // (2) Nguồn sự thật từ Supabase.
  const remote = await fetchSupabaseUser({
    supabaseUrl: c.env.SUPABASE_URL,
    anonKey,
    accessToken: token,
    fetchImpl: c.var.supabaseFetch,
  });
  if (!remote || remote.id !== verified.id) {
    await denied(
      c,
      "remote_verification_failed",
      verified.id,
      "Không thể xác minh tài khoản với Supabase",
    );
  }
  if (!remote!.emailConfirmedAt) {
    await denied(c, "email_not_verified", verified.id, "Email của tài khoản chưa được xác minh");
  }
  if (remote!.bannedUntil && Date.parse(remote!.bannedUntil) > Date.now()) {
    await denied(c, "account_banned", verified.id, "Tài khoản đang bị khóa");
  }

  // (3) Email phải khớp cấu hình (lấy từ Supabase, không từ client).
  if ((remote!.email ?? "") !== adminEmail) {
    await denied(
      c,
      "email_mismatch",
      verified.id,
      "Tài khoản không phải quản trị viên được chỉ định",
    );
  }

  // (4) Bí mật cài đặt.
  const secretOk = await timingSafeEqualString(parsed.data.setupSecret, configuredSecret);
  if (!secretOk) await denied(c, "invalid_secret", verified.id, "Không thể khởi tạo quản trị viên");

  // (5) Hồ sơ local phải active.
  const auth = await loadOrProvisionUser(c.var.db, verified);
  if (auth.status !== "active")
    await denied(c, "profile_inactive", verified.id, "Tài khoản không ở trạng thái hoạt động");

  const superAdminRole = await c.var.db
    .select({ id: s.roles.id })
    .from(s.roles)
    .where(eq(s.roles.key, "super_admin"))
    .get();
  if (!superAdminRole) throw errors.unavailable("Thiếu vai trò super_admin – kiểm tra migration");

  // (6) Một transaction: ghi cờ (chỉ thành công nếu chưa có) và cấp quyền chỉ khi cờ vừa được ghi bởi chính người này.
  const ts = now();
  const claimValue = { by: auth.userId, at: ts };
  const results = await c.var.db.batch([
    c.var.db
      .insert(s.systemSettings)
      .values({ key: BOOTSTRAP_SETTING_KEY, value: claimValue, updatedAt: ts })
      .onConflictDoNothing(),
    c.var.db
      .insert(s.userRoles)
      .select(
        c.var.db
          .select({
            userId: sql<string>`${auth.userId}`.as("user_id"),
            roleId: sql<string>`${superAdminRole.id}`.as("role_id"),
            grantedBy: sql<string | null>`NULL`.as("granted_by"),
            createdAt: sql<number>`${ts}`.as("created_at"),
          })
          .from(s.systemSettings)
          .where(
            and(
              eq(s.systemSettings.key, BOOTSTRAP_SETTING_KEY),
              sql`json_extract(${s.systemSettings.value}, '$.by') = ${auth.userId}`,
            ),
          )
          .limit(1),
      )
      .onConflictDoNothing(),
  ]);
  const claimChanges = (results[0] as { meta: { changes: number } }).meta.changes;
  if (claimChanges === 0) {
    throw new ApiError("conflict", "Hệ thống đã được khởi tạo trước đó");
  }

  await writeAudit(c.var.db, {
    actorId: auth.userId,
    action: "bootstrap.completed",
    entityType: "system",
    entityId: BOOTSTRAP_SETTING_KEY,
    metadata: { role: "super_admin" },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  log("info", "bootstrap.completed", { userId: auth.userId });
  return c.json({ data: { initialized: true, role: "super_admin" } }, 201);
});
