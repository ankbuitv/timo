# Vận hành (tóm tắt)

- **Theo dõi lỗi:** tìm `"level":"error"` trong Workers Logs; mỗi phản hồi lỗi có `requestId`.
- **Đăng nhập thất bại:** log `auth.failed` với `reason` (không ghi token).
- **Vượt quyền:** log `authz.denied` với permission cần thiết.
- **Bootstrap:** log `bootstrap.*`; sau khi thành công, xóa `SETUP_SECRET`.
- **Thay đổi nội dung:** `audit_logs` (xem trong /admin/nhat-ky).
- **Hạn mức free tier:** kiểm tra usage trên dashboard Cloudflare và Supabase hằng tuần.
- **Project Supabase Free bị tạm dừng sau 1 tuần không hoạt động:** kiểm tra và khởi động lại trước khi mở cho người dùng.
