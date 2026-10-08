import { SignJWT, generateKeyPair, exportJWK, type JWK } from "jose";
import type { SupabaseJwtVerifier, VerifiedUser } from "@timo/auth";
import { createApp } from "../../src/app.js";
import type { Env } from "../../src/env.js";
import { createDb } from "../../src/lib/db.js";
import { FakeD1, applyMigrations } from "./d1-sqlite.js";

export const ADMIN_EMAIL = "admin@timo.test";
export const SETUP_SECRET = "0123456789abcdef0123456789abcdef-test";
export const SUPABASE_URL = "https://test-project.supabase.co";

export interface TestUser {
  id: string;
  email: string;
  token: string;
}

/** Tạo môi trường kiểm thử: D1 giả lập (migration thật), xác thực JWT thật (khóa cục bộ). */
export async function createTestHarness() {
  const d1 = new FakeD1();
  applyMigrations(d1);

  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: "test-key", alg: "ES256", use: "sig" };
  const { createSupabaseJwtVerifier } = await import("@timo/auth");
  const verifier: SupabaseJwtVerifier = createSupabaseJwtVerifier(
    { supabaseUrl: SUPABASE_URL },
    { jwks: [jwk] },
  );

  const env: Env = {
    DB: d1 as unknown as D1Database,
    APP_ENV: "development",
    SUPABASE_URL,
    ALLOWED_ORIGINS: "https://timovn.test",
    INITIAL_ADMIN_EMAIL: ADMIN_EMAIL,
    SETUP_SECRET,
  };

  const app = createApp({
    verifier,
    createDb: (e) => createDb(e),
  });

  async function makeUser(email: string, id: string): Promise<TestUser> {
    const token = await new SignJWT({ sub: id, email, role: "authenticated" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience("authenticated")
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(privateKey);
    return { id, email, token };
  }

  async function request(
    path: string,
    init: RequestInit & { token?: string; json?: unknown } = {},
  ) {
    const headers = new Headers(init.headers);
    if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
    let body = init.body;
    if (init.json !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(init.json);
    }
    return app.request(path, { ...init, headers, body }, env);
  }

  return {
    app,
    env,
    d1,
    request,
    makeUser,
    verifiedUser: (id: string, email: string): VerifiedUser => ({
      id,
      email,
      role: "authenticated",
      claims: {},
    }),
  };
}
