import { config } from "./config";
import { getSupabase } from "./supabase";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiEnvelope<T> {
  data: T;
  pagination?: Pagination;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Gửi Bearer token nếu người dùng đã đăng nhập. Mặc định: true. */
  auth?: boolean;
  signal?: AbortSignal;
}

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Gọi API TIMO. Token được lấy từ phiên Supabase và chỉ gửi qua header Authorization.
 * Lỗi được chuẩn hóa thành ApiRequestError với thông điệp tiếng Việt từ server.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${config.apiBaseUrl}/api${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "omit",
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiRequestError(
      "Không thể kết nối tới máy chủ TIMO. Kiểm tra mạng và thử lại.",
      0,
      "network_error",
    );
  }

  const json = (await res.json().catch(() => null)) as
    | (ApiEnvelope<T> & { error?: undefined })
    | { error: { code: string; message: string; details?: unknown } }
    | null;

  if (!res.ok || !json || "error" in json) {
    const err = json && "error" in json ? json.error : undefined;
    throw new ApiRequestError(
      err?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.",
      res.status,
      err?.code ?? "unknown_error",
      err?.details,
    );
  }
  return json as ApiEnvelope<T>;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
