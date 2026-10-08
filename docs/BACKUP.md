# Sao lưu và khôi phục

> **Quan trọng:** xuất JSON **không** phải là bản sao lưu cơ sở dữ liệu hoàn chỉnh. Cần sao lưu D1 và Storage riêng.

## Thành phần cần sao lưu

| Thành phần                    | Nơi lưu                           | Cách sao lưu                                                              |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| Cơ sở dữ liệu nghiệp vụ       | Cloudflare D1 (`timo-main`)       | Export SQL bằng Wrangler theo lịch                                        |
| Migration / mã nguồn          | GitHub                            | Đã có trong Git                                                           |
| Tệp người dùng tải lên        | Supabase Storage (khi triển khai) | Tải định kỳ qua API bằng service key ở máy vận hành                       |
| Thông tin xác thực người dùng | Supabase Auth                     | Sao lưu của Supabase (gói Free **không** có backup tự động – xem dưới)    |
| Bí mật (secret)               | Cloudflare / GitHub Environment   | Ghi trong trình quản lý mật khẩu của người vận hành, **không** trong repo |

## Sao lưu D1

```bash
# Xuất toàn bộ schema + dữ liệu (SQL)
cd apps/api
pnpm exec wrangler d1 export timo-main --remote --output ../../backups/timo-main-$(date +%F).sql
# Chỉ schema
pnpm exec wrangler d1 export timo-main --remote --no-data --output ../../backups/schema-$(date +%F).sql
```

- Thư mục `backups/` **không** được commit (đã thêm vào `.gitignore`). Lưu ở nơi an toàn có mã hóa.
- Lịch khuyến nghị: hằng ngày cho production (chạy thủ công hoặc GitHub Actions có secret). Giữ tối thiểu 30 bản.
- Lưu ý free tier: export tiêu tốn đọc dòng; nên chạy ngoài giờ cao điểm.

## Khôi phục D1

1. Tạo database mới (ví dụ `timo-main-restore`) và cập nhật `database_id` trong bản staging để thử.
2. Import: `pnpm exec wrangler d1 execute timo-main-restore --remote --file=backups/timo-main-YYYY-MM-DD.sql`.
3. Kiểm tra: số dòng bảng `grades` (12), `roles` (7), `permissions` (19), `user_roles` còn đúng.
4. Chỉ chuyển Worker sang database khôi phục sau khi kiểm tra.

## Sao lưu / khôi phục Storage (khi có)

- Dùng API của Supabase Storage (service key ở máy vận hành, KHÔNG ở trình duyệt) để liệt kê và tải từng bucket theo lịch.
- Khôi phục: tải lên lại vào bucket tương ứng, giữ nguyên đường dẫn đối tượng vì D1 tham chiếu tới đó.

## Kiểm thử khôi phục (định kỳ)

- Hằng quý: khôi phục bản mới nhất vào database staging, chạy migration kiểm tra, ghi kết quả vào nhật ký vận hành.
- Chưa có kết quả kiểm thử khôi phục thực tế nào trong repo này.

## Hạn chế của gói Free

- Supabase Free: không có backup tự động/PITR → phải tự sao lưu Storage và dữ liệu quan trọng.
- Cloudflare D1: khôi phục theo thời điểm (Time Travel) có giới hạn theo gói; không nên dựa vào đó làm sao lưu duy nhất – kiểm tra tài liệu hiện hành.
