import { Hono } from "hono";
import * as s from "@timo/database/schema";
import { asc, eq } from "drizzle-orm";
import { sectionConfigSchemas } from "@timo/validation";
import type { AppBindings } from "../middleware/auth.js";
import { log } from "../lib/logger.js";

export const publicRoutes = new Hono<AppBindings>();

publicRoutes.get("/grades", async (c) => {
  const rows = await c.var.db
    .select({
      id: s.grades.id,
      level: s.grades.level,
      slug: s.grades.slug,
      nameVi: s.grades.nameVi,
      stage: s.grades.stage,
    })
    .from(s.grades)
    .where(eq(s.grades.isActive, true))
    .orderBy(asc(s.grades.sortOrder), asc(s.grades.level));
  return c.json({ data: rows });
});

publicRoutes.get("/subjects", async (c) => {
  const rows = await c.var.db
    .select({
      id: s.subjects.id,
      slug: s.subjects.slug,
      nameVi: s.subjects.nameVi,
      description: s.subjects.description,
    })
    .from(s.subjects)
    .where(eq(s.subjects.isActive, true))
    .orderBy(asc(s.subjects.sortOrder), asc(s.subjects.nameVi));
  return c.json({ data: rows });
});

/**
 * Cấu trúc trang chủ đã xuất bản. Cấu hình được kiểm tra lại bằng Zod trước khi trả về,
 * khối không hợp lệ bị loại bỏ thay vì làm hỏng toàn bộ trang.
 */
publicRoutes.get("/homepage", async (c) => {
  const rows = await c.var.db
    .select()
    .from(s.homepageSections)
    .where(eq(s.homepageSections.isEnabled, true))
    .orderBy(asc(s.homepageSections.position));

  const data = rows.flatMap((row) => {
    const schema = sectionConfigSchemas[row.type];
    const parsed = schema.safeParse(row.config);
    if (!parsed.success) {
      log("warn", "homepage.section_invalid", { sectionKey: row.key, type: row.type });
      return [];
    }
    return [{ key: row.key, type: row.type, titleVi: row.titleVi, config: parsed.data }];
  });
  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return c.json({ data });
});
