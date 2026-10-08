# Cloudflare: Workers, D1, domain và giới hạn free tier

## Tài khoản và kiểm tra domain (BẮT BUỘC trước khi deploy production)

Chưa được kiểm chứng trong môi trường phát triển (không có thông tin đăng nhập Cloudflare). Trước khi deploy:

1. `pnpm exec wrangler login` (hoặc đặt `CLOUDFLARE_API_TOKEN` với quyền Workers Scripts, D1, Workers Routes/Custom Domains).
2. Kiểm tra zone `dpdns.org` / các hostname `timovn.dpdns.org`, `support.timovn.dpdns.org`, `status.timovn.dpdns.org`:
   - Tài khoản có quản lý được zone không? (Nếu `dpdns.org` là tên miền bên thứ ba, cần xác nhận DNS có thể trỏ về Cloudflare.)
   - Có thể tạo Custom Domain cho Worker không? Hostname đã có bản ghi DNS khác chưa?
3. Nếu không cấu hình được domain: dùng **workers.dev** làm fallback (`timo-api.<subdomain>.workers.dev`) và đặt `PUBLIC_APP_URL`, `ALLOWED_ORIGINS` tương ứng.

**Không** gọi deploy production trước khi bước này được xác nhận.

## Hai Worker

| Worker                                       | Đường dẫn       | Ghi chú                                                     |
| -------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `timo-api` (production) / `timo-api-staging` | `apps/api`      | Hono; route `/api/*`                                        |
| Web                                          | `apps/web/dist` | Static assets (Workers Static Assets hoặc Cloudflare Pages) |

Cấu hình: `apps/api/wrangler.jsonc`. Môi trường: `staging`, `production` (tách D1, rate limit namespace, biến).

## D1

- Production: `timo-main`; staging: `timo-main-staging`. **Hai database riêng.** Tạo bằng:
  ```bash
  pnpm exec wrangler d1 create timo-main
  pnpm exec wrangler d1 create timo-main-staging
  ```
  Sao chép `database_id` vào `wrangler.jsonc` (thay placeholder `00000000-…`). Script `infrastructure/scripts/verify-deploy-config.mjs` sẽ chặn deploy nếu còn placeholder.
- Support D1 (`timo-support`) sẽ tạo khi có `apps/support`.
- Migration: `pnpm exec wrangler d1 migrations apply timo-main --remote --env production`.

## Rate limiting

`ratelimits` binding `SENSITIVE_RATE_LIMITER` (20 yêu cầu/60 giây theo khóa). Khóa = `scope:IP` (`CF-Connecting-IP`). Namespace ID phải là số duy nhất trong tài khoản; các ID trong `wrangler.jsonc` (1001–1003) cần kiểm tra không trùng.

## Observability

`observability.enabled = true` trong `wrangler.jsonc`. Log từ `lib/logger.ts` là JSON một dòng, có thể lọc trong Workers Logs. Chưa có dashboard/alert cấu hình sẵn.

## Giới hạn free tier (kiểm tra lại trước khi dựa vào số liệu)

Số liệu tổng hợp từ các nguồn công khai tại thời điểm viết tài liệu (2026). **Cloudflare thay đổi giới hạn thường xuyên – xác minh tại trang giá chính thức trước khi quyết định.**

| Dịch vụ                   | Free tier (theo tổng hợp)            | Ảnh hưởng tới TIMO                                       |
| ------------------------- | ------------------------------------ | -------------------------------------------------------- |
| Workers                   | Có gói Free (không cần thẻ)          | Giới hạn request/CPU mỗi ngày; API hiện là truy vấn ngắn |
| D1 – đọc                  | ~5 triệu dòng/ngày                   | Phân trang + chỉ mục; tránh quét toàn bảng               |
| D1 – ghi                  | ~100.000 dòng/ngày                   | Import hàng loạt phải chia batch; audit log ghi nhiều    |
| D1 – dung lượng           | 5 GB **dùng chung cho mọi database** | Đặt giới hạn lưu trữ log và retention                    |
| Truy vấn khi vượt hạn mức | Bị từ chối trong ngày                | Theo dõi bằng dashboard; cần cảnh báo sớm                |

Nguồn tham khảo: [freetier.co – Cloudflare D1](https://freetier.co/articles/cloudflare-d1-free-tier-limits-pricing-and-alternatives), [flarecalc – D1](https://flarecalc.com/calculators/d1/). Đề nghị đối chiếu với [trang giá Cloudflare Developer Platform](https://developers.cloudflare.com/d1/platform/pricing/).

**Thẻ tín dụng:** gói Workers Free và D1 Free không yêu cầu thẻ theo các nguồn trên. Nếu Cloudflare yêu cầu thẻ cho bất kỳ bước nào, **dừng lại và báo chủ sở hữu** trước khi tiếp tục.

## Chi phí phát sinh cần cân nhắc

- Chuyển sang Workers Paid (~5 USD/tháng theo nguồn trên) khi vượt hạn mức đọc/ghi hoặc cần Durable Objects cho Arena.
- Durable Objects có thể yêu cầu gói trả phí tùy thời điểm; kiểm tra trước khi thiết kế Arena (xem ROADMAP).
