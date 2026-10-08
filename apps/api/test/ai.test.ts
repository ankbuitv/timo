import { beforeEach, describe, expect, it } from "vitest";
import { createTestHarness, ADMIN_EMAIL, SETUP_SECRET } from "./helpers/app-harness.js";
import {
  encryptSecret,
  decryptSecret,
  maskSecret,
  parseEncryptionKey,
} from "../src/lib/ai-crypto.js";
import { normalizeAiBaseUrl, allowedAiHosts } from "../src/lib/ai-endpoint.js";
import { chatWithFailover, recordUsage, utcDay } from "../src/lib/ai-router.js";
import { createDb } from "../src/lib/db.js";
import type { Env } from "../src/env.js";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const STUDENT_ID = "22222222-2222-4222-8222-222222222222";
const ENCRYPTION_KEY = "u7Kq3ZP0mQ1rT5vX8yB2cD4eF6gH9jL0nP3sV6xA8zC=";
const FAKE_SECRET = "ollama-secret-key-ABCD1234";

/** Harness đã bật super_admin cho ADMIN_EMAIL qua luồng bootstrap thật. */
async function bootstrapAdmin(h: Awaited<ReturnType<typeof createTestHarness>>, token: string) {
  const res = await h.request("/api/setup/bootstrap", {
    method: "POST",
    token,
    json: { setupSecret: SETUP_SECRET },
  });
  expect(res.status).toBe(201);
}

describe("mã hóa bí mật AI (AES-256-GCM)", () => {
  it("mã hóa rồi giải mã trả lại đúng khóa gốc", async () => {
    const encrypted = await encryptSecret(FAKE_SECRET, ENCRYPTION_KEY);
    expect(encrypted.ciphertext).not.toContain(FAKE_SECRET);
    expect(encrypted.last4).toBe("1234");
    expect(maskSecret(encrypted.last4)).toBe("••••••••1234");
    const decrypted = await decryptSecret(
      { secretCiphertext: encrypted.ciphertext, secretIv: encrypted.iv },
      ENCRYPTION_KEY,
    );
    expect(decrypted).toBe(FAKE_SECRET);
  });

  it("dùng IV ngẫu nhiên nên hai lần mã hóa cùng khóa cho bản mã khác nhau", async () => {
    const a = await encryptSecret(FAKE_SECRET, ENCRYPTION_KEY);
    const b = await encryptSecret(FAKE_SECRET, ENCRYPTION_KEY);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    // Cùng khóa gốc thì vân tay phải giống nhau (dùng để phát hiện xoay khóa).
    expect(a.fingerprint).toBe(b.fingerprint);
  });

  it("từ chối giải mã khi sai khóa mã hóa", async () => {
    const encrypted = await encryptSecret(FAKE_SECRET, ENCRYPTION_KEY);
    const other = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    await expect(
      decryptSecret({ secretCiphertext: encrypted.ciphertext, secretIv: encrypted.iv }, other),
    ).rejects.toThrow(/Không giải mã được/);
  });

  it("kiểm tra định dạng khóa mã hóa và không lộ giá trị trong thông báo", () => {
    expect(parseEncryptionKey(ENCRYPTION_KEY).length).toBe(32);
    expect(parseEncryptionKey("ab".repeat(32)).length).toBe(32); // hex 64 ký tự
    expect(() => parseEncryptionKey("qua-ngan")).toThrow(/32 byte/);
    expect(() => parseEncryptionKey("x".repeat(64))).toThrow(/32 byte/);
    expect(() => parseEncryptionKey(undefined)).toThrow(/TIMO_AI_ENCRYPTION_KEY/);
  });
});

describe("allowlist endpoint AI (chống SSRF)", () => {
  const hosts = [...allowedAiHosts({})];

  it("chấp nhận endpoint Ollama Cloud mặc định", () => {
    expect(normalizeAiBaseUrl("https://ollama.com/api", hosts)).toBe("https://ollama.com/api");
    expect(normalizeAiBaseUrl("https://ollama.com/", hosts)).toBe("https://ollama.com");
    expect(normalizeAiBaseUrl("https://sub.ollama.com/api", hosts)).toBe(
      "https://sub.ollama.com/api",
    );
  });

  it("từ chối http, IP, host nội bộ, credential và host ngoài allowlist", () => {
    const bad = [
      "http://ollama.com/api",
      "https://127.0.0.1/api",
      "https://10.0.0.5/api",
      "https://[::1]/api",
      "https://localhost/api",
      "https://router.local/api",
      "https://user:pass@ollama.com/api",
      "https://evil.example.com/api",
      "https://ollama.com.evil.com/api",
      "https://ollama.com:8443/api",
      "https://ollama.com/api/chat",
      "https://ollama.com/api?x=1",
    ];
    for (const url of bad) {
      expect(() => normalizeAiBaseUrl(url, hosts), url).toThrow();
    }
  });

  it("chỉ mở rộng khi host được khai báo trong AI_ALLOWED_HOSTS", () => {
    const widened = allowedAiHosts({ AI_ALLOWED_HOSTS: "ollama.com, ai.example.org" });
    expect(normalizeAiBaseUrl("https://ai.example.org/api", widened)).toBe(
      "https://ai.example.org/api",
    );
    expect(() => normalizeAiBaseUrl("https://ai.example.org/api", hosts)).toThrow(
      /danh sách cho phép/,
    );
  });
});

describe("router nhiều khóa Ollama", () => {
  let h: Awaited<ReturnType<typeof createTestHarness>>;
  let adminToken: string;
  let studentToken: string;

  beforeEach(async () => {
    h = await createTestHarness();
    const admin = await h.makeUser(ADMIN_EMAIL, ADMIN_ID);
    const student = await h.makeUser("hs1@timo.test", STUDENT_ID);
    adminToken = admin.token;
    studentToken = student.token;
    await bootstrapAdmin(h, adminToken);
  });

  async function createKey(
    body: Record<string, unknown>,
    env: Partial<Env> = {},
  ): Promise<Response> {
    return h.app.request(
      "/api/admin/ai/keys",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
          "CF-Connecting-IP": "1.2.3.4",
        },
        body: JSON.stringify(body),
      },
      { ...h.env, TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY, ...env },
    );
  }

  it("chặn người dùng không có quyền ai:manage", async () => {
    const res = await h.app.request(
      "/api/admin/ai/keys",
      { headers: { Authorization: `Bearer ${studentToken}` } },
      h.env,
    );
    expect(res.status).toBe(403);
  });

  it("trả 503 khi chưa cấu hình TIMO_AI_ENCRYPTION_KEY", async () => {
    const res = await createKey(
      { name: "Khóa chính", key: FAKE_SECRET },
      {
        TIMO_AI_ENCRYPTION_KEY: undefined,
      },
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toContain("TIMO_AI_ENCRYPTION_KEY");
  });

  it("lưu khóa ở dạng mã hóa và chỉ trả về dạng che", async () => {
    const res = await createKey({ name: "Khóa chính", key: FAKE_SECRET, model: "gemma4:31b" });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data.maskedKey).toBe("••••••••1234");
    expect(JSON.stringify(body)).not.toContain(FAKE_SECRET);
    expect(body.data).not.toHaveProperty("secretCiphertext");

    // Kiểm tra trực tiếp trong D1: không có bản rõ.
    const rows = h.d1.rawRowsForTest("SELECT secret_ciphertext, secret_last4 FROM ai_api_keys");
    expect(rows).toHaveLength(1);
    expect(String(rows[0]?.secret_ciphertext ?? "")).not.toContain(FAKE_SECRET);
    expect(String(rows[0]?.secret_last4)).toBe("1234");
  });

  it("từ chối endpoint ngoài allowlist khi tạo khóa", async () => {
    const res = await createKey({
      name: "Khóa lạ",
      key: FAKE_SECRET,
      baseUrl: "https://evil.example.com/api",
    });
    expect(res.status).toBe(400);
  });

  it("xoay khóa làm đổi vân tay và trạng thái cũ, không trả lại khóa", async () => {
    const created = (await (await createKey({ name: "Khóa chính", key: FAKE_SECRET })).json()) as {
      data: { id: string; fingerprint: string };
    };
    const rotate = await h.app.request(
      `/api/admin/ai/keys/${created.data.id}/rotate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
          "CF-Connecting-IP": "1.2.3.4",
        },
        body: JSON.stringify({ key: "khóa-mới-9999" }),
      },
      { ...h.env, TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY },
    );
    expect(rotate.status).toBe(200);
    const body = (await rotate.json()) as { data: { maskedKey: string; fingerprint: string } };
    expect(body.data.maskedKey).toBe("••••••••9999");
    expect(body.data.fingerprint).not.toBe(created.data.fingerprint);
  });

  it("ghi audit cho mọi thao tác quản trị khóa", async () => {
    const created = (await (await createKey({ name: "Khóa chính", key: FAKE_SECRET })).json()) as {
      data: { id: string };
    };
    await h.app.request(
      `/api/admin/ai/keys/${created.data.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
          "CF-Connecting-IP": "1.2.3.4",
        },
        body: JSON.stringify({ isEnabled: false, priority: 5 }),
      },
      { ...h.env, TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY },
    );
    const actions = h.d1
      .rawRowsForTest(
        "SELECT action FROM audit_logs WHERE entity_type = 'ai_api_key' ORDER BY created_at",
      )
      .map((r) => String(r.action));
    expect(actions).toEqual(["ai.key.created", "ai.key.updated"]);
  });

  it("test kết nối gọi GET /api/tags và lưu danh sách model", async () => {
    const created = (await (await createKey({ name: "Khóa chính", key: FAKE_SECRET })).json()) as {
      data: { id: string };
    };
    const calls: { url: string; auth: string | null }[] = [];
    const aiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({
        url: String(input),
        auth: new Headers(init?.headers).get("Authorization") ?? null,
      });
      return new Response(
        JSON.stringify({ models: [{ name: "gemma4:31b" }, { name: "gpt-oss:120b" }] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as typeof fetch;

    h.setAiFetch(aiFetch);
    const res = await h.app.request(
      `/api/admin/ai/keys/${created.data.id}/test`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "CF-Connecting-IP": "1.2.3.4" },
      },
      { ...h.env, TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { ok: boolean; models: string[] } };
    expect(body.data.ok).toBe(true);
    expect(body.data.models).toEqual(["gemma4:31b", "gpt-oss:120b"]);
    expect(calls[0]?.url).toBe("https://ollama.com/api/tags");
    expect(calls[0]?.auth).toBe(`Bearer ${FAKE_SECRET}`);
  });

  it("gửi thử báo lỗi hạn mức 429 và KHÔNG chuyển sang khóa khác", async () => {
    await createKey({ name: "Khóa 1", key: "key-mot-1111", priority: 1, model: "m1" });
    await createKey({ name: "Khóa 2", key: "key-hai-2222", priority: 2, model: "m2" });
    const calls: string[] = [];
    const aiFetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429,
        headers: { "Retry-After": "30" },
      });
    }) as typeof fetch;

    const db = createDb({ DB: h.env.DB } as Env);
    const outcome = await chatWithFailover(
      db,
      { TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY },
      {
        messages: [{ role: "user", content: "xin chào" }],
        fetchImpl: aiFetch,
        encryptionKey: ENCRYPTION_KEY,
        sleep: async () => {},
      },
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.code).toBe("rate_limited");
      expect(outcome.retryAfterSeconds).toBe(30);
    }
    // Chỉ một lần gọi: không dùng khóa thứ hai để vượt hạn mức.
    expect(calls).toHaveLength(1);
  });

  it("chuyển sang khóa dự phòng khi khóa đầu lỗi xác thực, có backoff", async () => {
    await createKey({ name: "Khóa hỏng", key: "key-hong-0000", priority: 1, model: "m1" });
    await createKey({ name: "Khóa tốt", key: "key-tot-2222", priority: 2, model: "m2" });
    const auths: (string | null)[] = [];
    const aiFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get("Authorization") ?? null;
      auths.push(auth);
      if (auth === "Bearer key-hong-0000") return new Response("unauthorized", { status: 401 });
      return new Response(
        JSON.stringify({
          message: { content: "Xin chào, mình là TIMO." },
          prompt_eval_count: 12,
          eval_count: 7,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const db = createDb({ DB: h.env.DB } as Env);
    const sleeps: number[] = [];
    const outcome = await chatWithFailover(
      db,
      { TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY },
      {
        messages: [{ role: "user", content: "xin chào" }],
        fetchImpl: aiFetch,
        encryptionKey: ENCRYPTION_KEY,
        sleep: async (ms) => {
          sleeps.push(ms);
        },
      },
    );
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.content).toBe("Xin chào, mình là TIMO.");
      expect(outcome.keyName).toBe("Khóa tốt");
    }
    expect(auths).toEqual(["Bearer key-hong-0000", "Bearer key-tot-2222"]);
    expect(sleeps).toEqual([250]);

    // Usage: 1 lần thất bại + 1 lần thành công; token được ghi nhận.
    const usage = h.d1.rawRowsForTest(
      "SELECT day, requests, failures, prompt_tokens, completion_tokens FROM ai_usage_daily ORDER BY requests",
    );
    expect(Number(usage[0]?.failures)).toBe(1);
    expect(Number(usage[1]?.prompt_tokens)).toBe(12);
    expect(Number(usage[1]?.completion_tokens)).toBe(7);
  });

  it("không gọi khóa đã tắt và tôn trọng giới hạn theo ngày", async () => {
    const disabled = (await (
      await createKey({
        name: "Khóa tắt",
        key: "key-tat-1111",
        priority: 1,
        model: "m1",
        isEnabled: false,
      })
    ).json()) as { data: { id: string } };
    const limited = (await (
      await createKey({
        name: "Khóa giới hạn",
        key: "key-gioi-han-2222",
        priority: 2,
        model: "m2",
        dailyRequestLimit: 1,
      })
    ).json()) as { data: { id: string } };

    const db = createDb({ DB: h.env.DB } as Env);
    await recordUsage(db, limited.data.id, utcDay(), { requests: 1 });

    let called = 0;
    const aiFetch = (async () => {
      called += 1;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const outcome = await chatWithFailover(
      db,
      { TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY },
      {
        messages: [{ role: "user", content: "xin chào" }],
        fetchImpl: aiFetch,
        encryptionKey: ENCRYPTION_KEY,
      },
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.code).toBe("all_failed");
      expect(outcome.attempts.map((a) => a.outcome)).toEqual(["daily_limit"]);
    }
    expect(called).toBe(0);
    expect(disabled.data.id).toBeTruthy();
  });

  it("trả lỗi rõ ràng khi chưa có khóa nào", async () => {
    const db = createDb({ DB: h.env.DB } as Env);
    const outcome = await chatWithFailover(
      db,
      { TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY },
      { messages: [{ role: "user", content: "xin chào" }], encryptionKey: ENCRYPTION_KEY },
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe("no_keys");
  });

  it("lưu cấu hình router và đọc lại đúng giá trị", async () => {
    const save = await h.app.request(
      "/api/admin/ai/settings",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
          "CF-Connecting-IP": "1.2.3.4",
        },
        body: JSON.stringify({
          failoverEnabled: true,
          maxAttempts: 2,
          backoffBaseMs: 100,
          timeoutMs: 15000,
          defaultModel: "gemma4:31b",
        }),
      },
      h.env,
    );
    expect(save.status).toBe(200);
    const read = await h.app.request(
      "/api/admin/ai/settings",
      { headers: { Authorization: `Bearer ${adminToken}` } },
      { ...h.env, TIMO_AI_ENCRYPTION_KEY: ENCRYPTION_KEY },
    );
    const body = (await read.json()) as {
      data: {
        maxAttempts: number;
        defaultModel: string;
        allowedHosts: string[];
        encryptionKeyConfigured: boolean;
      };
    };
    expect(body.data.maxAttempts).toBe(2);
    expect(body.data.allowedHosts).toContain("ollama.com");
    expect(body.data.encryptionKeyConfigured).toBe(true);
  });
});
