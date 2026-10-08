import { describe, expect, it } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { AuthError, createSupabaseJwtVerifier } from "../src/index.js";

const SUPABASE_URL = "https://example.supabase.co";
const USER_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

async function setup() {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "ES256", use: "sig" };
  const verifier = createSupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL }, { jwks: [jwk] });
  const sign = (
    claims: Record<string, unknown>,
    opts: { exp?: string; iss?: string; aud?: string } = {},
  ) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "ES256", kid: "k1" })
      .setIssuer(opts.iss ?? `${SUPABASE_URL}/auth/v1`)
      .setAudience(opts.aud ?? "authenticated")
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? "5m")
      .sign(privateKey);
  return { verifier, sign };
}

describe("createSupabaseJwtVerifier", () => {
  it("accepts a valid token and returns the stable user id", async () => {
    const { verifier, sign } = await setup();
    const token = await sign({ sub: USER_ID, email: "Student@Example.com", role: "authenticated" });
    const user = await verifier.verify(token);
    expect(user.id).toBe(USER_ID);
    expect(user.email).toBe("student@example.com");
  });

  it("rejects an empty token", async () => {
    const { verifier } = await setup();
    await expect(verifier.verify("")).rejects.toMatchObject({ reason: "missing_token" });
  });

  it("rejects expired tokens", async () => {
    const { verifier, sign } = await setup();
    const token = await sign({ sub: USER_ID }, { exp: "-1h" });
    await expect(verifier.verify(token)).rejects.toMatchObject({ reason: "expired_token" });
  });

  it("rejects tokens from another issuer", async () => {
    const { verifier, sign } = await setup();
    const token = await sign({ sub: USER_ID }, { iss: "https://evil.example/auth/v1" });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(AuthError);
  });

  it("rejects tokens with a non-UUID subject", async () => {
    const { verifier, sign } = await setup();
    const token = await sign({ sub: "not-a-uuid" });
    await expect(verifier.verify(token)).rejects.toMatchObject({ reason: "invalid_token" });
  });

  it("rejects tokens signed by an unknown key", async () => {
    const { verifier } = await setup();
    const other = await generateKeyPair("ES256");
    const token = await new SignJWT({ sub: USER_ID })
      .setProtectedHeader({ alg: "ES256", kid: "k1" })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience("authenticated")
      .setExpirationTime("5m")
      .sign(other.privateKey);
    await expect(verifier.verify(token)).rejects.toMatchObject({ reason: "invalid_token" });
  });
});
