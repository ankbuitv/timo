/**
 * Mã hóa bí mật AI bằng AES-256-GCM qua Web Crypto (có sẵn trong Cloudflare Workers).
 *
 * Quy tắc bất di bất dịch:
 * - Khóa mã hóa (`TIMO_AI_ENCRYPTION_KEY`) là Worker secret, KHÔNG lưu trong D1, KHÔNG hardcode.
 * - Khóa API nhà cung cấp chỉ được lưu ở dạng bản mã; không bao giờ trả lại nguyên văn cho client.
 * - Không ghi khóa vào log, audit hay thông báo lỗi.
 */
import { errors } from "./errors.js";

const IV_BYTES = 12;
const KEY_BYTES = 32;

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  last4: string;
  fingerprint: string;
}

/** Giải mã chuỗi base64 thành mảng byte; trả về null nếu không hợp lệ. */
function fromBase64(value: string): Uint8Array | null {
  try {
    const binary = atob(value.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromHex(value: string): Uint8Array | null {
  const hex = value.trim();
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/**
 * Đọc khóa mã hóa từ secret. Chấp nhận base64 (44 ký tự) hoặc hex (64 ký tự) của 32 byte.
 * Chỉ ném lỗi với thông báo chung – không bao giờ kèm giá trị.
 */
export function parseEncryptionKey(raw: string | undefined): Uint8Array {
  const value = raw?.trim() ?? "";
  if (!value) throw errors.unavailable("Chưa cấu hình TIMO_AI_ENCRYPTION_KEY cho môi trường này");
  const bytes = value.length === 64 ? fromHex(value) : fromBase64(value);
  if (!bytes || bytes.length !== KEY_BYTES) {
    throw errors.unavailable(
      "TIMO_AI_ENCRYPTION_KEY không hợp lệ: cần 32 byte ngẫu nhiên ở dạng base64 hoặc hex",
    );
  }
  return bytes;
}

async function importKey(
  secret: string | undefined,
  usage: "encrypt" | "decrypt",
): Promise<CryptoKey> {
  const bytes = parseEncryptionKey(secret);
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [usage]);
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Vân tay rút gọn để phát hiện xoay khóa; không thể dùng để khôi phục khóa. */
export async function fingerprintOf(secret: string): Promise<string> {
  return (await sha256Hex(secret)).slice(0, 16);
}

/** Dạng che hiển thị cho quản trị viên: ••••••••XXXX */
export function maskSecret(last4: string): string {
  return `${"•".repeat(8)}${last4}`;
}

export async function encryptSecret(
  plaintext: string,
  encryptionKey: string | undefined,
): Promise<EncryptedSecret> {
  const key = await importKey(encryptionKey, "encrypt");
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    last4: plaintext.slice(-4),
    fingerprint: await fingerprintOf(plaintext),
  };
}

/** Giải mã để gọi nhà cung cấp. Lỗi được chuẩn hóa, KHÔNG chứa bí mật. */
export async function decryptSecret(
  record: { secretCiphertext: string; secretIv: string },
  encryptionKey: string | undefined,
): Promise<string> {
  const key = await importKey(encryptionKey, "decrypt");
  const iv = fromBase64(record.secretIv);
  const data = fromBase64(record.secretCiphertext);
  if (!iv || !data) throw errors.unavailable("Dữ liệu khóa AI bị hỏng, cần nhập lại khóa");
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plaintext);
  } catch {
    // Sai khóa mã hóa hoặc bản mã bị sửa: không tiết lộ chi tiết nội bộ.
    throw errors.unavailable(
      "Không giải mã được khóa AI. Kiểm tra TIMO_AI_ENCRYPTION_KEY có đúng với khóa đã nhập không.",
    );
  }
}
