# Xác thực, phân quyền và khởi tạo quản trị

## 1. Supabase Auth

- Phương thức đã nối vào giao diện: **email/mật khẩu** (đăng ký, đăng nhập), và **OAuth Google, Facebook, Microsoft** (nút đã có; chỉ hoạt động khi provider được bật trong Supabase).
- **Không** triển khai đăng nhập GitHub (theo đặc tả).
- Web dùng khóa **anon** (công khai) với flow PKCE. Phiên được lưu bởi supabase-js.
- API **không** gọi Supabase để kiểm tra token; xác minh cục bộ bằng JWKS (`/auth/v1/.well-known/jwks.json`), kiểm tra `iss`, `aud = authenticated`, thời hạn (lệch tối đa 5 giây), thuật toán RS256/ES256/EdDSA. `sub` phải là UUID.
- **Stable user ID:** `profiles.id = sub`. Đây là khóa để liên kết tài khoản giữa TIMO Main và TIMO Support (cùng project Supabase).

## 2. Hồ sơ và vai trò mặc định

- Lần đầu gọi API có token hợp lệ: tạo `profiles` (email, tên hiển thị từ phần trước `@`) và gán vai trò `student`.
- Người dùng mới **không** được cấp quyền quản trị.

## 3. Vai trò và quyền

Vai trò hệ thống: `super_admin`, `admin`, `moderator`, `teacher`, `student`, `parent`, `support_agent`.

| Vai trò          | Tóm tắt quyền                                         |
| ---------------- | ----------------------------------------------------- |
| super_admin      | Toàn quyền, gồm `roles:manage`, `settings:manage`     |
| admin            | Toàn quyền trừ quản lý vai trò và cấu hình hệ thống   |
| moderator        | Xem khóa học, kiểm duyệt nội dung, xem người dùng     |
| teacher          | Xem và tạo/sửa/xóa khóa học (chưa có module khóa học) |
| student / parent | Xem lớp, môn, khóa học công khai                      |
| support_agent    | Quản lý hỗ trợ, xem người dùng                        |

Quyền chi tiết: `view / create / update / delete / publish / approve / moderate / manage` theo từng tài nguyên (`users`, `grades`, `subjects`, `cms`, `audit`, `settings`, `courses`, `content`, `support`). Danh sách đầy đủ: `packages/shared/src/roles.ts`.

- Quyền được **hợp nhất** từ mọi vai trò của người dùng.
- Vai trò không xác định → không có quyền (fail closed).
- Vai trò tùy chỉnh: lưu trong `roles` + `role_permissions`, API đã đọc được; **chưa có giao diện tạo vai trò**.

Kiểm tra quyền: `requirePermission("grades:manage")` trong `apps/api/src/middleware/auth.ts`. Giao diện chỉ ẩn/hiện theo quyền, không phải cơ chế bảo mật.

## 4. Khởi tạo quản trị viên đầu tiên (một lần)

Điều kiện đồng thời:

1. Người gọi đăng nhập Supabase thành công.
2. Email tài khoản trùng `INITIAL_ADMIN_EMAIL` (so sánh không phân biệt hoa thường).
3. `setupSecret` trong body khớp `SETUP_SECRET` (so sánh hằng-thời-gian sau băm SHA-256).
4. Hệ thống chưa bootstrap.

Quy trình:

1. Đặt secret: `cd apps/api && pnpm exec wrangler secret put SETUP_SECRET --env production`.
2. Đăng ký/đăng nhập bằng `INITIAL_ADMIN_EMAIL`.
3. Mở `/khoi-tao-quan-tri`, nhập `SETUP_SECRET`.
4. API: `INSERT … ON CONFLICT DO NOTHING` vào `system_settings('bootstrap_completed')`; nếu `changes = 0` → 409. Cấp `super_admin`, ghi `audit_logs` (`bootstrap.completed`).
5. Các lần gọi sau luôn trả 409. Sau bước này nên **xóa** `SETUP_SECRET` (`wrangler secret delete SETUP_SECRET`) và đặt `INITIAL_ADMIN_EMAIL` rỗng.

Không có mật khẩu quản trị mặc định nào trong mã nguồn.

## 5. Những phần theo đặc tả CHƯA triển khai

- Khóa đăng nhập (invitation / activation / course access keys) với băm và hết hạn.
- Xác minh bổ sung cho thao tác nhạy cảm (MFA/TOTP).
- Cloudflare Turnstile trên đăng ký/đăng nhập.
- Đăng nhập Facebook/Microsoft **chưa được kiểm thử** với provider thật.
- Quản lý vai trò qua giao diện, gán/thu hồi vai trò cho người dùng.
