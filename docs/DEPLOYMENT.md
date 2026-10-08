# Triển khai (Deployment)

> **Trạng thái hiện tại: CHƯA DEPLOY.** Repo có cấu hình và workflow, nhưng chưa có tài khoản Cloudflare/Supabase thật được kiểm tra trong môi trường phát triển. Không coi bất kỳ URL production nào là đang hoạt động cho đến khi có kiểm tra health thành công.

## Môi trường

| Môi trường | API Worker           | D1                  | Web                                  | Ghi chú                                  |
| ---------- | -------------------- | ------------------- | ------------------------------------ | ---------------------------------------- |
| Local      | `wrangler dev` :8787 | D1 local (SQLite)   | Vite :5173                           | Không cần tài khoản                      |
| Staging    | `timo-api-staging`   | `timo-main-staging` | `staging.timovn.dpdns.org` (dự kiến) | Migrate trước, test, rồi production      |
| Production | `timo-api`           | `timo-main`         | `timovn.dpdns.org` (dự kiến)         | Yêu cầu reviewer trên GitHub Environment |

## Bước 0 – Xác nhận

1. Cloudflare: xác nhận có thể cấu hình hostname (xem CLOUDFLARE.md). Nếu không, dùng workers.dev.
2. Supabase: project đã tạo, provider đã bật, JWKS truy cập được (SUPABASE.md).
3. Ghi lại: `database_id` của `timo-main` và `timo-main-staging`.

## Bước 1 – Tạo tài nguyên

```bash
pnpm exec wrangler d1 create timo-main-staging
pnpm exec wrangler d1 create timo-main
# Cập nhật database_id tương ứng trong apps/api/wrangler.jsonc
# Cập nhật vars: SUPABASE_URL, ALLOWED_ORIGINS, PUBLIC_APP_URL, INITIAL_ADMIN_EMAIL
```

## Bước 2 – Bí mật

```bash
cd apps/api
pnpm exec wrangler secret put SETUP_SECRET --env staging
pnpm exec wrangler secret put SETUP_SECRET --env production
```

Trên GitHub: tạo Environments `staging` và `production`, thêm secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` và biến `API_HEALTH_URL`. Bật **Required reviewers** cho `production`.

## Bước 3 – Kiểm tra cục bộ

```bash
pnpm run check
```

## Bước 4 – Deploy staging

GitHub → Actions → **Deploy** → `environment: staging`. Workflow sẽ:

1. Kiểm tra cấu hình (chặn nếu placeholder).
2. Build.
3. Áp dụng migration từ xa.
4. Deploy Worker.
5. Health check `/api/health`.

Sau đó: đăng nhập, khởi tạo quản trị, kiểm tra các màn hình quản trị.

## Bước 5 – Deploy production

Chỉ sau khi staging đạt. Chạy workflow với `environment: production` và phê duyệt reviewer.

## Rollback

- **Worker:** `pnpm exec wrangler rollback --env production` (chọn phiên bản trước) hoặc deploy lại commit trước đó.
- **Migration:** migration D1 không tự hoàn tác. Quy trình: (1) tạo migration mới đảo ngược thay đổi; (2) không sửa file migration đã áp dụng; (3) nếu mất dữ liệu, khôi phục từ bản sao lưu (BACKUP.md).
- **Web:** deploy lại artifact của commit trước.

## Không deploy khi

- CI không xanh (workflow `ci.yml` là điều kiện).
- Cấu hình còn placeholder.
- Chưa có kết quả migrate staging.
