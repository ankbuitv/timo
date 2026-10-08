import { z } from "zod";
import { safeText, slugSchema } from "./common.js";

export const educationStageSchema = z.enum(["primary", "lower_secondary", "upper_secondary"]);

export const gradeCreateSchema = z
  .object({
    level: z.number().int().min(1, "Lớp tối thiểu là 1").max(12, "Lớp tối đa là 12"),
    slug: slugSchema,
    nameVi: safeText(100, "Tên lớp"),
    stage: educationStageSchema,
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(1000).default(0),
  })
  .strict()
  .superRefine((value, ctx) => {
    const expected =
      value.level <= 5 ? "primary" : value.level <= 9 ? "lower_secondary" : "upper_secondary";
    if (value.stage !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["stage"],
        message: `Lớp ${value.level} thuộc cấp ${expected === "primary" ? "Tiểu học" : expected === "lower_secondary" ? "THCS" : "THPT"}`,
      });
    }
  });

export const gradeUpdateSchema = z
  .object({
    slug: slugSchema.optional(),
    nameVi: safeText(100, "Tên lớp").optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(1000).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Không có trường nào để cập nhật" });

export type GradeCreateInput = z.infer<typeof gradeCreateSchema>;
export type GradeUpdateInput = z.infer<typeof gradeUpdateSchema>;
