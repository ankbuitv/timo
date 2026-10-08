/**
 * Chuẩn hóa và kiểm tra endpoint AI – chống SSRF.
 *
 * Chỉ chấp nhận:
 * - https (không bao giờ http, trừ khi bật rõ ràng cho môi trường phát triển cục bộ);
 * - host nằm trong allowlist (mặc định `ollama.com`, mở rộng bằng biến AI_ALLOWED_HOSTS);
 * - không có thông tin đăng nhập trong URL, không phải IP literal, không phải host nội bộ;
 * - cổng mặc định 443; đường dẫn chỉ được là "" hoặc "/api".
 */
import { errors } from "./errors.js";

export const DEFAULT_AI_ALLOWED_HOSTS = ["ollama.com"] as const;
export const DEFAULT_AI_BASE_URL = "https://ollama.com/api";

const INTERNAL_SUFFIXES = [".local", ".internal", ".localhost", ".home.arpa"];

export function allowedAiHosts(env: { AI_ALLOWED_HOSTS?: string }): string[] {
  const raw = (env.AI_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return raw.length > 0 ? raw : [...DEFAULT_AI_ALLOWED_HOSTS];
}

function isIpLiteral(host: string): boolean {
  if (host.startsWith("[") || host.includes(":")) return true; // IPv6
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function hostAllowed(host: string, allowlist: string[]): boolean {
  return allowlist.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/**
 * Trả về URL gốc đã chuẩn hóa (không có dấu `/` cuối) hoặc ném lỗi 400 mô tả lý do bằng tiếng Việt.
 */
export function normalizeAiBaseUrl(raw: string, allowlist: string[]): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw errors.badRequest("Endpoint AI không phải URL hợp lệ");
  }
  if (url.protocol !== "https:") throw errors.badRequest("Endpoint AI phải dùng https");
  if (url.username || url.password)
    throw errors.badRequest("Endpoint AI không được chứa thông tin đăng nhập");
  if (url.search || url.hash)
    throw errors.badRequest("Endpoint AI không được chứa query hoặc hash");

  const host = url.hostname.toLowerCase();
  if (isIpLiteral(host)) throw errors.badRequest("Endpoint AI không được là địa chỉ IP");
  if (host === "localhost" || INTERNAL_SUFFIXES.some((s) => host.endsWith(s)))
    throw errors.badRequest("Endpoint AI không được trỏ vào host nội bộ");
  if (!hostAllowed(host, allowlist))
    throw errors.badRequest(`Host ${host} không nằm trong danh sách cho phép (AI_ALLOWED_HOSTS)`);
  if (url.port && url.port !== "443") throw errors.badRequest("Endpoint AI chỉ dùng cổng 443");

  const path = url.pathname.replace(/\/+$/, "");
  if (path !== "" && path !== "/api")
    throw errors.badRequest("Endpoint AI chỉ nhận đường dẫn gốc hoặc /api");

  return `${url.protocol}//${url.host}${path}`;
}

/** Ghép đường dẫn con (ví dụ /chat) vào URL gốc đã chuẩn hóa. */
export function aiEndpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
