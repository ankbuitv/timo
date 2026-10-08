import { z } from "zod";
import { safeText } from "./common.js";

/**
 * Liên kết nội bộ hoặc https. Chặn `javascript:`, `data:` và các scheme khác.
 */
export const safeHrefSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => (v.startsWith("/") && !v.startsWith("//") ? true : /^https:\/\//i.test(v)), {
    message: "Liên kết chỉ được là đường dẫn nội bộ (/...) hoặc https://",
  });

const sectionTypes = [
  "hero",
  "announcement",
  "grades",
  "featured_courses",
  "subjects",
  "features",
  "cta",
] as const;

/** Cấu hình theo từng loại khối – kiểm tra nghiêm ngặt, không cho phép trường lạ. */
export const sectionConfigSchemas = {
  hero: z
    .object({
      slides: z
        .array(
          z
            .object({
              title: safeText(160, "Tiêu đề slide"),
              subtitle: safeText(400, "Mô tả slide").optional(),
              ctaLabel: safeText(60, "Nhãn nút").optional(),
              ctaHref: safeHrefSchema.optional(),
            })
            .strict(),
        )
        .min(1)
        .max(10),
    })
    .strict(),
  announcement: z
    .object({
      message: safeText(300, "Nội dung thông báo"),
      tone: z.enum(["info", "success", "warning"]).default("info"),
      enabled: z.boolean().default(true),
    })
    .strict(),
  grades: z
    .object({ groups: z.array(z.enum(["primary", "lower_secondary", "upper_secondary"])).min(1) })
    .strict(),
  featured_courses: z
    .object({ limit: z.number().int().min(1).max(12), note: safeText(200, "Ghi chú").optional() })
    .strict(),
  subjects: z.object({ limit: z.number().int().min(1).max(24) }).strict(),
  features: z
    .object({
      items: z
        .array(
          z
            .object({
              title: safeText(120, "Tiêu đề"),
              description: safeText(400, "Mô tả"),
            })
            .strict(),
        )
        .min(1)
        .max(12),
    })
    .strict(),
  cta: z.object({ ctaLabel: safeText(60, "Nhãn nút"), ctaHref: safeHrefSchema }).strict(),
} as const;

export const homepageSectionUpdateSchema = z
  .object({
    titleVi: safeText(160, "Tiêu đề khối").optional(),
    isEnabled: z.boolean().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Không có trường nào để cập nhật" });

/** Sắp xếp lại toàn bộ khối: danh sách ID theo thứ tự mới, không trùng lặp. */
export const homepageReorderSchema = z
  .object({
    order: z
      .array(z.string().min(1).max(64))
      .min(1)
      .max(50)
      .refine((ids) => new Set(ids).size === ids.length, { message: "Danh sách khối bị trùng" }),
  })
  .strict();

export { sectionTypes };
export type HomepageSectionType = (typeof sectionTypes)[number];
