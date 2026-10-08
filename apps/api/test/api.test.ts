import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestHarness,
  ADMIN_EMAIL,
  SETUP_SECRET,
  type TestUser,
} from "./helpers/app-harness.js";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const STUDENT_ID = "22222222-2222-4222-8222-222222222222";
const TEACHER_ID = "33333333-3333-4333-8333-333333333333";

describe("TIMO API", () => {
  let h: Awaited<ReturnType<typeof createTestHarness>>;
  let admin: TestUser;
  let student: TestUser;
  let teacher: TestUser;

  beforeEach(async () => {
    h = await createTestHarness();
    admin = await h.makeUser(ADMIN_EMAIL, ADMIN_ID);
    student = await h.makeUser("hs1@timo.test", STUDENT_ID);
    teacher = await h.makeUser("gv1@timo.test", TEACHER_ID);
  });

  describe("health and security headers", () => {
    it("returns health with security headers", async () => {
      const res = await h.request("/api/health");
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string };
      expect(body.status).toBe("ok");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("X-Request-Id")).toBeTruthy();
    });

    it("returns 404 JSON for unknown routes", async () => {
      const res = await h.request("/api/nope");
      expect(res.status).toBe(404);
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe("not_found");
    });
  });

  describe("public catalog", () => {
    it("lists the 12 seeded grades in order", async () => {
      const res = await h.request("/api/public/grades");
      const body = (await res.json()) as { data: { level: number; stage: string }[] };
      expect(body.data.map((g) => g.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(body.data[0]?.stage).toBe("primary");
      expect(body.data[11]?.stage).toBe("upper_secondary");
    });

    it("lists seeded subjects with Vietnamese names", async () => {
      const res = await h.request("/api/public/subjects");
      const body = (await res.json()) as { data: { slug: string; nameVi: string }[] };
      expect(body.data.find((s) => s.slug === "toan")?.nameVi).toBe("Toán học");
    });

    it("returns valid homepage sections in position order", async () => {
      const res = await h.request("/api/public/homepage");
      const body = (await res.json()) as { data: { key: string }[] };
      expect(body.data.map((s) => s.key)).toEqual([
        "hero",
        "announcement",
        "grades",
        "featured_courses",
        "subjects",
        "features",
        "cta",
      ]);
      expect(res.headers.get("Cache-Control")).toContain("max-age=60");
    });
  });

  describe("authentication", () => {
    it("rejects requests without token", async () => {
      const res = await h.request("/api/me");
      expect(res.status).toBe(401);
    });

    it("rejects garbage tokens", async () => {
      const res = await h.request("/api/me", { token: "abc.def.ghi" });
      expect(res.status).toBe(401);
    });

    it("provisions a profile with the default student role on first login", async () => {
      const res = await h.request("/api/me", { token: student.token });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        data: { id: string; roles: string[]; permissions: string[] };
      };
      expect(body.data.id).toBe(STUDENT_ID);
      expect(body.data.roles).toEqual(["student"]);
      expect(body.data.permissions).toContain("grades:view");
      expect(body.data.permissions).not.toContain("grades:manage");
    });
  });

  describe("authorization (server-side RBAC)", () => {
    it("forbids students from creating grades", async () => {
      const res = await h.request("/api/admin/grades", {
        method: "POST",
        token: student.token,
        json: { level: 1, slug: "lop-1-x", nameVi: "Lớp 1", stage: "primary" },
      });
      expect(res.status).toBe(403);
    });

    it("forbids teachers from managing subjects", async () => {
      const res = await h.request("/api/admin/subjects", {
        method: "POST",
        token: teacher.token,
        json: { slug: "robotics", nameVi: "Robot" },
      });
      expect(res.status).toBe(403);
    });

    it("forbids students from reading the audit log", async () => {
      const res = await h.request("/api/admin/audit-logs", { token: student.token });
      expect(res.status).toBe(403);
    });

    it("forbids admin endpoints without authentication", async () => {
      const res = await h.request("/api/admin/grades");
      expect(res.status).toBe(401);
    });
  });

  describe("bootstrap (first admin)", () => {
    it("reports uninitialized status", async () => {
      const res = await h.request("/api/setup/status");
      expect(((await res.json()) as { data: { initialized: boolean } }).data.initialized).toBe(
        false,
      );
    });

    it("rejects a wrong setup secret and does not grant roles", async () => {
      const res = await h.request("/api/setup/bootstrap", {
        method: "POST",
        token: admin.token,
        json: { setupSecret: "wrong-secret-value-that-is-long-enough" },
      });
      expect(res.status).toBe(403);
      const me = await h.request("/api/me", { token: admin.token });
      expect(((await me.json()) as { data: { roles: string[] } }).data.roles).toEqual(["student"]);
    });

    it("rejects a user whose email is not the configured initial admin", async () => {
      const res = await h.request("/api/setup/bootstrap", {
        method: "POST",
        token: student.token,
        json: { setupSecret: SETUP_SECRET },
      });
      expect(res.status).toBe(403);
    });

    it("refuses the initial admin when Supabase reports the email is not verified", async () => {
      const unverified = await h.makeUser(ADMIN_EMAIL, "44444444-4444-4444-8444-444444444444", {
        emailConfirmedAt: null,
      });
      const res = await h.request("/api/setup/bootstrap", {
        method: "POST",
        token: unverified.token,
        json: { setupSecret: SETUP_SECRET },
      });
      expect(res.status).toBe(403);
      const logs = await h.request("/api/admin/audit-logs", { token: admin.token });
      expect(logs.status).toBe(403);
      const rows = h.d1.sqlite.prepare("SELECT action, metadata FROM audit_logs").all() as Record<
        string,
        unknown
      >[];
      expect(rows.map((r) => r.action)).toContain("bootstrap.denied");
      expect(rows.some((r) => String(r.metadata).includes("email_not_verified"))).toBe(true);
    });

    it("refuses a banned initial admin", async () => {
      const banned = await h.makeUser(ADMIN_EMAIL, "55555555-5555-4555-8555-555555555555", {
        bannedUntil: "2099-01-01T00:00:00Z",
      });
      const res = await h.request("/api/setup/bootstrap", {
        method: "POST",
        token: banned.token,
        json: { setupSecret: SETUP_SECRET },
      });
      expect(res.status).toBe(403);
    });

    it("does not leak the setup secret into audit logs", async () => {
      await h.request("/api/setup/bootstrap", {
        method: "POST",
        token: admin.token,
        json: { setupSecret: "wrong-secret-value-that-is-long-enough" },
      });
      const rows = h.d1.sqlite.prepare("SELECT metadata FROM audit_logs").all() as Record<
        string,
        unknown
      >[];
      expect(JSON.stringify(rows)).not.toContain("wrong-secret-value");
    });

    it("grants super_admin once, records the operation, and refuses a second run", async () => {
      const first = await h.request("/api/setup/bootstrap", {
        method: "POST",
        token: admin.token,
        json: { setupSecret: SETUP_SECRET },
      });
      expect(first.status).toBe(201);

      const second = await h.request("/api/setup/bootstrap", {
        method: "POST",
        token: admin.token,
        json: { setupSecret: SETUP_SECRET },
      });
      expect(second.status).toBe(409);

      const me = await h.request("/api/me", { token: admin.token });
      const body = (await me.json()) as { data: { roles: string[]; permissions: string[] } };
      expect(body.data.roles).toContain("super_admin");
      expect(body.data.permissions).toContain("roles:manage");

      const status = await h.request("/api/setup/status");
      expect(((await status.json()) as { data: { initialized: boolean } }).data.initialized).toBe(
        true,
      );
    });
  });

  describe("admin CRUD with validation and audit", () => {
    beforeEach(async () => {
      await h.request("/api/setup/bootstrap", {
        method: "POST",
        token: admin.token,
        json: { setupSecret: SETUP_SECRET },
      });
    });

    it("creates, updates, and deletes a subject; each write is audited", async () => {
      const created = await h.request("/api/admin/subjects", {
        method: "POST",
        token: admin.token,
        json: { slug: "robotics", nameVi: "Robot và Lập trình" },
      });
      expect(created.status).toBe(201);
      const { data } = (await created.json()) as { data: { id: string; isCustom: boolean } };
      expect(data.isCustom).toBe(true);

      const updated = await h.request(`/api/admin/subjects/${data.id}`, {
        method: "PATCH",
        token: admin.token,
        json: { isActive: false },
      });
      expect(updated.status).toBe(200);

      const deleted = await h.request(`/api/admin/subjects/${data.id}`, {
        method: "DELETE",
        token: admin.token,
      });
      expect(deleted.status).toBe(200);

      const logs = await h.request("/api/admin/audit-logs", { token: admin.token });
      const actions = ((await logs.json()) as { data: { action: string }[] }).data.map(
        (l) => l.action,
      );
      expect(actions).toEqual(
        expect.arrayContaining([
          "subject.create",
          "subject.update",
          "subject.delete",
          "bootstrap.completed",
        ]),
      );
    });

    it("returns 422 with field details for invalid grade input", async () => {
      const res = await h.request("/api/admin/grades", {
        method: "POST",
        token: admin.token,
        json: { level: 3, slug: "lop-3", nameVi: "Lớp 3", stage: "upper_secondary" },
      });
      expect(res.status).toBe(422);
      const body = (await res.json()) as { error: { details: { path: string }[] } };
      expect(body.error.details[0]?.path).toBe("stage");
    });

    it("rejects duplicate grade levels with 409", async () => {
      const res = await h.request("/api/admin/grades", {
        method: "POST",
        token: admin.token,
        json: { level: 1, slug: "lop-1-moi", nameVi: "Lớp 1", stage: "primary" },
      });
      expect(res.status).toBe(409);
    });

    it("rejects malformed JSON with 400", async () => {
      const res = await h.request("/api/admin/subjects", {
        method: "POST",
        token: admin.token,
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      });
      expect(res.status).toBe(400);
    });

    it("updates a grade's active flag and returns the new row", async () => {
      const list = await h.request("/api/admin/grades", { token: admin.token });
      const grade = ((await list.json()) as { data: { id: string; level: number }[] }).data.find(
        (g) => g.level === 12,
      )!;
      const res = await h.request(`/api/admin/grades/${grade.id}`, {
        method: "PATCH",
        token: admin.token,
        json: { isActive: false },
      });
      expect(res.status).toBe(200);
      const pub = await h.request("/api/public/grades");
      expect(((await pub.json()) as { data: unknown[] }).data).toHaveLength(11);
    });

    it("rejects unsafe homepage CTA links through the CMS", async () => {
      const list = await h.request("/api/admin/homepage-sections", { token: admin.token });
      const cta = ((await list.json()) as { data: { id: string; type: string }[] }).data.find(
        (s) => s.type === "cta",
      )!;
      const res = await h.request(`/api/admin/homepage-sections/${cta.id}`, {
        method: "PATCH",
        token: admin.token,
        json: { config: { ctaLabel: "Bấm", ctaHref: "javascript:alert(1)" } },
      });
      expect(res.status).toBe(422);
    });

    it("reorders homepage sections and reflects the new order publicly", async () => {
      const list = await h.request("/api/admin/homepage-sections", { token: admin.token });
      const ids = ((await list.json()) as { data: { id: string; key: string }[] }).data.map(
        (s) => s,
      );
      const reversed = [...ids].reverse().map((s) => s.id);
      const res = await h.request("/api/admin/homepage-sections/order", {
        method: "PUT",
        token: admin.token,
        json: { order: reversed },
      });
      expect(res.status).toBe(200);
      const pub = await h.request("/api/public/homepage");
      const keys = ((await pub.json()) as { data: { key: string }[] }).data.map((s) => s.key);
      expect(keys[0]).toBe("cta");
    });

    it("rejects a reorder that omits sections", async () => {
      const res = await h.request("/api/admin/homepage-sections/order", {
        method: "PUT",
        token: admin.token,
        json: { order: ["section_hero"] },
      });
      expect(res.status).toBe(400);
    });

    it("lists users with pagination for admins", async () => {
      await h.request("/api/me", { token: student.token });
      const res = await h.request("/api/admin/users?page=1&pageSize=1", { token: admin.token });
      const body = (await res.json()) as {
        data: unknown[];
        pagination: { total: number; pageSize: number };
      };
      expect(body.data).toHaveLength(1);
      expect(body.pagination.total).toBeGreaterThanOrEqual(2);
      expect(body.pagination.pageSize).toBe(1);
    });

    it("keeps audit metadata free of secrets", async () => {
      await h.request("/api/admin/subjects", {
        method: "POST",
        token: admin.token,
        json: { slug: "bi-mat", nameVi: "Môn thử" },
      });
      const rows = h.d1.sqlite.prepare("SELECT metadata FROM audit_logs").all() as {
        metadata: string | null;
      }[];
      for (const r of rows) {
        expect(r.metadata ?? "").not.toContain(SETUP_SECRET);
        expect(r.metadata ?? "").not.toMatch(/token/i);
      }
    });
  });

  describe("CORS and origin protection", () => {
    it("rejects state-changing requests from an unlisted Origin", async () => {
      const res = await h.request("/api/admin/subjects", {
        method: "POST",
        token: admin.token,
        headers: { Origin: "https://evil.example" },
        json: { slug: "x-y", nameVi: "X" },
      });
      expect(res.status).toBe(403);
    });

    it("echoes only allowed origins in CORS headers", async () => {
      const ok = await h.request("/api/public/grades", {
        headers: { Origin: "https://timovn.test" },
      });
      expect(ok.headers.get("Access-Control-Allow-Origin")).toBe("https://timovn.test");
      const bad = await h.request("/api/public/grades", {
        headers: { Origin: "https://evil.example" },
      });
      expect(bad.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("rejects writes without a bearer token", async () => {
      const res = await h.request("/api/admin/subjects", {
        method: "POST",
        json: { slug: "a-b", nameVi: "A" },
      });
      expect(res.status).toBe(401);
    });
  });
});
