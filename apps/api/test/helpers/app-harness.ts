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

export interface RemoteUserState {
  emailConfirmedAt: string | null;
  bannedUntil: string | null;
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

  /** Trạng thái người dùng "phía Supabase" mô phỏng cho GET /auth/v1/user. */
  const remoteByToken = new Map<string, { id: string; email: string } & RemoteUserState>();
  const supabaseFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const auth = new Headers(init?.headers).get("Authorization") ?? "";
    const token = auth.replace(/^Bearer /, "");
    const remote = remoteByToken.get(token);
    if (!url.endsWith("/auth/v1/user") || !remote) {
      return new Response(JSON.stringify({ message: "invalid" }), { status: 401 });
    }
    return new Response(
      JSON.stringify({
        id: remote.id,
        email: remote.email,
        email_confirmed_at: remote.emailConfirmedAt,
        banned_until: remote.bannedUntil,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const env: Env = {
    DB: d1 as unknown as D1Database,
    APP_ENV: "development",
    SUPABASE_URL,
    SUPABASE_ANON_KEY: "test-anon-key",
    ALLOWED_ORIGINS: "https://timovn.test",
    INITIAL_ADMIN_EMAIL: ADMIN_EMAIL,
    SETUP_SECRET,
  };

  const app = createApp({
    verifier,
    supabaseFetch,
    createDb: (e) => createDb(e),
  });

  async function makeUser(
    email: string,
    id: string,
    remote: Partial<RemoteUserState> = {},
  ): Promise<TestUser> {
    const state: RemoteUserState = {
      emailConfirmedAt: "2026-01-01T00:00:00Z",
      bannedUntil: null,
      ...remote,
    };
    const token = await new SignJWT({ sub: id, email, role: "authenticated" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience("authenticated")
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(privateKey);
    remoteByToken.set(token, { id, email, ...state });
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
    supabaseFetch,
    verifiedUser: (id: string, email: string): VerifiedUser => ({
      id,
      email,
      role: "authenticated",
      claims: {},
    }),
  };
}
