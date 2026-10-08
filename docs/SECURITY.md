# Bảo mật

## Đã triển khai

| Biện pháp                                                                      | Vị trí                                                        | Kiểm chứng                                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------- |
| Xác thực JWT phía server (JWKS, issuer, audience, exp)                         | `packages/auth`                                               | 6 test (ký khóa thật, token giả, hết hạn, sai issuer, sai sub) |
| RBAC phía server trên mọi route quản trị                                       | `middleware/auth.ts`                                          | Test 403 cho học sinh/giáo viên                                |
| Validation Zod strict, giới hạn độ dài, không ký tự điều khiển                 | `packages/validation`                                         | 19 test                                                        |
| Liên kết an toàn (chỉ `/…` hoặc `https://`, chặn `javascript:`, `//`, `data:`) | `homepage.ts`                                                 | Test từ chối                                                   |
| Cấu hình CMS không chứa script (schema strict, không trường lạ)                | `sectionConfigSchemas`                                        | Test từ chối `<script>`                                        |
| Không có HTML do người dùng nhập được render                                   | Toàn bộ web dùng text React (không `dangerouslySetInnerHTML`) | Rà soát mã                                                     |
| CORS theo allowlist; không `*`                                                 | `middleware/security.ts`                                      | Test origin lạ                                                 |
| CSRF: chỉ Bearer token + kiểm tra Origin cho ghi                               | `originGuard`                                                 | Test 403/401                                                   |
| Security headers (CSP, nosniff, frame deny, HSTS production, Referrer-Policy)  | API và `apps/web/public/_headers`                             | Test                                                           |
| `no-store` cho dữ liệu cá nhân và quản trị                                     | `securityHeaders`                                             | Test                                                           |
| Rate limit cho bootstrap và ghi quản trị                                       | Cloudflare Rate Limiting binding                              | Cấu hình; chưa kiểm thử tải thật                               |
| Bí mật chỉ đọc từ Worker env; không có khóa trong `VITE_*`                     | `.env.example`, `src/env.ts`                                  | Rà soát                                                        |
| Log có cấu trúc, che trường nhạy cảm (password, token, secret, cookie, …)      | `lib/logger.ts`                                               | Test                                                           |
| Lỗi 500 không lộ stack/chi tiết cho client                                     | `app.onError`                                                 | Rà soát                                                        |
| Audit log cho mọi thay đổi quản trị                                            | `lib/audit.ts`                                                | Test kiểm tra metadata không chứa secret                       |
| Chặn open-redirect sau đăng nhập (`next` chỉ là đường dẫn nội bộ)              | `LoginPage`                                                   | Rà soát                                                        |
| Cache-Control cho trang học tập/quản trị                                       | `_headers` và API                                             | Cấu hình                                                       |

## Chưa triển khai (rủi ro còn lại)

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
