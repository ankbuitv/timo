import { z } from "zod";

export const bootstrapSchema = z
  .object({
    /** Bí mật cài đặt một lần – lấy từ Cloudflare Secret SETUP_SECRET. */
    setupSecret: z.string().min(16).max(256),
  })
  .strict();

export type BootstrapInput = z.infer<typeof bootstrapSchema>;
