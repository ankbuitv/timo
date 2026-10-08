import { ApiRequestError } from "./api";

/** Chuẩn hóa lỗi để hiển thị toast: kèm chi tiết từng trường khi có. */
export function describeError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (Array.isArray(err.details) && err.details.length > 0) {
      const first = err.details[0] as { path?: string; message?: string };
      return first.message ? `${first.path ? first.path + ": " : ""}${first.message}` : err.message;
    }
    return err.message;
  }
  return "Đã xảy ra lỗi không xác định.";
}
