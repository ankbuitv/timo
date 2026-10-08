/**
 * Hỏi Supabase Auth về người dùng bằng chính access token (GET /auth/v1/user).
 * Đây là nguồn sự thật cho: token còn hiệu lực, chưa bị thu hồi, tài khoản không bị khóa,
 * và email đã được xác minh (email_confirmed_at). Access token đã ký không chứa đủ các thông tin này.
 */
export interface SupabaseUserInfo {
  id: string;
  email: string | null;
  emailConfirmedAt: string | null;
  bannedUntil: string | null;
}

export async function fetchSupabaseUser(opts: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<SupabaseUserInfo | null> {
  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);
  try {
    const res = await doFetch(`${opts.supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: opts.anonKey,
        Authorization: `Bearer ${opts.accessToken}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body.id !== "string") return null;
    return {
      id: body.id,
      email: typeof body.email === "string" ? body.email.toLowerCase() : null,
      emailConfirmedAt:
        typeof body.email_confirmed_at === "string" ? body.email_confirmed_at : null,
      bannedUntil: typeof body.banned_until === "string" ? body.banned_until : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
