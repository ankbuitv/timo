# Xử lý sự cố

| Triệu chứng                                   | Nguyên nhân thường gặp                                     | Cách xử lý                                                                             |
| --------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Trang chủ hiện "Không tải được nội dung"      | API chưa chạy hoặc proxy sai                               | Chạy `pnpm run dev:api`; kiểm tra `curl localhost:8787/api/health`                     |
| Lỗi 503 "Chưa cấu hình SUPABASE_URL"          | Thiếu biến Worker                                          | Thêm vào `apps/api/.dev.vars` (local) hoặc `vars` (production)                         |
| Trang đăng nhập báo "Chưa cấu hình đăng nhập" | Thiếu `VITE_SUPABASE_*` lúc build                          | Đặt trong `apps/web/.env.local`, khởi động lại Vite                                    |
| 401 "Phiên đăng nhập không hợp lệ"            | Token hết hạn hoặc `SUPABASE_URL` của API khác project web | Đăng nhập lại; kiểm tra cùng một project Supabase                                      |
| 403 khi vào /admin                            | Tài khoản chỉ có vai trò `student`                         | Thực hiện bước khởi tạo quản trị (xem AUTHENTICATION.md)                               |
| "Hệ thống đã được khởi tạo trước đó"          | Bootstrap đã chạy                                          | Đây là hành vi đúng; không thể chạy lại                                                |
| `wrangler d1 migrations apply` báo lỗi        | Migration cũ đã áp dụng một phần                           | Kiểm tra bảng `d1_migrations`; không sửa file migration đã áp dụng – tạo migration mới |
| Deploy bị chặn bởi `verify-deploy-config`     | Còn placeholder `00000000-…`                               | Tạo D1 và cập nhật `database_id`                                                       |
| Lỗi CORS trên trình duyệt                     | Origin không nằm trong `ALLOWED_ORIGINS`                   | Thêm origin (không dùng `*`), deploy lại                                               |
| Tiếng Việt hiển thị sai                       | File không lưu UTF-8                                       | Đảm bảo `.editorconfig` (UTF-8) và `Content-Type: charset=utf-8`                       |
| `node:sqlite` không tồn tại khi test          | Node < 22.13                                               | Nâng cấp Node                                                                          |
| Port 8787/5173 bận                            | Tiến trình cũ                                              | `lsof -i :8787` rồi dừng tiến trình                                                    |
| Dữ liệu trang chủ không đổi sau khi sửa CMS   | Cache 60 giây ở API                                        | Đợi 60 giây hoặc tải lại cứng                                                          |
