import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_failed"
  | "rate_limited"
  | "service_unavailable"
  | "internal_error";

const STATUS: Record<ApiErrorCode, ContentfulStatusCode> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation_failed: 422,
  rate_limited: 429,
  service_unavailable: 503,
  internal_error: 500,
};

export class ApiError extends Error {
  readonly status: ContentfulStatusCode;
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = STATUS[code];
  }
}

export const errors = {
  badRequest: (msg: string) => new ApiError("bad_request", msg),
  unauthorized: (msg = "Cần đăng nhập để thực hiện thao tác này") =>
    new ApiError("unauthorized", msg),
  forbidden: (msg = "Bạn không có quyền thực hiện thao tác này") => new ApiError("forbidden", msg),
  notFound: (what = "Dữ liệu") => new ApiError("not_found", `${what} không tồn tại`),
  conflict: (msg: string) => new ApiError("conflict", msg),
  unavailable: (msg: string) => new ApiError("service_unavailable", msg),
  rateLimited: (msg = "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút") =>
    new ApiError("rate_limited", msg),
};
