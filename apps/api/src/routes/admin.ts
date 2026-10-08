import { Hono } from "hono";
import * as s from "@timo/database/schema";
import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import {
  gradeCreateSchema,
  gradeUpdateSchema,
  homepageReorderSchema,
  homepageSectionUpdateSchema,
  paginationSchema,
  sectionConfigSchemas,
  subjectCreateSchema,
  subjectUpdateSchema,
  idSchema,
  type HomepageSectionType,
} from "@timo/validation";
import type { ZodType } from "zod";
import type { AppBindings } from "../middleware/auth.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { ApiError, errors } from "../lib/errors.js";
import { writeAudit } from "../lib/audit.js";
import { newId, now } from "../lib/db.js";

export const adminRoutes = new Hono<AppBindings>();

adminRoutes.use("*", requireAuth);

/** Phân tích và kiểm tra body JSON bằng Zod. Trả về lỗi chi tiết theo trường. */
async function parseBody<T>(
  c: { req: { json: () => Promise<unknown> } },
  schema: ZodType<T>,
): Promise<T> {
  const body = await c.req.json().catch(() => undefined);
  if (body === undefined) throw errors.badRequest("Nội dung yêu cầu phải là JSON hợp lệ");
  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw new ApiError("validation_failed", "Dữ liệu không hợp lệ", details);
  }
  return result.data;
}

function parseId(raw: string): string {
  const r = idSchema.safeParse(raw);
  if (!r.success) throw errors.badRequest("ID không hợp lệ");
  return r.data;
}

function page(c: { req: { query: (k: string) => string | undefined } }) {
  const r = paginationSchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  });
  if (!r.success) throw errors.badRequest("Tham số phân trang không hợp lệ");
  return {
    page: r.data.page,
    pageSize: r.data.pageSize,
    offset: (r.data.page - 1) * r.data.pageSize,
  };
}

// ---------- Tổng quan ----------
adminRoutes.get("/overview", requirePermission("users:view"), async (c) => {
  const db = c.var.db;
  const [users, grades, subjects, sections] = await Promise.all([
    db.select({ n: count() }).from(s.profiles).get(),
    db.select({ n: count() }).from(s.grades).get(),
    db.select({ n: count() }).from(s.subjects).get(),
    db.select({ n: count() }).from(s.homepageSections).get(),
  ]);
  return c.json({
    data: {
      users: users?.n ?? 0,
      grades: grades?.n ?? 0,
      subjects: subjects?.n ?? 0,
      homepageSections: sections?.n ?? 0,
      note: "Số liệu được đếm trực tiếp từ cơ sở dữ liệu D1.",
    },
  });
});

// ---------- Người dùng (chỉ xem) ----------
adminRoutes.get("/users", requirePermission("users:view"), async (c) => {
  const { page: p, pageSize, offset } = page(c);
  const q = c.req.query("q")?.trim();
  const where = q ? sql`${s.profiles.email} LIKE ${"%" + q.replace(/[%_]/g, "") + "%"}` : undefined;
  const [rows, total] = await Promise.all([
    c.var.db
      .select({
        id: s.profiles.id,
        email: s.profiles.email,
        displayName: s.profiles.displayName,
        status: s.profiles.status,
        createdAt: s.profiles.createdAt,
      })
      .from(s.profiles)
      .where(where)
      .orderBy(asc(s.profiles.createdAt))
      .limit(pageSize)
      .offset(offset),
    c.var.db.select({ n: count() }).from(s.profiles).where(where).get(),
  ]);
  return c.json({ data: rows, pagination: { page: p, pageSize, total: total?.n ?? 0 } });
});

// ---------- Lớp học ----------
adminRoutes.get("/grades", requirePermission("grades:view"), async (c) => {
  const rows = await c.var.db
    .select()
    .from(s.grades)
    .orderBy(asc(s.grades.sortOrder), asc(s.grades.level));
  return c.json({ data: rows });
});

adminRoutes.post(
  "/grades",
  requirePermission("grades:manage"),
  rateLimit("admin-write"),
  async (c) => {
    const input = await parseBody(c, gradeCreateSchema);
    const db = c.var.db;
    const dup = await db
      .select({ id: s.grades.id })
      .from(s.grades)
      .where(sql`${s.grades.level} = ${input.level} OR ${s.grades.slug} = ${input.slug}`)
      .get();
    if (dup) throw errors.conflict("Lớp hoặc slug này đã tồn tại");
    const id = newId();
    const ts = now();
    await db.insert(s.grades).values({ id, ...input, createdAt: ts, updatedAt: ts });
    await writeAudit(db, {
      actorId: c.var.auth!.userId,
      action: "grade.create",
      entityType: "grade",
      entityId: id,
      metadata: { level: input.level, slug: input.slug },
    });
    return c.json({ data: { id, ...input } }, 201);
  },
);

adminRoutes.patch(
  "/grades/:id",
  requirePermission("grades:manage"),
  rateLimit("admin-write"),
  async (c) => {
    const id = parseId(c.req.param("id"));
    const input = await parseBody(c, gradeUpdateSchema);
    const db = c.var.db;
    if (input.slug) {
      const dup = await db
        .select({ id: s.grades.id })
        .from(s.grades)
        .where(and(eq(s.grades.slug, input.slug), ne(s.grades.id, id)))
        .get();
      if (dup) throw errors.conflict("Slug này đã được sử dụng");
    }
    const updated = await db
      .update(s.grades)
      .set({ ...input, updatedAt: now() })
      .where(eq(s.grades.id, id))
      .returning()
      .get();
    if (!updated) throw errors.notFound("Lớp học");
    await writeAudit(db, {
      actorId: c.var.auth!.userId,
      action: "grade.update",
      entityType: "grade",
      entityId: id,
      metadata: { fields: Object.keys(input) },
    });
    return c.json({ data: updated });
  },
);

adminRoutes.delete(
  "/grades/:id",
  requirePermission("grades:manage"),
  rateLimit("admin-write"),
  async (c) => {
    const id = parseId(c.req.param("id"));
    const db = c.var.db;
    const deleted = await db
      .delete(s.grades)
      .where(eq(s.grades.id, id))
      .returning({ id: s.grades.id })
      .get();
    if (!deleted) throw errors.notFound("Lớp học");
    await writeAudit(db, {
      actorId: c.var.auth!.userId,
      action: "grade.delete",
      entityType: "grade",
      entityId: id,
    });
    return c.json({ data: { id, deleted: true } });
  },
);

// ---------- Môn học ----------
adminRoutes.get("/subjects", requirePermission("subjects:view"), async (c) => {
  const rows = await c.var.db
    .select()
    .from(s.subjects)
    .orderBy(asc(s.subjects.sortOrder), asc(s.subjects.nameVi));
  return c.json({ data: rows });
});

adminRoutes.post(
  "/subjects",
  requirePermission("subjects:manage"),
  rateLimit("admin-write"),
  async (c) => {
    const input = await parseBody(c, subjectCreateSchema);
    const db = c.var.db;
    const dup = await db
      .select({ id: s.subjects.id })
      .from(s.subjects)
      .where(eq(s.subjects.slug, input.slug))
      .get();
    if (dup) throw errors.conflict("Slug môn học đã tồn tại");
    const id = newId();
    const ts = now();
    await db
      .insert(s.subjects)
      .values({ id, ...input, isCustom: true, createdAt: ts, updatedAt: ts });
    await writeAudit(db, {
      actorId: c.var.auth!.userId,
      action: "subject.create",
      entityType: "subject",
      entityId: id,
      metadata: { slug: input.slug },
    });
    return c.json({ data: { id, ...input, isCustom: true } }, 201);
  },
);

adminRoutes.patch(
  "/subjects/:id",
  requirePermission("subjects:manage"),
  rateLimit("admin-write"),
  async (c) => {
    const id = parseId(c.req.param("id"));
    const input = await parseBody(c, subjectUpdateSchema);
    const updated = await c.var.db
      .update(s.subjects)
      .set({ ...input, updatedAt: now() })
      .where(eq(s.subjects.id, id))
      .returning()
      .get();
    if (!updated) throw errors.notFound("Môn học");
    await writeAudit(c.var.db, {
      actorId: c.var.auth!.userId,
      action: "subject.update",
      entityType: "subject",
      entityId: id,
      metadata: { fields: Object.keys(input) },
    });
    return c.json({ data: updated });
  },
);

adminRoutes.delete(
  "/subjects/:id",
  requirePermission("subjects:manage"),
  rateLimit("admin-write"),
  async (c) => {
    const id = parseId(c.req.param("id"));
    const deleted = await c.var.db
      .delete(s.subjects)
      .where(eq(s.subjects.id, id))
      .returning({ id: s.subjects.id })
      .get();
    if (!deleted) throw errors.notFound("Môn học");
    await writeAudit(c.var.db, {
      actorId: c.var.auth!.userId,
      action: "subject.delete",
      entityType: "subject",
      entityId: id,
    });
    return c.json({ data: { id, deleted: true } });
  },
);

// ---------- CMS: khối trang chủ ----------
adminRoutes.get("/homepage-sections", requirePermission("cms:view"), async (c) => {
  const rows = await c.var.db
    .select()
    .from(s.homepageSections)
    .orderBy(asc(s.homepageSections.position));
  return c.json({ data: rows });
});

adminRoutes.patch(
  "/homepage-sections/:id",
  requirePermission("cms:manage"),
  rateLimit("admin-write"),
  async (c) => {
    const id = parseId(c.req.param("id"));
    const input = await parseBody(c, homepageSectionUpdateSchema);
    const db = c.var.db;
    const current = await db
      .select()
      .from(s.homepageSections)
      .where(eq(s.homepageSections.id, id))
      .get();
    if (!current) throw errors.notFound("Khối trang chủ");

    let config: Record<string, unknown> | undefined;
    if (input.config !== undefined) {
      // Cấu hình phải khớp schema của loại khối – không cho phép trường lạ hoặc script.
      const schema = sectionConfigSchemas[current.type as HomepageSectionType];
      const parsed = schema.safeParse(input.config);
      if (!parsed.success) {
        throw new ApiError(
          "validation_failed",
          "Cấu hình khối không hợp lệ",
          parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        );
      }
      config = parsed.data as Record<string, unknown>;
    }

    const updated = await db
      .update(s.homepageSections)
      .set({
        ...(input.titleVi !== undefined ? { titleVi: input.titleVi } : {}),
        ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
        ...(config !== undefined ? { config } : {}),
        updatedAt: now(),
      })
      .where(eq(s.homepageSections.id, id))
      .returning()
      .get();
    await writeAudit(db, {
      actorId: c.var.auth!.userId,
      action: "homepage_section.update",
      entityType: "homepage_section",
      entityId: id,
      metadata: { fields: Object.keys(input) },
    });
    return c.json({ data: updated });
  },
);

/** Sắp xếp lại: `order` phải chứa đúng tất cả ID hiện có. Thực hiện trong một transaction (batch). */
adminRoutes.put(
  "/homepage-sections/order",
  requirePermission("cms:manage"),
  rateLimit("admin-write"),
  async (c) => {
    const input = await parseBody(c, homepageReorderSchema);
    const db = c.var.db;
    const existing = await db.select({ id: s.homepageSections.id }).from(s.homepageSections);
    const existingIds = new Set(existing.map((r) => r.id));
    if (input.order.length !== existingIds.size || input.order.some((id) => !existingIds.has(id))) {
      throw errors.badRequest("Danh sách sắp xếp phải chứa đúng tất cả khối hiện có");
    }
    const ts = now();
    await db.batch(
      input.order.map((id, index) =>
        db
          .update(s.homepageSections)
          .set({ position: index + 1, updatedAt: ts })
          .where(eq(s.homepageSections.id, id)),
      ) as unknown as [never, ...never[]],
    );
    await writeAudit(db, {
      actorId: c.var.auth!.userId,
      action: "homepage_section.reorder",
      entityType: "homepage_section",
      metadata: { count: input.order.length },
    });
    return c.json({ data: { order: input.order } });
  },
);

// ---------- Nhật ký kiểm toán ----------
adminRoutes.get("/audit-logs", requirePermission("audit:view"), async (c) => {
  const { page: p, pageSize, offset } = page(c);
  const [rows, total] = await Promise.all([
    c.var.db
      .select()
      .from(s.auditLogs)
      .orderBy(sql`${s.auditLogs.createdAt} DESC`)
      .limit(pageSize)
      .offset(offset),
    c.var.db.select({ n: count() }).from(s.auditLogs).get(),
  ]);
  return c.json({ data: rows, pagination: { page: p, pageSize, total: total?.n ?? 0 } });
});
