import { z } from "zod";
import { idSchema } from "./common.js";

/** Tên khóa: bắt buộc, dễ nhận biết trong bảng quản trị. */
const nameSchema = z
  .string()
  .trim()
  .min(2, "Tên khóa cần ít nhất 2 ký tự")
  .max(60, "Tên khóa tối đa 60 ký tự");

/** Bí mật nhà cung cấp: không trim (khóa có thể chứa ký tự đặc biệt), không log. */
const secretSchema = z
  .string()
  .min(8, "Khóa API quá ngắn")
  .max(400, "Khóa API quá dài")
  .refine((v) => !/\s/.test(v.trim()), "Khóa API không được chứa khoảng trắng");

const baseUrlSchema = z
  .string()
  .trim()
  .max(200, "Endpoint quá dài")
  .url("Endpoint phải là URL hợp lệ");

const modelSchema = z
  .string()
  .trim()
  .min(1, "Tên model không được để trống")
  .max(80, "Tên model tối đa 80 ký tự")
  .regex(/^[A-Za-z0-9._:\-/]+$/, "Tên model chỉ gồm chữ, số và các ký tự . _ : - /");

export const aiKeyCreateSchema = z.object({
  name: nameSchema,
  key: secretSchema,
  baseUrl: baseUrlSchema.optional(),
  model: modelSchema.optional(),
  priority: z.coerce.number().int().min(0).max(1000).default(100),
  isEnabled: z.boolean().default(true),
  /** 0 = không giới hạn theo ngày. */
  dailyRequestLimit: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export const aiKeyUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    baseUrl: baseUrlSchema.optional(),
    model: modelSchema.nullable().optional(),
    priority: z.coerce.number().int().min(0).max(1000).optional(),
    isEnabled: z.boolean().optional(),
    dailyRequestLimit: z.coerce.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Không có thay đổi nào");

export const aiKeyRotateSchema = z.object({ key: secretSchema });

export const aiRouterSettingsSchema = z.object({
  failoverEnabled: z.boolean(),
  maxAttempts: z.coerce.number().int().min(1).max(5),
  backoffBaseMs: z.coerce.number().int().min(0).max(5000),
  timeoutMs: z.coerce.number().int().min(1000).max(120_000),
  defaultModel: modelSchema.nullable(),
});

export const aiPreviewSchema = z.object({
  prompt: z.string().trim().min(1, "Nhập nội dung để gửi thử").max(500, "Tối đa 500 ký tự"),
  model: modelSchema.optional(),
});

export const aiKeyIdParamSchema = z.object({ id: idSchema });

export type AiKeyCreateInput = z.infer<typeof aiKeyCreateSchema>;
export type AiKeyUpdateInput = z.infer<typeof aiKeyUpdateSchema>;
export type AiRouterSettingsInput = z.infer<typeof aiRouterSettingsSchema>;
