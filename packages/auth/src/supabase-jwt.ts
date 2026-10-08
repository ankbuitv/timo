import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, type JWK, type JWTPayload } from "jose";

export interface SupabaseAuthConfig {
  /** Ví dụ: https://<project-ref>.supabase.co */
  supabaseUrl: string;
  /** Tên issuer mong đợi, mặc định: `${supabaseUrl}/auth/v1` */
  issuer?: string;
  /** Audience mong đợi của Supabase là "authenticated". */
  audience?: string;
}

export interface VerifiedUser {
  /** UUID ổn định của Supabase Auth – dùng làm khóa liên kết giữa các dịch vụ TIMO. */
  id: string;
  email: string | null;
  role: string | null;
  claims: JWTPayload;
}

export type AuthFailureReason =
  "missing_token" | "invalid_token" | "expired_token" | "config_error";

export class AuthError extends Error {
  constructor(
    public readonly reason: AuthFailureReason,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface SupabaseJwtVerifier {
  verify(token: string): Promise<VerifiedUser>;
}

/**
 * Tạo bộ xác thực JWT của Supabase bằng JWKS (khóa bất đối xứng).
 * Dùng `createRemoteJWKSet` có cache trong isolate; có thể truyền `jwks` khi kiểm thử.
 */
export function createSupabaseJwtVerifier(
  config: SupabaseAuthConfig,
  options: { jwks?: JWK[] } = {},
): SupabaseJwtVerifier {
  const base = config.supabaseUrl.replace(/\/+$/, "");
  const issuer = config.issuer ?? `${base}/auth/v1`;
  const audience = config.audience ?? "authenticated";
  const keySet = options.jwks
    ? createLocalJWKSet({ keys: options.jwks })
    : createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`), {
        cooldownDuration: 30_000,
        cacheMaxAge: 10 * 60_000,
      });

  return {
    async verify(token: string): Promise<VerifiedUser> {
      if (!token) throw new AuthError("missing_token", "Thiếu token xác thực");
      let payload: JWTPayload;
      try {
        const result = await jwtVerify(token, keySet, {
          issuer,
          audience,
          algorithms: ["RS256", "ES256", "EdDSA"],
          clockTolerance: 5,
        });
        payload = result.payload;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "ERR_JWT_EXPIRED")
          throw new AuthError("expired_token", "Phiên đăng nhập đã hết hạn");
        throw new AuthError("invalid_token", "Token xác thực không hợp lệ");
      }
      const sub = typeof payload.sub === "string" ? payload.sub : "";
      if (!/^[0-9a-f-]{36}$/i.test(sub)) {
        throw new AuthError("invalid_token", "Token thiếu định danh người dùng hợp lệ");
      }
      const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
      const role = typeof payload.role === "string" ? payload.role : null;
      return { id: sub, email, role, claims: payload };
    },
  };
}
