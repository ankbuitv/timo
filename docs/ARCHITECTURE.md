# Kiến trúc TIMO

## Tổng quan

```
Trình duyệt (SPA)                          Cloudflare
┌──────────────────────┐   /api/*    ┌──────────────────────────┐
│ apps/web             │ ──────────► │ apps/api (Worker + Hono) │
│ Vite + React 19      │             │  • CORS / bảo mật header │
│ React Router         │             │  • xác thực JWT Supabase │
│ TanStack Query       │             │  • RBAC phía server      │
│ Supabase Auth (anon) │             │  • validation Zod        │
└─────────┬────────────┘             └────────────┬─────────────┘
          │ đăng nhập / token                     │ Drizzle ORM
          ▼                                       ▼
   Supabase Auth                         Cloudflare D1 (SQLite)
   (JWKS công khai)                      timo-main / timo-main-staging
```

- **Phát triển cục bộ:** Vite (5173) chuyển tiếp `/api` sang `wrangler dev` (8787). Trình duyệt chỉ gọi đường dẫn tương đối, không gọi `localhost` trực tiếp.
- **Production (dự kiến):** web là static assets; API là Worker riêng. Hai origin khác nhau được ràng buộc bằng `ALLOWED_ORIGINS`. Xem [CLOUDFLARE.md](CLOUDFLARE.md).

## Module

| Package / app         | Vai trò                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| `packages/shared`     | Hằng số nghiệp vụ: cấp học, môn học mặc định, vai trò, quyền, thương hiệu      |
| `packages/validation` | Schema Zod: lớp, môn, cấu hình khối CMS (strict), liên kết an toàn, phân trang |
| `packages/auth`       | Xác thực JWT (jose, JWKS), hợp nhất quyền từ vai trò                           |
| `packages/database`   | Schema Drizzle (`src/schema.ts`), migration SQL (`migrations/`)                |
| `apps/api`            | Route Hono, middleware (bảo mật, CORS, auth, rate limit), audit, logger        |
| `apps/web`            | Trang, layout, provider (theme, auth, query), thành phần UI                    |

## Luồng xác thực và phân quyền

1. Người dùng đăng nhập qua Supabase Auth; web nhận access token.
2. Web gửi `Authorization: Bearer <token>` tới API.
3. API xác minh chữ ký bằng JWKS của Supabase (`issuer`, `audience`, thời hạn), lấy `sub` làm **ID người dùng ổn định**.
4. Lần đầu xuất hiện: tạo hồ sơ `profiles` và gán vai trò `student`.
5. Quyền được tính từ vai trò trong D1 và kiểm tra bằng `requirePermission(...)` ở **mỗi route** quản trị.
6. Web ẩn menu theo quyền chỉ để UX; API vẫn kiểm tra lại.

## Nguyên tắc thiết kế

- **Fail closed:** vai trò không xác định không cấp quyền; cấu hình thiếu → 503 rõ ràng.
- **Không tin client:** mọi body được parse bằng Zod (strict, không trường lạ).
- **Không có mock trong production:** trang trống khi chưa có dữ liệu (EmptyState), không dữ liệu giả.
- **Ghi nhật ký:** mọi thay đổi quản trị ghi `audit_logs`, metadata đã lọc.
- **Giới hạn Worker:** API là truy vấn ngắn; chưa có tác vụ nền. Import hàng loạt sẽ thiết kế theo batch (xem ROADMAP).

## Những gì chưa có trong kiến trúc hiện tại

- `apps/support` (Support Center) và `packages/ui` (tách thư viện UI) – kế hoạch.
- Realtime (Durable Objects) cho Arena – kế hoạch.
- SSR/prerender cho SEO – hiện là SPA (xem SECURITY/ROADMAP).
