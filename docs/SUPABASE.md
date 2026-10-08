# Thiết lập Supabase

## 1. Tạo project

1. Tạo tài khoản và project tại https://supabase.com (gói Free). Chưa kiểm chứng việc đăng ký gói Free có yêu cầu thẻ hay không – nếu có, dừng lại và báo chủ sở hữu.
2. Ghi lại **Project URL** (`https://<project-ref>.supabase.co`) và **anon key** (Project Settings → API).
3. **Service role key là bí mật.** Không đưa vào web, không commit. Chỉ dùng phía server nếu cần.

## 2. Biến môi trường

| Biến                        | Nơi đặt                           | Bí mật?                         |
| --------------------------- | --------------------------------- | ------------------------------- |
| `VITE_SUPABASE_URL`         | `apps/web/.env.local` / build env | Không                           |
| `VITE_SUPABASE_ANON_KEY`    | `apps/web/.env.local` / build env | Không (công khai theo thiết kế) |
| `SUPABASE_URL`              | Worker `vars` (không bí mật)      | Không                           |
| `SUPABASE_SERVICE_ROLE_KEY` | `wrangler secret put`             | **Có**                          |

## 3. Auth

- **Authentication → URL Configuration:** Site URL = `PUBLIC_APP_URL` (ví dụ `https://timovn.dpdns.org`). Redirect URLs: thêm `…/dang-nhap` và `http://localhost:5173/dang-nhap` (phát triển).
- **Email:** bật email/password. Bật xác nhận email trong production.
- **Providers:** bật Google / Facebook / Microsoft (Azure) khi có Client ID/Secret của chính bạn. Callback URL do Supabase cung cấp. **Chưa kiểm thử thực tế.**
- **JWT:** API xác minh bằng JWKS, không cần JWT secret. Nếu project dùng khóa đối xứng cũ, cần cập nhật `packages/auth` (hiện chỉ hỗ trợ RS256/ES256/EdDSA).
- Kiểm tra JWKS mở được: `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.

## 4. Storage (chưa tích hợp vào code)

Bucket dự kiến: `avatars`, `course-images`, `course-videos`, `documents`, `books`, `blog-media`, `submissions`, `support-attachments`. Chọn public/private theo nhu cầu; tài liệu và bài nộp là **private** + signed URL.

**Giới hạn gói Free (theo tài liệu Supabase):**

- Dung lượng file: **1 GB**.
- Kích thước một file tối đa: **50 MB** (giới hạn toàn cục không vượt quá 50 MB trên gói Free).
- Egress: 5 GB; cached egress 5 GB.
- Giới hạn trên có thể thay đổi – kiểm tra [tài liệu giới hạn file](https://supabase.com/docs/guides/storage/uploads/file-limits) và [trang giá](https://supabase.com/pricing).

Hệ quả: video dài không nên lưu trên Supabase Storage gói Free (dùng YouTube/HLS bên ngoài hoặc nâng cấp gói).

## 5. Giới hạn gói Free khác

- 50.000 MAU (người dùng hoạt động hằng tháng), 500 MB database, 5 GB egress.
- **Project tạm dừng sau 1 tuần không hoạt động.** Cần cảnh báo cho người vận hành và có cách khởi động lại.
- Tối đa 2 project đang hoạt động trên gói Free.
- Không có backup tự động/PITR trên gói Free (xem BACKUP.md).

## 6. Kiểm tra nhanh

```bash
curl -s https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json | head -c 200
curl -s https://<project-ref>.supabase.co/auth/v1/settings -H "apikey: <anon-key>"
```

> Các bước trên **chưa được chạy** với project thật trong môi trường phát triển này. Hãy xác nhận trước khi xem đăng nhập là hoạt động.
