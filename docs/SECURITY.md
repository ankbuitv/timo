# Bảo mật

## Đã triển khai

| Biện pháp                                                                                                                                                       | Vị trí                                                        | Kiểm chứng                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| Xác thực JWT phía server (JWKS, issuer, audience, exp)                                                                                                          | `packages/auth`                                               | 6 test (ký khóa thật, token giả, hết hạn, sai issuer, sai sub) |
| RBAC phía server trên mọi route quản trị                                                                                                                        | `middleware/auth.ts`                                          | Test 403 cho học sinh/giáo viên                                |
| Validation Zod strict, giới hạn độ dài, không ký tự điều khiển                                                                                                  | `packages/validation`                                         | 19 test                                                        |
| Liên kết an toàn (chỉ `/…` hoặc `https://`, chặn `javascript:`, `//`, `data:`)                                                                                  | `homepage.ts`                                                 | Test từ chối                                                   |
| Cấu hình CMS không chứa script (schema strict, không trường lạ)                                                                                                 | `sectionConfigSchemas`                                        | Test từ chối `<script>`                                        |
| Không có HTML do người dùng nhập được render                                                                                                                    | Toàn bộ web dùng text React (không `dangerouslySetInnerHTML`) | Rà soát mã                                                     |
| CORS theo allowlist; không `*`                                                                                                                                  | `middleware/security.ts`                                      | Test origin lạ                                                 |
| CSRF: chỉ Bearer token + kiểm tra Origin cho ghi                                                                                                                | `originGuard`                                                 | Test 403/401                                                   |
| Security headers (CSP, nosniff, frame deny, HSTS production, Referrer-Policy)                                                                                   | API và `apps/web/public/_headers`                             | Test                                                           |
| `no-store` cho dữ liệu cá nhân và quản trị                                                                                                                      | `securityHeaders`                                             | Test                                                           |
| Rate limit cho bootstrap và ghi quản trị, **fail-closed** ở staging/production (thiếu binding → 503; thiếu IP → 429)                                            | `middleware/rate-limit.ts`                                    | 3 test (503, 429, thiếu IP); chưa kiểm thử tải thật            |
| Cổng cấu hình: staging/production thiếu biến bắt buộc → mọi `/api/*` trả 503 (log chỉ ghi tên biến)                                                             | `src/config.ts`, `app.ts`                                     | 5 test `validateConfig` + test 503                             |
| JWT: chỉ RS256/ES256/EdDSA, bắt buộc exp/iat/sub/iss/aud, chỉ `role=authenticated`                                                                              | `packages/auth/src/supabase-jwt.ts`                           | 13 test (gồm HS256, token anon, thiếu exp)                     |
| Bootstrap quản trị: email đã xác minh + không bị khóa (Supabase `/auth/v1/user`), email khớp, SETUP_SECRET ≥32 ký tự so sánh hằng thời gian, một transaction D1 | `routes/setup.ts`, `lib/supabase-user.ts`                     | Test email chưa xác minh, tài khoản bị khóa, không lộ secret   |
| Mọi lần từ chối bootstrap được ghi audit (`bootstrap.denied` + lý do)                                                                                           | `routes/setup.ts`                                             | Test kiểm tra audit                                            |
| Migration đã áp dụng bất biến (manifest SHA-256), CI và deploy kiểm tra                                                                                         | `infrastructure/scripts/migration-manifest.mjs`               | Chạy trong CI (`--check`)                                      |
| Migrate D1 tách khỏi deploy; cần reviewer environment + cụm xác nhận `MIGRATE-<env>`                                                                            | `.github/workflows/migrate.yml`                               | Kiểm tra YAML; chưa chạy thật trên GitHub                      |
| Deploy chỉ khi CI thành công trên đúng commit; chặn nếu còn migration pending                                                                                   | `.github/workflows/deploy.yml`                                | Kiểm tra YAML; chưa chạy thật trên GitHub                      |
| Bí mật chỉ đọc từ Worker env; không có khóa trong `VITE_*`                                                                                                      | `.env.example`, `src/env.ts`                                  | Rà soát                                                        |
| Log có cấu trúc, che trường nhạy cảm (password, token, secret, cookie, …)                                                                                       | `lib/logger.ts`                                               | Test                                                           |
| Lỗi 500 không lộ stack/chi tiết cho client                                                                                                                      | `app.onError`                                                 | Rà soát                                                        |
| Audit log cho mọi thay đổi quản trị                                                                                                                             | `lib/audit.ts`                                                | Test kiểm tra metadata không chứa secret                       |
| Chặn open-redirect sau đăng nhập (`next` chỉ là đường dẫn nội bộ)                                                                                               | `LoginPage`                                                   | Rà soát                                                        |
| Cache-Control cho trang học tập/quản trị                                                                                                                        | `_headers` và API                                             | Cấu hình                                                       |

## Khóa AI (Ollama) – đã triển khai

| Biện pháp                                                                                    | Nơi thực hiện                     | Kiểm chứng                      |
| -------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------- |
| Khóa API mã hóa AES-256-GCM (IV ngẫu nhiên 12 byte) trước khi lưu D1                         | `apps/api/src/lib/ai-crypto.ts`   | Test roundtrip + sai khóa       |
| Chỉ trả về dạng che `••••••••XXXX` + vân tay SHA-256 rút gọn; không có endpoint trả khóa gốc | `routes/admin-ai.ts`              | Test kiểm tra body và D1        |
| Khóa mã hóa là Worker secret; thiếu → 503, không tự tạo/không hardcode                       | `lib/ai-router.ts`                | Test 503                        |
| Chống SSRF endpoint: https, allowlist host, chặn IP/nội bộ/credential/path lạ                | `lib/ai-endpoint.ts`              | 3 test (12 URL bị từ chối)      |
| Failover có giới hạn (1–5 lần), backoff nhân đôi tối đa 5s, không retry vô hạn               | `lib/ai-router.ts`                | Test chuyển khóa + số lần sleep |
| 429 KHÔNG chuyển khóa để tránh vượt quota nhà cung cấp                                       | `lib/ai-router.ts`                | Test chỉ 1 lần gọi              |
| Giới hạn theo ngày cho từng khóa; ghi usage theo ngày UTC                                    | `ai_usage_daily`                  | Test daily limit                |
| Audit mọi thao tác (tạo/xoay/sửa/xóa/test/gửi thử), không ghi bí mật                         | `routes/admin-ai.ts`              | Test audit                      |
| RBAC: `ai:manage` chỉ thuộc super_admin; API kiểm tra phía server                            | `@timo/shared`, `middleware/auth` | Test 403 cho học sinh           |

Chi tiết đầy đủ: `docs/AI_KEYS.md`.

## Chưa triển khai (rủi ro còn lại)

- **Phiên đã cấp vẫn hợp lệ đến khi hết hạn** khi tài khoản bị khóa trên Supabase; API chỉ chặn ngay khi hồ sơ local bị `suspended`/`deleted`. Xem docs/SUPABASE.md.
- **Rate limit Cloudflare là eventually consistent và theo vị trí** – chỉ là lớp chống lạm dụng, không phải hạn mức chính xác.

- **Cloudflare Turnstile** chưa có → nguy cơ bot đăng ký/đăng nhập.
- **Giới hạn tốc độ** chưa kiểm thử tải thật; rate limit của Cloudflare là theo IP.
- **Không có chính sách bảo vệ trẻ em đầy đủ** (xác minh phụ huynh, giới hạn tin nhắn, kiểm duyệt nội dung người dùng, báo cáo) – thuộc các giai đoạn sau. Hiện chưa có tính năng tương tác giữa người dùng nên rủi ro hạn chế.
- **CSP:** web dùng `style-src 'unsafe-inline'` vì React/Tailwind sinh inline style; có thể siết bằng nonce khi có SSR.
- **Token trong trình duyệt:** supabase-js lưu session trong localStorage (tiêu chuẩn của Supabase SPA). Mức bảo vệ tương đương việc không có XSS; vì vậy không render HTML người dùng.
- **Không có Web Application Firewall riêng.** Cân nhắc Cloudflare WAF managed rules (gói miễn phí có giới hạn).
- **Xóa tài khoản / xuất dữ liệu cá nhân** chưa có (yêu cầu theo chính sách bảo vệ dữ liệu cá nhân).
- **Chính sách quyền riêng tư và điều khoản** chưa được soạn; cần luật sư/người có thẩm quyền xem xét trước khi mở cho người dùng thật, đặc biệt với học sinh dưới 16 tuổi.

## Báo cáo lỗ hổng

Không công khai trên issue. Liên hệ người vận hành qua kênh riêng (sẽ được bổ sung khi có địa chỉ bảo mật chính thức).
