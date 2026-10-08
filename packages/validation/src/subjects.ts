import { z } from "zod";
import { safeText, slugSchema } from "./common.js";

export const subjectCreateSchema = z
  .object({
    slug: slugSchema,
    nameVi: safeText(120, "Tên môn học"),
    description: safeText(500, "Mô tả").optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(1000).default(0),
  })
  .strict();

export const subjectUpdateSchema = z
  .object({
    nameVi: safeText(120, "Tên môn học").optional(),
    description: safeText(500, "Mô tả").nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(1000).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Không có trường nào để cập nhật" });

export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>;
export type SubjectUpdateInput = z.infer<typeof subjectUpdateSchema>;
