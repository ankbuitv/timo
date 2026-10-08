/**
 * Router gọi Ollama Cloud với nhiều khóa API.
 *
 * Nguyên tắc (đã chốt trong đặc tả):
 * - Failover CÓ GIỚI HẠN: tối đa `maxAttempts` lần thử, không retry vô hạn.
 * - 429 (hết hạn mức) KHÔNG chuyển sang khóa khác – dùng nhiều khóa để vượt quota nhà cung cấp
 *   là hành vi bị cấm. Trả lỗi để lớp gọi quyết định (hiển thị trạng thái, chờ, hoặc báo admin).
 * - Lỗi 4xx khác (400/404/422) trả về ngay: thử lại chỉ lặp lại cùng một lỗi.
 * - 401/403 (khóa sai/hết hiệu lực) và 5xx/lỗi mạng được phép chuyển khóa khác, có backoff.
 * - Thao tác gửi chat không idempotent nên không tự động thử lại trên CÙNG một khóa sau khi
 *   nhà cung cấp đã trả lời; chỉ chuyển khóa khi lần gọi trước thất bại hoàn toàn.
 * - Ghi usage theo khóa/ngày để admin theo dõi; giới hạn theo ngày được kiểm tra trước khi gọi.
 */
import * as s from "@timo/database/schema";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import type { Db } from "./db.js";
import { now } from "./db.js";
import { decryptSecret } from "./ai-crypto.js";
import { aiEndpoint } from "./ai-endpoint.js";
import { errors } from "./errors.js";
import { log } from "./logger.js";

export interface RouterSettings {
  failoverEnabled: boolean;
  maxAttempts: number;
  backoffBaseMs: number;
  timeoutMs: number;
  defaultModel: string | null;
}

export const DEFAULT_ROUTER_SETTINGS: RouterSettings = {
  failoverEnabled: true,
  maxAttempts: 3,
  backoffBaseMs: 250,
  timeoutMs: 30_000,
  defaultModel: null,
};

const SETTINGS_KEY = "ai.router";
const MAX_ATTEMPTS_LIMIT = 5;

export function utcDay(at: number = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10);
}

export async function getRouterSettings(db: Db): Promise<RouterSettings> {
  const row = await db
    .select()
    .from(s.systemSettings)
    .where(eq(s.systemSettings.key, SETTINGS_KEY))
    .get();
  const value = (row?.value ?? {}) as Partial<RouterSettings>;
  return {
    failoverEnabled: value.failoverEnabled ?? DEFAULT_ROUTER_SETTINGS.failoverEnabled,
    maxAttempts: clampAttempts(value.maxAttempts ?? DEFAULT_ROUTER_SETTINGS.maxAttempts),
    backoffBaseMs: value.backoffBaseMs ?? DEFAULT_ROUTER_SETTINGS.backoffBaseMs,
    timeoutMs: value.timeoutMs ?? DEFAULT_ROUTER_SETTINGS.timeoutMs,
    defaultModel: value.defaultModel ?? null,
  };
}

export async function saveRouterSettings(
  db: Db,
  settings: RouterSettings,
): Promise<RouterSettings> {
  const value: RouterSettings = { ...settings, maxAttempts: clampAttempts(settings.maxAttempts) };
  await db
    .insert(s.systemSettings)
    .values({ key: SETTINGS_KEY, value, updatedAt: now() })
    .onConflictDoUpdate({ target: s.systemSettings.key, set: { value, updatedAt: now() } });
  return value;
}

function clampAttempts(value: number): number {
  const n = Math.trunc(value);
  if (!Number.isFinite(n)) return DEFAULT_ROUTER_SETTINGS.maxAttempts;
  return Math.min(Math.max(n, 1), MAX_ATTEMPTS_LIMIT);
}

export type AiKeyRow = typeof s.aiApiKeys.$inferSelect;

export interface AttemptRecord {
  keyId: string;
  keyName: string;
  outcome:
    | "success"
    | "rate_limited"
    | "auth_error"
    | "provider_error"
    | "network_error"
    | "daily_limit"
    | "decrypt_error"
    | "timeout";
  status?: number;
  message?: string;
}

export type ChatFailureCode =
  "no_keys" | "not_configured" | "rate_limited" | "bad_request" | "all_failed";

export interface ChatSuccess {
  ok: true;
  content: string;
  model: string;
  keyId: string;
  keyName: string;
  attempts: AttemptRecord[];
  latencyMs: number;
}

export interface ChatFailure {
  ok: false;
  code: ChatFailureCode;
  message: string;
  attempts: AttemptRecord[];
  retryAfterSeconds?: number;
}

export interface ChatOptions {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string | null;
  /** Ghi đè cho kiểm thử. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  encryptionKey?: string | undefined;
  requestTimeoutMs?: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Danh sách khóa khả dụng theo thứ tự ưu tiên (số nhỏ trước), bỏ khóa đã tắt. */
export async function orderedKeys(db: Db, includeDisabled = false): Promise<AiKeyRow[]> {
  const rows = includeDisabled
    ? await db
        .select()
        .from(s.aiApiKeys)
        .orderBy(asc(s.aiApiKeys.priority), asc(s.aiApiKeys.createdAt))
    : await db
        .select()
        .from(s.aiApiKeys)
        .where(eq(s.aiApiKeys.isEnabled, true))
        .orderBy(asc(s.aiApiKeys.priority), asc(s.aiApiKeys.createdAt));
  return rows;
}

export async function usageFor(
  db: Db,
  keyId: string,
  day: string,
): Promise<{ requests: number; failures: number } | null> {
  const row = await db
    .select({ requests: s.aiUsageDaily.requests, failures: s.aiUsageDaily.failures })
    .from(s.aiUsageDaily)
    .where(and(eq(s.aiUsageDaily.keyId, keyId), eq(s.aiUsageDaily.day, day)))
    .get();
  return row ?? null;
}

export async function recordUsage(
  db: Db,
  keyId: string,
  day: string,
  delta: { requests?: number; failures?: number; promptTokens?: number; completionTokens?: number },
): Promise<void> {
  const values = {
    requests: delta.requests ?? 0,
    failures: delta.failures ?? 0,
    promptTokens: delta.promptTokens ?? 0,
    completionTokens: delta.completionTokens ?? 0,
  };
  await db
    .insert(s.aiUsageDaily)
    .values({ keyId, day, ...values, updatedAt: now() })
    .onConflictDoUpdate({
      target: [s.aiUsageDaily.keyId, s.aiUsageDaily.day],
      set: {
        requests: sql`${s.aiUsageDaily.requests} + ${values.requests}`,
        failures: sql`${s.aiUsageDaily.failures} + ${values.failures}`,
        promptTokens: sql`${s.aiUsageDaily.promptTokens} + ${values.promptTokens}`,
        completionTokens: sql`${s.aiUsageDaily.completionTokens} + ${values.completionTokens}`,
        updatedAt: now(),
      },
    });
}

/** Tin nhắn lỗi an toàn: cắt ngắn, gộp khoảng trắng, không chứa khóa. */
function safeMessage(input: unknown): string {
  const text = typeof input === "string" ? input : "";
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gửi yêu cầu chat qua router nhiều khóa. Trả về kết quả hoặc lỗi mô tả được,
 * kèm vết các lần thử để admin chẩn đoán.
 */
export async function chatWithFailover(
  db: Db,
  env: { AI_ALLOWED_HOSTS?: string; TIMO_AI_ENCRYPTION_KEY?: string },
  options: ChatOptions,
): Promise<ChatSuccess | ChatFailure> {
  const settings = await getRouterSettings(db);
  const keys = await orderedKeys(db);
  const attempts: AttemptRecord[] = [];
  const day = utcDay();

  if (keys.length === 0) {
    return {
      ok: false,
      code: "no_keys",
      message: "Chưa có khóa AI nào được bật. Vào Quản trị → AI để thêm khóa.",
      attempts,
    };
  }

  const model = options.model ?? settings.defaultModel ?? null;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const timeoutMs = options.requestTimeoutMs ?? settings.timeoutMs;
  const encryptionKey = options.encryptionKey ?? env.TIMO_AI_ENCRYPTION_KEY;
  const limit = settings.failoverEnabled ? Math.min(settings.maxAttempts, keys.length) : 1;

  let attemptIndex = 0;
  for (const key of keys) {
    if (attemptIndex >= limit) break;

    const keyModel = key.model ?? model;
    if (!keyModel) {
      attempts.push({
        keyId: key.id,
        keyName: key.name,
        outcome: "decrypt_error",
        message: "Chưa chọn model cho khóa và chưa có model mặc định",
      });
      continue;
    }

    if (key.dailyRequestLimit > 0) {
      const used = await usageFor(db, key.id, day);
      if ((used?.requests ?? 0) >= key.dailyRequestLimit) {
        attempts.push({
          keyId: key.id,
          keyName: key.name,
          outcome: "daily_limit",
          message: "Đã đạt giới hạn yêu cầu trong ngày của khóa này",
        });
        continue;
      }
    }

    let secret: string;
    try {
      secret = await decryptSecret(key, encryptionKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không giải mã được khóa";
      attempts.push({ keyId: key.id, keyName: key.name, outcome: "decrypt_error", message });
      continue;
    }

    attemptIndex += 1;
    const started = Date.now();
    let response: Response;
    try {
      response = await fetchWithTimeout(
        fetchImpl,
        aiEndpoint(key.baseUrl, "/chat"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
          body: JSON.stringify({ model: keyModel, messages: options.messages, stream: false }),
        },
        timeoutMs,
      );
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      const message = aborted
        ? `Hết thời gian chờ ${timeoutMs}ms`
        : safeMessage(err instanceof Error ? err.message : "Lỗi mạng");
      attempts.push({
        keyId: key.id,
        keyName: key.name,
        outcome: aborted ? "timeout" : "network_error",
        message,
      });
      await markFailure(db, key.id, message);
      await recordUsage(db, key.id, day, { requests: 1, failures: 1 });
      if (attemptIndex >= limit) break;
      await sleep(backoffMs(settings, attemptIndex));
      continue;
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "");
      const message = "Nhà cung cấp báo hết hạn mức (429). Hệ thống không chuyển sang khóa khác.";
      attempts.push({
        keyId: key.id,
        keyName: key.name,
        outcome: "rate_limited",
        status: 429,
        message,
      });
      await markFailure(db, key.id, message);
      await recordUsage(db, key.id, day, { requests: 1, failures: 1 });
      return {
        ok: false,
        code: "rate_limited",
        message,
        attempts,
        ...(Number.isFinite(retryAfter) && retryAfter > 0 ? { retryAfterSeconds: retryAfter } : {}),
      };
    }

    if (response.status === 401 || response.status === 403) {
      const message = `Khóa bị từ chối (HTTP ${response.status}). Kiểm tra lại hoặc xoay khóa.`;
      attempts.push({
        keyId: key.id,
        keyName: key.name,
        outcome: "auth_error",
        status: response.status,
        message,
      });
      await markFailure(db, key.id, message);
      await recordUsage(db, key.id, day, { requests: 1, failures: 1 });
      if (attemptIndex >= limit) break;
      await sleep(backoffMs(settings, attemptIndex));
      continue;
    }

    if (response.status >= 500) {
      const message = `Nhà cung cấp lỗi máy chủ (HTTP ${response.status})`;
      attempts.push({
        keyId: key.id,
        keyName: key.name,
        outcome: "provider_error",
        status: response.status,
        message,
      });
      await markFailure(db, key.id, message);
      await recordUsage(db, key.id, day, { requests: 1, failures: 1 });
      if (attemptIndex >= limit) break;
      await sleep(backoffMs(settings, attemptIndex));
      continue;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const message = `Yêu cầu không hợp lệ (HTTP ${response.status})${body ? `: ${safeMessage(body)}` : ""}`;
      attempts.push({
        keyId: key.id,
        keyName: key.name,
        outcome: "provider_error",
        status: response.status,
        message,
      });
      await markFailure(db, key.id, message);
      await recordUsage(db, key.id, day, { requests: 1, failures: 1 });
      return { ok: false, code: "bad_request", message, attempts };
    }

    const payload = (await response.json().catch(() => null)) as {
      message?: { content?: unknown };
      prompt_eval_count?: unknown;
      eval_count?: unknown;
    } | null;
    const content = typeof payload?.message?.content === "string" ? payload.message.content : "";
    if (!content) {
      const message = "Nhà cung cấp trả về dữ liệu rỗng hoặc sai định dạng";
      attempts.push({
        keyId: key.id,
        keyName: key.name,
        outcome: "provider_error",
        status: response.status,
        message,
      });
      await markFailure(db, key.id, message);
      await recordUsage(db, key.id, day, { requests: 1, failures: 1 });
      return { ok: false, code: "bad_request", message, attempts };
    }

    attempts.push({
      keyId: key.id,
      keyName: key.name,
      outcome: "success",
      status: response.status,
    });
    await db
      .update(s.aiApiKeys)
      .set({ lastSuccessAt: now(), lastCheckedAt: now(), lastErrorMessage: null, updatedAt: now() })
      .where(eq(s.aiApiKeys.id, key.id));
    await recordUsage(db, key.id, day, {
      requests: 1,
      promptTokens: Number(payload?.prompt_eval_count) || 0,
      completionTokens: Number(payload?.eval_count) || 0,
    });
    return {
      ok: true,
      content,
      model: keyModel,
      keyId: key.id,
      keyName: key.name,
      attempts,
      latencyMs: Date.now() - started,
    };
  }

  const last = attempts[attempts.length - 1];
  return {
    ok: false,
    code: "all_failed",
    message:
      last?.outcome === "daily_limit"
        ? "Tất cả khóa đã đạt giới hạn trong ngày hoặc đang tắt."
        : "Không khóa nào phản hồi thành công. Xem chi tiết ở cột trạng thái.",
    attempts,
  };
}

function backoffMs(settings: RouterSettings, attempt: number): number {
  const base = Math.max(0, settings.backoffBaseMs);
  return Math.min(base * 2 ** (attempt - 1), 5_000);
}

async function markFailure(db: Db, keyId: string, message: string): Promise<void> {
  await db
    .update(s.aiApiKeys)
    .set({ lastErrorAt: now(), lastErrorMessage: safeMessage(message), updatedAt: now() })
    .where(eq(s.aiApiKeys.id, keyId));
}

export interface ProbeResult {
  ok: boolean;
  status: number;
  message: string;
  models: string[];
  latencyMs: number;
}

/** Kiểm tra kết nối bằng GET /api/tags (không tiêu tốn quota sinh văn bản). */
export async function probeKey(
  env: { AI_ALLOWED_HOSTS?: string },
  key: AiKeyRow,
  secret: string,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<ProbeResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const started = Date.now();
  try {
    const response = await fetchWithTimeout(
      fetchImpl,
      aiEndpoint(key.baseUrl, "/tags"),
      { method: "GET", headers: { Authorization: `Bearer ${secret}` } },
      options.timeoutMs ?? 10_000,
    );
    const latencyMs = Date.now() - started;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `HTTP ${response.status} khi kiểm tra kết nối`,
        models: [],
        latencyMs,
      };
    }
    const payload = (await response.json().catch(() => null)) as {
      models?: { name?: unknown; model?: unknown }[];
    } | null;
    const models = (payload?.models ?? [])
      .map((m) =>
        typeof m?.name === "string" ? m.name : typeof m?.model === "string" ? m.model : "",
      )
      .filter(Boolean)
      .slice(0, 50);
    return {
      ok: true,
      status: response.status,
      message: `Kết nối thành công, ${models.length} model`,
      models,
      latencyMs,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      status: 0,
      message: aborted ? "Hết thời gian chờ khi kiểm tra kết nối" : safeMessage(`${err}`),
      models: [],
      latencyMs: Date.now() - started,
    };
  }
}

/** Tổng hợp mức sẵn sàng của từng khóa để hiển thị bảng điều khiển (không lộ bí mật). */
export type KeyAvailability = "ok" | "error" | "unknown" | "disabled";

export function availabilityOf(key: AiKeyRow): KeyAvailability {
  if (!key.isEnabled) return "disabled";
  if (key.lastSuccessAt && (!key.lastErrorAt || key.lastSuccessAt >= key.lastErrorAt)) return "ok";
  if (key.lastErrorAt) return "error";
  return "unknown";
}

export async function usageSummary(
  db: Db,
  days: number,
): Promise<
  {
    keyId: string;
    day: string;
    requests: number;
    failures: number;
    promptTokens: number;
    completionTokens: number;
  }[]
> {
  const since = utcDay(Date.now() - (days - 1) * 86_400_000);
  return db
    .select({
      keyId: s.aiUsageDaily.keyId,
      day: s.aiUsageDaily.day,
      requests: s.aiUsageDaily.requests,
      failures: s.aiUsageDaily.failures,
      promptTokens: s.aiUsageDaily.promptTokens,
      completionTokens: s.aiUsageDaily.completionTokens,
    })
    .from(s.aiUsageDaily)
    .where(gte(s.aiUsageDaily.day, since))
    .orderBy(desc(s.aiUsageDaily.day), asc(s.aiUsageDaily.keyId))
    .limit(500);
}

/** Đảm bảo cấu hình mã hóa tồn tại trước khi thao tác với bí mật. */
export function requireEncryptionKey(env: { TIMO_AI_ENCRYPTION_KEY?: string }): string {
  if (!env.TIMO_AI_ENCRYPTION_KEY?.trim()) {
    log("error", "ai.encryption_key_missing", {});
    throw errors.unavailable(
      "Chưa đặt TIMO_AI_ENCRYPTION_KEY (Worker secret). Xem docs/AI_KEYS.md để tạo và đặt khóa.",
    );
  }
  return env.TIMO_AI_ENCRYPTION_KEY;
}
