# Tài liệu API TIMO

Base path: `/api`. Định dạng: JSON, UTF-8. Tất cả thời gian là Unix milliseconds (UTC).

## Quy ước

**Thành công**

```json
{ "data": ..., "pagination": { "page": 1, "pageSize": 20, "total": 42 } }
```

`pagination` chỉ có ở danh sách có phân trang.

**Lỗi**

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Dữ liệu không hợp lệ",
    "details": [{ "path": "stage", "message": "..." }]
  },
  "requestId": "…"
}
```

| HTTP | `code`                | Ý nghĩa                                          |
| ---- | --------------------- | ------------------------------------------------ |
| 400  | `bad_request`         | JSON sai, tham số sai                            |
| 401  | `unauthorized`        | Thiếu/không hợp lệ/hết hạn token                 |
| 403  | `forbidden`           | Thiếu quyền, sai origin, tài khoản bị khóa       |
| 404  | `not_found`           | Không tồn tại                                    |
| 409  | `conflict`            | Trùng dữ liệu, đã bootstrap                      |
| 422  | `validation_failed`   | Không qua schema Zod (kèm `details`)             |
| 429  | `rate_limited`        | Vượt giới hạn tốc độ                             |
| 503  | `service_unavailable` | Thiếu cấu hình (ví dụ `SUPABASE_URL`)            |
| 500  | `internal_error`      | Lỗi không lường trước (không lộ chi tiết nội bộ) |

Mọi phản hồi có `X-Request-Id`. Dùng ID này khi báo lỗi.

## Endpoint công khai (không cần đăng nhập)

| Method | Đường dẫn              | Mô tả                                                                                           |
| ------ | ---------------------- | ----------------------------------------------------------------------------------------------- |
| GET    | `/api/health`          | Trạng thái dịch vụ, phiên bản, môi trường                                                       |
| GET    | `/api/public/grades`   | Danh sách lớp đang mở, sắp xếp theo thứ tự                                                      |
| GET    | `/api/public/subjects` | Danh sách môn học đang mở                                                                       |
| GET    | `/api/public/homepage` | Khối trang chủ đã bật; cấu hình được kiểm tra lại trước khi trả về (khối lỗi bị bỏ qua, có log) |
| GET    | `/api/setup/status`    | Cho biết hệ thống đã khởi tạo quản trị viên chưa                                                |

## Endpoint người dùng đã đăng nhập

| Method | Đường dẫn              | Quyền                            | Mô tả                                                              |
| ------ | ---------------------- | -------------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/me`              | đăng nhập                        | Hồ sơ, vai trò, danh sách quyền. Tự tạo hồ sơ lần đầu              |
| POST   | `/api/setup/bootstrap` | đăng nhập + email + SETUP_SECRET | Khởi tạo Super Admin, **một lần** (body: `{ "setupSecret": "…" }`) |

## Endpoint quản trị (`/api/admin/*`)

| Method | Đường dẫn                   | Quyền                                                     |
| ------ | --------------------------- | --------------------------------------------------------- |
| GET    | `/overview`                 | `users:view`                                              |
| GET    | `/users?page&pageSize&q`    | `users:view`                                              |
| GET    | `/grades`                   | `grades:view`                                             |
| POST   | `/grades`                   | `grades:manage`                                           |
| PATCH  | `/grades/:id`               | `grades:manage`                                           |
| DELETE | `/grades/:id`               | `grades:manage`                                           |
| GET    | `/subjects`                 | `subjects:view`                                           |
| POST   | `/subjects`                 | `subjects:manage`                                         |
| PATCH  | `/subjects/:id`             | `subjects:manage`                                         |
| DELETE | `/subjects/:id`             | `subjects:manage`                                         |
| GET    | `/homepage-sections`        | `cms:view`                                                |
| PATCH  | `/homepage-sections/:id`    | `cms:manage` (`titleVi`, `isEnabled`, `config`)           |
| PUT    | `/homepage-sections/order`  | `cms:manage` (`{ "order": [id…] }` – phải đủ tất cả khối) |
| GET    | `/audit-logs?page&pageSize` | `audit:view`                                              |

### Ví dụ

```bash
# Tạo môn học tùy chỉnh
curl -X POST https://<api>/api/admin/subjects \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"slug":"robot-lap-trinh","nameVi":"Robot và Lập trình"}'
```

## Ràng buộc bảo mật áp dụng cho API

- **Bearer token** trong header; không dùng cookie → không có CSRF theo cookie. Thêm lớp kiểm tra: ghi (POST/PUT/PATCH/DELETE) bắt buộc có `Authorization`, và nếu có `Origin` thì phải thuộc `ALLOWED_ORIGINS`.
- **CORS** chỉ phản hồi origin trong `ALLOWED_ORIGINS`; không dùng `*`.
- **Security headers** trên mọi phản hồi (`nosniff`, `X-Frame-Options: DENY`, CSP `default-src 'none'`, HSTS ở production). `Cache-Control: no-store` cho `/api/admin/*` và `/api/me`.
- **Rate limit** (Cloudflare Rate Limiting binding) cho bootstrap và các thao tác ghi quản trị. Không có binding (phát triển cục bộ) thì bỏ qua và ghi log debug.
- Body JSON bị giới hạn bởi schema; không có trường lạ (`strict`).

## Chưa có

Endpoint cho khóa học, bài học, bài tập, thi, thư viện, blog, cộng đồng, AI, lớp học, phụ huynh, thông báo, hỗ trợ… (xem ROADMAP). Không có endpoint nào trả dữ liệu giả.
