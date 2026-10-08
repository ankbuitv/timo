/**
 * Quản trị khóa AI (Ollama Cloud) – CHỈ super_admin có quyền `ai:manage`.
 *
 * Bảo mật:
 * - Không endpoint nào trả về khóa nguyên văn; chỉ dạng che `••••••••XXXX`.
 * - Khóa được mã hóa AES-256-GCM trước khi lưu D1; khóa giải mã là Worker secret.
 * - Mọi thao tác thay đổi đều ghi audit (không kèm bí mật).
 * - Endpoint nhà cung cấp phải qua allowlist chống SSRF.
 */
import { Hono } from "hono";
import * as s from "@timo/database/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  aiKeyCreateSchema,
  aiKeyRotateSchema,
  aiKeyUpdateSchema,
  aiPreviewSchema,
  aiRouterSettingsSchema,
  idSchema,
} from "@timo/validation";
import type { AppBindings } from "../middleware/auth.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { ApiError, errors } from "../lib/errors.js";
import { writeAudit } from "../lib/audit.js";
import { newId, now } from "../lib/db.js";
import { decryptSecret, encryptSecret, maskSecret } from "../lib/ai-crypto.js";
import { allowedAiHosts, DEFAULT_AI_BASE_URL, normalizeAiBaseUrl } from "../lib/ai-endpoint.js";
import {
  availabilityOf,
  chatWithFailover,
  getRouterSettings,
  orderedKeys,
  probeKey,
  requireEncryptionKey,
  saveRouterSettings,
  usageSummary,
  utcDay,
  type AiKeyRow,
} from "../lib/ai-router.js";
import type { ZodType } from "zod";

export const adminAiRoutes = new Hono<AppBindings>();

adminAiRoutes.use("*", requireAuth);
adminAiRoutes.use("*", requirePermission("ai:manage"));

async function parseBody<T>(
  c: { req: { json: () => Promise<unknown> } },
  schema: ZodType<T>,
): Promise<T> {
  const body = await c.req.json().catch(() => undefined);
  if (body === undefined) throw errors.badRequest("Nội dung yêu cầu phải là JSON hợp lệ");
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(
      "validation_failed",
      "Dữ liệu không hợp lệ",
      result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }
  return result.data;
}

function parseId(raw: string): string {
  const r = idSchema.safeParse(raw);
  if (!r.success) throw errors.badRequest("ID không hợp lệ");
  return r.data;
}

/** Bản ghi trả về client: KHÔNG bao giờ chứa bản mã, IV hay khóa gốc. */
interface PublicKey {
  id: string;
  name: string;
  provider: string;
  maskedKey: string;
  fingerprint: string;
  baseUrl: string;
  model: string | null;
  priority: number;
  isEnabled: boolean;
  dailyRequestLimit: number;
  availability: string;
  lastSuccessAt: number | null;
  lastErrorAt: number | null;
  lastErrorMessage: string | null;
  lastCheckedAt: number | null;
  availableModels: string[] | null;
  createdAt: number;
  updatedAt: number;
  usageToday: {
    requests: number;
    failures: number;
    promptTokens: number;
    completionTokens: number;
  };
}

function toPublicKey(
  key: AiKeyRow,
  usage?: { requests: number; failures: number; promptTokens: number; completionTokens: number },
): PublicKey {
  return {
    id: key.id,
    name: key.name,
    provider: key.provider,
    maskedKey: maskSecret(key.secretLast4),
    fingerprint: key.secretFingerprint,
    baseUrl: key.baseUrl,
    model: key.model,
    priority: key.priority,
    isEnabled: key.isEnabled,
    dailyRequestLimit: key.dailyRequestLimit,
    availability: availabilityOf(key),
    lastSuccessAt: key.lastSuccessAt,
    lastErrorAt: key.lastErrorAt,
    lastErrorMessage: key.lastErrorMessage,
    lastCheckedAt: key.lastCheckedAt,
    availableModels: key.availableModels ?? null,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
    usageToday: usage ?? { requests: 0, failures: 0, promptTokens: 0, completionTokens: 0 },
  };
}

async function loadKey(db: AppBindings["Variables"]["db"], id: string): Promise<AiKeyRow> {
  const row = await db.select().from(s.aiApiKeys).where(eq(s.aiApiKeys.id, id)).get();
  if (!row) throw errors.notFound("Khóa AI");
  return row;
}

/** Danh sách khóa kèm usage hôm nay và trạng thái khả dụng. */
adminAiRoutes.get("/keys", async (c) => {
  const db = c.var.db;
  const keys = await orderedKeys(db, true);
  const day = utcDay();
  const usageRows = await db.select().from(s.aiUsageDaily).where(eq(s.aiUsageDaily.day, day));
  const usageByKey = new Map(usageRows.map((u) => [u.keyId, u]));
  const data = keys.map((k) => {
    const u = usageByKey.get(k.id);
    return toPublicKey(
      k,
      u
        ? {
            requests: u.requests,
            failures: u.failures,
            promptTokens: u.promptTokens,
            completionTokens: u.completionTokens,
          }
        : undefined,
    );
  });
  return c.json({ data });
});

/** Tạo khóa mới. Chỉ nhận bí mật một lần duy nhất và trả về dạng che. */
adminAiRoutes.post("/keys", rateLimit("ai-key-write"), async (c) => {
  const encryptionKey = requireEncryptionKey(c.env);
  const input = await parseBody(c, aiKeyCreateSchema);
  const baseUrl = normalizeAiBaseUrl(input.baseUrl ?? DEFAULT_AI_BASE_URL, allowedAiHosts(c.env));
  const encrypted = await encryptSecret(input.key, encryptionKey);
  const id = newId();
  const ts = now();
  await c.var.db.insert(s.aiApiKeys).values({
    id,
    name: input.name,
    provider: "ollama",
    secretCiphertext: encrypted.ciphertext,
    secretIv: encrypted.iv,
    secretLast4: encrypted.last4,
    secretFingerprint: encrypted.fingerprint,
    baseUrl,
    model: input.model ?? null,
    priority: input.priority,
    isEnabled: input.isEnabled,
    dailyRequestLimit: input.dailyRequestLimit,
    createdBy: c.var.auth?.userId ?? null,
    createdAt: ts,
    updatedAt: ts,
  });
  await writeAudit(c.var.db, {
    actorId: c.var.auth?.userId ?? null,
    action: "ai.key.created",
    entityType: "ai_api_key",
    entityId: id,
    metadata: { name: input.name, baseUrl, priority: input.priority, last4: encrypted.last4 },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  const row = await loadKey(c.var.db, id);
  return c.json({ data: toPublicKey(row) }, 201);
});

/** Cập nhật thuộc tính (không bao giờ đổi bí mật – dùng /rotate). */
adminAiRoutes.patch("/keys/:id", rateLimit("ai-key-write"), async (c) => {
  const id = parseId(c.req.param("id"));
  const input = await parseBody(c, aiKeyUpdateSchema);
  await loadKey(c.var.db, id);

  const update: Partial<typeof s.aiApiKeys.$inferInsert> = { updatedAt: now() };
  if (input.name !== undefined) update.name = input.name;
  if (input.baseUrl !== undefined)
    update.baseUrl = normalizeAiBaseUrl(input.baseUrl, allowedAiHosts(c.env));
  if (input.model !== undefined) update.model = input.model;
  if (input.priority !== undefined) update.priority = input.priority;
  if (input.isEnabled !== undefined) update.isEnabled = input.isEnabled;
  if (input.dailyRequestLimit !== undefined) update.dailyRequestLimit = input.dailyRequestLimit;

  await c.var.db.update(s.aiApiKeys).set(update).where(eq(s.aiApiKeys.id, id));
  await writeAudit(c.var.db, {
    actorId: c.var.auth?.userId ?? null,
    action: "ai.key.updated",
    entityType: "ai_api_key",
    entityId: id,
    // Chỉ ghi TÊN trường thay đổi, không ghi giá trị.
    metadata: { fields: Object.keys(update).filter((k) => k !== "updatedAt") },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  const row = await loadKey(c.var.db, id);
  return c.json({ data: toPublicKey(row) });
});

/** Xoay khóa: thay bí mật, giữ nguyên cấu hình. Bí mật cũ bị ghi đè hoàn toàn. */
adminAiRoutes.post("/keys/:id/rotate", rateLimit("ai-key-write"), async (c) => {
  const encryptionKey = requireEncryptionKey(c.env);
  const id = parseId(c.req.param("id"));
  const input = await parseBody(c, aiKeyRotateSchema);
  await loadKey(c.var.db, id);
  const encrypted = await encryptSecret(input.key, encryptionKey);
  await c.var.db
    .update(s.aiApiKeys)
    .set({
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      secretLast4: encrypted.last4,
      secretFingerprint: encrypted.fingerprint,
      // Trạng thái cũ không còn ý nghĩa với khóa mới.
      lastSuccessAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
      lastCheckedAt: null,
      availableModels: null,
      updatedAt: now(),
    })
    .where(eq(s.aiApiKeys.id, id));
  await writeAudit(c.var.db, {
    actorId: c.var.auth?.userId ?? null,
    action: "ai.key.rotated",
    entityType: "ai_api_key",
    entityId: id,
    metadata: { last4: encrypted.last4 },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  const row = await loadKey(c.var.db, id);
  return c.json({ data: toPublicKey(row) });
});

adminAiRoutes.delete("/keys/:id", rateLimit("ai-key-write"), async (c) => {
  const id = parseId(c.req.param("id"));
  const row = await loadKey(c.var.db, id);
  await c.var.db.delete(s.aiApiKeys).where(eq(s.aiApiKeys.id, id));
  await writeAudit(c.var.db, {
    actorId: c.var.auth?.userId ?? null,
    action: "ai.key.deleted",
    entityType: "ai_api_key",
    entityId: id,
    metadata: { name: row.name, last4: row.secretLast4 },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  return c.json({ data: { id, deleted: true } });
});

/** Kiểm tra kết nối: gọi GET /api/tags, không tiêu tốn quota sinh văn bản. */
adminAiRoutes.post("/keys/:id/test", rateLimit("ai-key-test"), async (c) => {
  const encryptionKey = requireEncryptionKey(c.env);
  const id = parseId(c.req.param("id"));
  const row = await loadKey(c.var.db, id);
  const secret = await decryptSecret(row, encryptionKey);
  const result = await probeKey(c.env, row, secret, { fetchImpl: c.var.aiFetch });
  const ts = now();
  await c.var.db
    .update(s.aiApiKeys)
    .set({
      lastCheckedAt: ts,
      availableModels: result.ok ? result.models : row.availableModels,
      lastSuccessAt: result.ok ? ts : row.lastSuccessAt,
      lastErrorAt: result.ok ? row.lastErrorAt : ts,
      lastErrorMessage: result.ok ? null : result.message,
      updatedAt: ts,
    })
    .where(eq(s.aiApiKeys.id, id));
  await writeAudit(c.var.db, {
    actorId: c.var.auth?.userId ?? null,
    action: "ai.key.tested",
    entityType: "ai_api_key",
    entityId: id,
    metadata: { ok: result.ok, status: result.status, modelCount: result.models.length },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  return c.json({ data: { id, ...result } });
});

/** Gửi thử một câu ngắn qua router – có tiêu tốn quota, nút bấm ghi rõ trong giao diện. */
adminAiRoutes.post("/keys/:id/preview", rateLimit("ai-key-test"), async (c) => {
  const encryptionKey = requireEncryptionKey(c.env);
  const id = parseId(c.req.param("id"));
  const input = await parseBody(c, aiPreviewSchema);
  const key = await loadKey(c.var.db, id);
  const outcome = await chatWithFailover(c.var.db, c.env, {
    messages: [{ role: "user", content: input.prompt }],
    model: input.model ?? key.model,
    fetchImpl: c.var.aiFetch,
    encryptionKey,
    requestTimeoutMs: 20_000,
  });
  await writeAudit(c.var.db, {
    actorId: c.var.auth?.userId ?? null,
    action: "ai.key.previewed",
    entityType: "ai_api_key",
    entityId: id,
    metadata: { ok: outcome.ok, attempts: outcome.attempts.length },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  if (!outcome.ok) {
    return c.json({ data: { ok: false, code: outcome.code, message: outcome.message } }, 200);
  }
  return c.json({
    data: {
      ok: true,
      content: outcome.content,
      model: outcome.model,
      keyName: outcome.keyName,
      latencyMs: outcome.latencyMs,
    },
  });
});

adminAiRoutes.get("/settings", async (c) => {
  const settings = await getRouterSettings(c.var.db);
  return c.json({
    data: {
      ...settings,
      allowedHosts: allowedAiHosts(c.env),
      defaultBaseUrl: DEFAULT_AI_BASE_URL,
      encryptionKeyConfigured: Boolean(c.env.TIMO_AI_ENCRYPTION_KEY?.trim()),
    },
  });
});

adminAiRoutes.put("/settings", rateLimit("ai-key-write"), async (c) => {
  const input = await parseBody(c, aiRouterSettingsSchema);
  const saved = await saveRouterSettings(c.var.db, input);
  await writeAudit(c.var.db, {
    actorId: c.var.auth?.userId ?? null,
    action: "ai.settings.updated",
    entityType: "system_setting",
    entityId: "ai.router",
    metadata: { ...saved },
    ip: c.req.header("CF-Connecting-IP") ?? null,
  });
  return c.json({ data: saved });
});

/** Usage theo ngày, gộp theo khóa – dùng cho bảng theo dõi. */
adminAiRoutes.get("/usage", async (c) => {
  const daysRaw = Number(c.req.query("days") ?? "14");
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(Math.trunc(daysRaw), 1), 30) : 14;
  const rows = await usageSummary(c.var.db, days);
  const totals = rows.reduce(
    (acc, r) => ({
      requests: acc.requests + r.requests,
      failures: acc.failures + r.failures,
      promptTokens: acc.promptTokens + r.promptTokens,
      completionTokens: acc.completionTokens + r.completionTokens,
    }),
    { requests: 0, failures: 0, promptTokens: 0, completionTokens: 0 },
  );
  return c.json({ data: { days, rows, totals } });
});

/** Tóm tắt khả dụng: số khóa theo trạng thái + khóa dùng gần nhất. */
adminAiRoutes.get("/availability", async (c) => {
  const keys = await orderedKeys(c.var.db, true);
  const counts = { ok: 0, error: 0, unknown: 0, disabled: 0 };
  for (const k of keys) counts[availabilityOf(k)] += 1;
  const enabled = keys.filter((k) => k.isEnabled);
  const latest = enabled.map((k) => k.lastSuccessAt ?? 0).reduce((a, b) => Math.max(a, b), 0);
  const day = utcDay();
  const usedToday = await c.var.db
    .select({ requests: sql<number>`coalesce(sum(${s.aiUsageDaily.requests}), 0)` })
    .from(s.aiUsageDaily)
    .where(eq(s.aiUsageDaily.day, day));
  return c.json({
    data: {
      counts,
      enabled: enabled.length,
      total: keys.length,
      lastSuccessAt: latest || null,
      requestsToday: Number(usedToday[0]?.requests ?? 0),
      hasDisabled: keys.some((k) => !k.isEnabled),
    },
  });
});

/** Lịch sử usage 1 khóa (biểu đồ nhỏ ở trang chi tiết). */
adminAiRoutes.get("/keys/:id/usage", async (c) => {
  const id = parseId(c.req.param("id"));
  const daysRaw = Number(c.req.query("days") ?? "14");
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(Math.trunc(daysRaw), 1), 30) : 14;
  const since = utcDay(Date.now() - (days - 1) * 86_400_000);
  const rows = await c.var.db
    .select()
    .from(s.aiUsageDaily)
    .where(and(eq(s.aiUsageDaily.keyId, id), gte(s.aiUsageDaily.day, since)))
    .orderBy(desc(s.aiUsageDaily.day))
    .limit(days);
  return c.json({ data: { days, rows } });
});
