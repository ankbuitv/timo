import type { MiddlewareHandler } from "hono";
import * as s from "@timo/database/schema";
import { eq, inArray } from "drizzle-orm";
import { isSystemRole } from "@timo/shared";
import {
  AuthError,
  createSupabaseJwtVerifier,
  resolvePermissions,
  type SupabaseJwtVerifier,
  type VerifiedUser,
} from "@timo/auth";
import type { Env } from "../env.js";
import type { Db } from "../lib/db.js";
import { errors } from "../lib/errors.js";
import { log } from "../lib/logger.js";
import { now } from "../lib/db.js";
import { DEFAULT_ROLE_FOR_NEW_USERS } from "./constants.js";

export interface AuthContext {
  userId: string;
  email: string | null;
  displayName: string;
  status: "active" | "suspended" | "deleted";
  roles: string[];
  permissions: Set<string>;
}

export type AppVariables = {
  db: Db;
  auth?: AuthContext;
  verifier?: SupabaseJwtVerifier;
  supabaseFetch?: typeof fetch;
  requestId: string;
};

export type AppBindings = { Bindings: Env; Variables: AppVariables };

/** Lấy hoặc tạo bộ xác thực JWT (cache theo isolate). */
let cachedVerifier: { url: string; verifier: SupabaseJwtVerifier } | null = null;
export function getVerifier(env: Env): SupabaseJwtVerifier {
  const url = env.SUPABASE_URL?.trim();
  if (!url) throw errors.unavailable("Chưa cấu hình SUPABASE_URL");
  if (!cachedVerifier || cachedVerifier.url !== url) {
    cachedVerifier = { url, verifier: createSupabaseJwtVerifier({ supabaseUrl: url }) };
  }
  return cachedVerifier.verifier;
}

export function bearerToken(header: string | undefined): string {
  if (!header) return "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() ?? "";
}

/**
 * Tải hồ sơ + vai trò của người dùng từ D1. Nếu chưa có hồ sơ (lần đầu đăng nhập),
 * tạo hồ sơ và gán vai trò mặc định "student" (provisioning khi cần).
 */
export async function loadOrProvisionUser(db: Db, user: VerifiedUser): Promise<AuthContext> {
  const email = user.email ?? `${user.id}@unknown.invalid`;
  const existing = await db.select().from(s.profiles).where(eq(s.profiles.id, user.id)).get();

  let profile = existing;
  if (!profile) {
    const displayName =
      (user.email ?? "Người dùng TIMO").split("@")[0]?.slice(0, 60) || "Người dùng TIMO";
    const ts = now();
    await db
      .insert(s.profiles)
      .values({ id: user.id, email, displayName, createdAt: ts, updatedAt: ts })
      .onConflictDoNothing();
    const defaultRole = await db
      .select({ id: s.roles.id })
      .from(s.roles)
      .where(eq(s.roles.key, DEFAULT_ROLE_FOR_NEW_USERS))
      .get();
    if (defaultRole) {
      await db
        .insert(s.userRoles)
        .values({ userId: user.id, roleId: defaultRole.id, createdAt: ts })
        .onConflictDoNothing();
    }
    profile = await db.select().from(s.profiles).where(eq(s.profiles.id, user.id)).get();
  }
  if (!profile) throw errors.unavailable("Không thể tải hồ sơ người dùng");
  // Đồng bộ email nếu người dùng đã đổi email trên Supabase (email là khóa duy nhất).
  if (existing && user.email && existing.email !== user.email) {
    await db
      .update(s.profiles)
      .set({ email: user.email, updatedAt: now() })
      .where(eq(s.profiles.id, user.id));
    profile = { ...profile, email: user.email };
  }

  const roleRows = await db
    .select({ key: s.roles.key })
    .from(s.userRoles)
    .innerJoin(s.roles, eq(s.roles.id, s.userRoles.roleId))
    .where(eq(s.userRoles.userId, user.id));
  const roleKeys = roleRows.map((r) => r.key);

  const customKeys = roleKeys.filter((k) => !isSystemRole(k));
  const customPermissions: Record<string, string[]> = {};
  if (customKeys.length > 0) {
    const rows = await db
      .select({ key: s.roles.key, permKey: s.permissions.key })
      .from(s.roles)
      .innerJoin(s.rolePermissions, eq(s.rolePermissions.roleId, s.roles.id))
      .innerJoin(s.permissions, eq(s.permissions.id, s.rolePermissions.permissionId))
      .where(inArray(s.roles.key, customKeys));
    for (const r of rows) (customPermissions[r.key] ??= []).push(r.permKey);
  }

  return {
    userId: user.id,
    email: profile.email,
    displayName: profile.displayName,
    status: profile.status,
    roles: roleKeys,
    permissions: resolvePermissions(roleKeys, customPermissions),
  };
}

/** Bắt buộc đăng nhập. Xác thực JWT phía server, không tin cậy dữ liệu từ client. */
export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const token = bearerToken(c.req.header("Authorization"));
  if (!token) throw errors.unauthorized();
  let verified: VerifiedUser;
  try {
    const verifier = c.var.verifier ?? getVerifier(c.env);
    verified = await verifier.verify(token);
  } catch (err) {
    if (err instanceof AuthError) {
      log("warn", "auth.failed", {
        reason: err.reason,
        path: c.req.path,
        requestId: c.var.requestId,
      });
      throw errors.unauthorized(
        err.reason === "expired_token"
          ? "Phiên đăng nhập đã hết hạn"
          : "Phiên đăng nhập không hợp lệ",
      );
    }
    throw err;
  }
  const auth = await loadOrProvisionUser(c.var.db, verified);
  if (auth.status !== "active") {
    log("warn", "auth.inactive_account", { userId: auth.userId, status: auth.status });
    throw errors.forbidden("Tài khoản đang bị tạm khóa hoặc đã xóa");
  }
  c.set("auth", auth);
  await next();
};

/** Kiểm tra quyền phía server. Luôn dùng sau requireAuth. */
export function requirePermission(permission: string): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const auth = c.var.auth;
    if (!auth) throw errors.unauthorized();
    if (!auth.permissions.has(permission)) {
      log("warn", "authz.denied", { userId: auth.userId, permission, path: c.req.path });
      throw errors.forbidden();
    }
    await next();
  };
}
