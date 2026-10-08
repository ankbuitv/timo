import { z } from "zod";

/** Chuỗi an toàn: loại bỏ ký tự điều khiển, giới hạn độ dài. */
export function safeText(max: number, label: string) {
  return (
    z
      .string({ message: `${label} là bắt buộc` })
      .trim()
      .min(1, `${label} không được để trống`)
      .max(max, `${label} tối đa ${max} ký tự`)
      // eslint-disable-next-line no-control-regex
      .refine((v) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v), {
        message: `${label} chứa ký tự không hợp lệ`,
      })
  );
}

export const idSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "ID không hợp lệ");

/** Slug dạng chữ thường không dấu, số và dấu gạch ngang. */
export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug tối thiểu 2 ký tự")
  .max(80, "Slug tối đa 80 ký tự")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const isoLikeDateSchema = z.coerce.number().int().nonnegative();

export type Pagination = z.infer<typeof paginationSchema>;
