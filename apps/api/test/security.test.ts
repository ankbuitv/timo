import { describe, expect, it } from "vitest";
import { createTestHarness, ADMIN_EMAIL } from "./helpers/app-harness.js";
import { validateConfig } from "../src/config.js";
import type { Env } from "../src/env.js";

const baseEnv = (over: Partial<Env> = {}): Env =>
  ({
    DB: {} as D1Database,
    APP_ENV: "production",
    SUPABASE_URL: "https://abcdefgh.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    ALLOWED_ORIGINS: "https://timovn.dpdns.org",
    PUBLIC_APP_URL: "https://timovn.dpdns.org",
    INITIAL_ADMIN_EMAIL: ADMIN_EMAIL,
    SETUP_SECRET: "x".repeat(40),
    SENSITIVE_RATE_LIMITER: { limit: async () => ({ success: true }) } as unknown as RateLimit,
    ...over,
  }) as Env;

describe("rate limit fail-closed", () => {
  it("returns 503 in production when the binding is missing (no silent bypass)", async () => {
    const h = await createTestHarness();
    const admin = await h.makeUser(ADMIN_EMAIL, "11111111-1111-4111-8111-111111111111");
    const res = await h.app.request(
      "/api/setup/bootstrap",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "1.2.3.4",
          Authorization: `Bearer ${admin.token}`,
        },
        body: "{}",
      },
      { ...h.env, APP_ENV: "production", SENSITIVE_RATE_LIMITER: undefined },
    );
    expect(res.status).toBe(503);
  });

  it("returns 503 when production configuration is incomplete (no PUBLIC_APP_URL)", async () => {
    const h = await createTestHarness();
    const res = await h.app.request(
      "/api/public/grades",
      { headers: { "CF-Connecting-IP": "1.2.3.4" } },
      {
        ...h.env,
        APP_ENV: "production",
        SENSITIVE_RATE_LIMITER: { limit: async () => ({ success: true }) } as unknown as RateLimit,
      },
    );
    expect(res.status).toBe(503);
    const health = await h.app.request("/api/health", {}, { ...h.env, APP_ENV: "production" });
    expect(((await health.json()) as { configured: boolean }).configured).toBe(false);
  });

  it("returns 429 when the limiter rejects the request", async () => {
    const h = await createTestHarness();
    const admin = await h.makeUser(ADMIN_EMAIL, "11111111-1111-4111-8111-111111111111");
    const res = await h.app.request(
      "/api/setup/bootstrap",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "1.2.3.4",
          Authorization: `Bearer ${admin.token}`,
        },
        body: "{}",
      },
      {
        ...h.env,
        SENSITIVE_RATE_LIMITER: { limit: async () => ({ success: false }) } as unknown as RateLimit,
      },
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("rejects a request without a Cloudflare client IP", async () => {
    const h = await createTestHarness();
    const admin = await h.makeUser(ADMIN_EMAIL, "11111111-1111-4111-8111-111111111111");
    const res = await h.app.request(
      "/api/setup/bootstrap",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin.token}` },
        body: "{}",
      },
      {
        ...h.env,
        APP_ENV: "production",
        PUBLIC_APP_URL: "https://timovn.test",
        SENSITIVE_RATE_LIMITER: { limit: async () => ({ success: true }) } as unknown as RateLimit,
      },
    );
    expect(res.status).toBe(429);
  });
});

describe("validateConfig", () => {
  it("accepts a complete production configuration", () => {
    expect(validateConfig(baseEnv())).toEqual([]);
  });

  it("flags a missing rate limiter binding in staging", () => {
    const names = validateConfig(
      baseEnv({ APP_ENV: "staging", SENSITIVE_RATE_LIMITER: undefined }),
    ).map((p) => p.name);
    expect(names).toContain("SENSITIVE_RATE_LIMITER");
  });

  it("flags a short SETUP_SECRET", () => {
    const names = validateConfig(baseEnv({ SETUP_SECRET: "short" })).map((p) => p.name);
    expect(names).toContain("SETUP_SECRET");
  });

  it("flags http origins and localhost in production", () => {
    const names = validateConfig(baseEnv({ ALLOWED_ORIGINS: "http://localhost:5173" })).map(
      (p) => p.name,
    );
    expect(names).toContain("ALLOWED_ORIGINS");
  });

  it("never echoes secret values in messages", () => {
    const secret = "SECRET-VALUE-SHOULD-NOT-APPEAR-123456789";
    const problems = validateConfig(
      baseEnv({ SETUP_SECRET: secret.slice(0, 10), SUPABASE_URL: "http://evil" }),
    );
    expect(JSON.stringify(problems)).not.toContain(secret.slice(0, 10));
  });
});
