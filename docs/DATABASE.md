# Cơ sở dữ liệu (Cloudflare D1 + Drizzle)

Nguồn sự thật cho schema: `packages/database/src/schema.ts`. Migration SQL sinh bởi `drizzle-kit` và nằm trong `packages/database/migrations/`. Wrangler áp dụng chúng theo thứ tự tên file.

## Migration hiện có

| File                              | Nội dung                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `0000_init_schema.sql`            | Tạo 10 bảng, chỉ mục, ràng buộc CHECK                                                                        |
| `0001_seed_rbac_and_defaults.sql` | 7 vai trò, 19 quyền, ánh xạ vai trò–quyền, 12 lớp, 14 môn, 7 khối trang chủ (idempotent: `INSERT OR IGNORE`) |

Tạo migration mới:

```bash
pnpm run db:generate -- --name <mo_ta>        # schema thay đổi → SQL
# Migration dữ liệu thủ công:
cd packages/database && npx drizzle-kit generate --custom --name <mo_ta>
```

## Bảng

| Bảng                | Mục đích                                  | Ghi chú                                                              |
| ------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| `profiles`          | Hồ sơ người dùng                          | `id` = `sub` của Supabase (UUID ổn định); email duy nhất             |
| `roles`             | Vai trò (hệ thống + tùy chỉnh)            | `key` duy nhất; `is_system`                                          |
| `permissions`       | Quyền chi tiết                            | `key` dạng `tài_nguyên:hành_động`                                    |
| `role_permissions`  | N–N vai trò ↔ quyền                       | Khóa chính kép, cascade                                              |
| `user_roles`        | N–N người dùng ↔ vai trò                  | `granted_by` ghi người cấp                                           |
| `grades`            | Lớp 1–12                                  | `CHECK(level BETWEEN 1 AND 12)`, `level` và `slug` duy nhất          |
| `subjects`          | Môn học chuẩn + tùy chỉnh                 | `slug` duy nhất, `is_custom`                                         |
| `homepage_sections` | Khối CMS trang chủ                        | `position`, `config` JSON (kiểm tra bằng Zod trước khi lưu/hiển thị) |
| `audit_logs`        | Nhật ký kiểm toán                         | Chỉ mục theo thời gian, actor, đối tượng                             |
| `system_settings`   | Cờ hệ thống (ví dụ `bootstrap_completed`) | Key–value JSON                                                       |

## Quy ước

- Khóa chính: `TEXT` (UUID v4 hoặc khóa có tiền tố như `grade_1`).
- Thời gian: `INTEGER` Unix **milliseconds** (UTC), mặc định `unixepoch()*1000`.
- Boolean: `INTEGER` 0/1 (Drizzle `mode: "boolean"`).
- Xóa: hiện là xóa cứng cho lớp/môn (chưa có ràng buộc nghiệp vụ tham chiếu). Khi có khóa học, chuyển sang lưu trữ (`archived`) thay vì xóa.

## Chưa có (kế hoạch)

`courses`, `course_modules`, `chapters`, `lessons`, `lesson_progress`, `questions`, `exams`, `exam_attempts`, `classrooms`, `assignments`, `submissions`, `blog_posts`, `community_questions`, `notifications`, `xp_transactions`, `premium_plans`, `subscriptions`, `activation_codes`, `ai_conversations`, `ai_usage`, `tickets`, `ticket_messages`, `books`, … Xem [ROADMAP.md](ROADMAP.md).

## Giới hạn D1 cần nhớ

Xem [CLOUDFLARE.md](CLOUDFLARE.md#giới-hạn-free-tier). Tóm tắt: mỗi truy vấn tính theo số **dòng đọc/ghi**, nên cần chỉ mục và phân trang; dung lượng dùng chung 5 GB cho mọi database trong tài khoản (free).

## Kiểm chứng đã thực hiện

- `wrangler d1 migrations apply timo-main --local` áp dụng thành công cả 2 migration (workerd thật).
- Kiểm thử tích hợp API áp dụng cùng file migration lên SQLite (`node:sqlite`) qua shim D1.
