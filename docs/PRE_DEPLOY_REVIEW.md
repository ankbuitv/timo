# Rà soát trước triển khai (Pre-deploy review)

Ngày: 2026-10-08. Nhánh: `arena/b4b8fe48-timo`. Phạm vi: rà soát kỹ thuật trước Phase 3 (không làm tính năng mới).

## 1. Phát hiện (findings)

| #   | Mức     | Phát hiện                                                                                                                                                                      | Trạng thái                                                                                                         |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| F1  | Cao     | Rate limit **fail-open**: thiếu binding `SENSITIVE_RATE_LIMITER` thì bỏ qua và cho qua.                                                                                        | Đã sửa: fail-closed (503) ở staging/production; thiếu IP → 429.                                                    |
| F2  | Cao     | Bootstrap không kiểm tra **email đã xác minh** và **tài khoản bị khóa**; email chỉ lấy từ JWT (client gửi lên).                                                                | Đã sửa: xác minh qua `GET {SUPABASE_URL}/auth/v1/user` bằng anon key.                                              |
| F3  | Trung   | Bootstrap ghi cờ và cấp quyền **không atomic** (hai câu lệnh riêng).                                                                                                           | Đã sửa: một `db.batch` (transaction D1); quyền chỉ cấp nếu cờ vừa được ghi bởi chính người gọi.                    |
| F4  | Trung   | `SETUP_SECRET` tối thiểu 16 (schema) nhưng route yêu cầu 32 → không nhất quán; so sánh không hằng-thời-gian.                                                                   | Đã sửa: 32 ký tự, so sánh hằng-thời-gian (băm SHA-256 trước).                                                      |
| F5  | Trung   | Lần từ chối bootstrap **không được audit**.                                                                                                                                    | Đã sửa: `bootstrap.denied` kèm lý do; test không lộ secret.                                                        |
| F6  | Trung   | Email trong hồ sơ local không đồng bộ khi người dùng đổi email trên Supabase.                                                                                                  | Đã sửa: đồng bộ khi đăng nhập.                                                                                     |
| F7  | Cao     | **Guard cấu hình không chạy được**: `verify-deploy-config.mjs` parse JSON thô, lỗi trên `wrangler.jsonc` (dấu phẩy thừa, comment). Lần kiểm tra trước đó "exit 1" là do crash. | Đã sửa: parser JSONC; giờ báo đúng các placeholder.                                                                |
| F8  | Cao     | Workflow **Deploy tự áp dụng migration production** cùng lúc deploy; comment nói "chỉ khi CI xanh" nhưng không kiểm tra.                                                       | Đã sửa: tách `migrate.yml` (reviewer + cụm `MIGRATE-<env>`); deploy kiểm tra CI qua API và chặn migration pending. |
| F9  | Trung   | Migration đã áp dụng có thể bị sửa mà không ai biết.                                                                                                                           | Đã sửa: manifest SHA-256 (`MANIFEST.sha256`), kiểm tra trong CI/deploy/migrate.                                    |
| F10 | Trung   | Cấu hình thiếu (ví dụ thiếu `PUBLIC_APP_URL`) vẫn phục vụ API ở production.                                                                                                    | Đã sửa: cổng cấu hình trả 503 cho `/api/*` (health vẫn trả `configured`).                                          |
| F11 | Thấp    | JWT chấp nhận token không có `exp`/`role`; có thể nhận nhầm token anon.                                                                                                        | Đã sửa: `requiredClaims`, chỉ `role=authenticated`.                                                                |
| F12 | Thấp    | `SUPABASE_SERVICE_ROLE_KEY` có trong `.env.example` nhưng **không được dùng**.                                                                                                 | Đã ghi rõ "chưa dùng, không đặt".                                                                                  |
| F13 | Còn lại | Token đã cấp vẫn hợp lệ đến khi hết hạn khi tài khoản bị khóa trên Supabase.                                                                                                   | Ghi nhận giới hạn (docs/SUPABASE.md, docs/SECURITY.md). Chưa có thu hồi tức thì.                                   |
| F14 | Còn lại | `wrangler.jsonc` còn `database_id` placeholder và `SUPABASE_URL`/`INITIAL_ADMIN_EMAIL` rỗng cho staging/production.                                                            | **Chặn deploy** cho đến khi người vận hành điền (xem mục 3).                                                       |

## 2. Thay đổi (changes)

- `apps/api/src/middleware/rate-limit.ts` – fail-closed, không dùng Map bộ nhớ, thiếu IP → 429.
- `apps/api/src/config.ts` (mới) – `validateConfig`, chỉ trả tên biến, không trả giá trị.
- `apps/api/src/app.ts` – cổng cấu hình; health có `configured`.
- `apps/api/src/lib/supabase-user.ts` (mới) – gọi `/auth/v1/user`, có timeout.
- `apps/api/src/routes/setup.ts` – bootstrap viết lại theo 6 bước (xem SECURITY.md).
- `apps/api/src/middleware/auth.ts` – đồng bộ email hồ sơ.
- `apps/api/src/env.ts`, `.env.example`, `apps/api/.dev.vars.example` – `SUPABASE_ANON_KEY`, `TIMO_AI_ENCRYPTION_KEY`, `AI_ALLOWED_HOSTS`; ghi rõ biến chưa dùng.
- `packages/auth/src/supabase-jwt.ts` – `requiredClaims`, `role=authenticated`.
- `infrastructure/scripts/verify-deploy-config.mjs` – parser JSONC; kiểm tra https, APP_ENV, origin, rate limit, manifest.
- `infrastructure/scripts/migration-manifest.mjs` (mới) – `--write` / `--check`.
- `infrastructure/scripts/smoke-test.mjs` (mới) – smoke test HTTP thật (`pnpm run smoke`).
- `packages/database/migrations/MANIFEST.sha256` (mới).
- `.github/workflows/migrate.yml` (mới); `deploy.yml` (bỏ migrate, thêm kiểm tra CI + pending); `ci.yml` (thêm `--check` manifest).
- Test mới: API +12 (bootstrap, rate limit, config), auth +4 (JWT).
- Docs: `SECURITY.md`, `SUPABASE.md`, `DEPLOYMENT.md`, file này.

## 3. Blocker – cần người vận hành (không tự tạo được)

1. Tạo D1 staging và production bằng tài khoản Cloudflare của chủ sở hữu (không chạy được từ sandbox, không có credential).
2. Điền `database_id` thật vào `apps/api/wrangler.jsonc` (cả `staging` và `production`).
3. Điền `SUPABASE_URL` (vars) và `INITIAL_ADMIN_EMAIL` cho từng môi trường.
4. Đặt secrets (không commit): `SUPABASE_ANON_KEY`, `SETUP_SECRET` (≥32 ký tự).
5. Tạo GitHub Environments `staging`, `production` với required reviewers và secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
6. Cấu hình hostname (Cloudflare): xác minh `timovn.dpdns.org`, `staging.timovn.dpdns.org` trỏ được tới Worker/Pages; luôn giữ fallback `workers.dev`.
7. Bật email xác nhận trong Supabase (xem mục 4).

## 4. Lệnh Cloudflare (chạy bằng tài khoản của bạn – CHƯA chạy)

```bash
cd apps/api
pnpm exec wrangler login
pnpm exec wrangler d1 create timo-main-staging        # ghi database_id vào env.staging
pnpm exec wrangler d1 create timo-main                # ghi database_id vào env.production
pnpm exec wrangler secret put SUPABASE_ANON_KEY --env staging
pnpm exec wrangler secret put SETUP_SECRET --env staging          # ≥32 ký tự ngẫu nhiên
pnpm exec wrangler secret put TIMO_AI_ENCRYPTION_KEY --env staging   # giai đoạn 6, sau này
cd ../.. && node infrastructure/scripts/verify-deploy-config.mjs staging
```

Lặp lại cho `--env production` sau khi staging đạt. Rate limit binding `SENSITIVE_RATE_LIMITER` đã khai báo trong `wrangler.jsonc` (namespace_id 1002 staging, 1003 production); xác minh namespace không trùng với môi trường khác khi tạo.

## 5. Hướng dẫn Supabase Auth

Xem chi tiết `docs/SUPABASE.md`. Tóm tắt: bật email/password và **xác nhận email**; Site URL = `PUBLIC_APP_URL`; thêm redirect `…/dang-nhap`; kiểm tra JWKS; project staging riêng.

## 6. Checklist deploy staging (thứ tự bắt buộc)

- [ ] `pnpm run check` xanh trên commit cần deploy; PR/push có CI success.
- [ ] Mục 3 đã hoàn tất; `verify-deploy-config.mjs staging` exit 0.
- [ ] Mục 4: D1 staging tạo, secrets đặt.
- [ ] Workflow **Migrate D1 (thủ công)** → `staging`, gõ `MIGRATE-staging`, reviewer duyệt.
- [ ] Workflow **Deploy** → `staging` (kiểm tra CI + pending migration).
- [ ] `API_HEALTH_URL=https://<staging-host> pnpm run smoke` (và `WEB_BASE` nếu đã deploy web).
- [ ] Đăng nhập tài khoản đã xác nhận email → `POST /api/setup/bootstrap` → 201; lần 2 → 409.
- [ ] Kiểm tra `audit_logs`: `bootstrap.completed`; thử email khác → `bootstrap.denied`.
- [ ] Kiểm tra thủ công giao diện trên trình duyệt thật (sandbox không có Chromium).
- [ ] Chỉ sau khi staging đạt: lặp lại cho production (cần reviewer riêng).

## 7. Đã xác minh và chưa xác minh

**Đã xác minh bằng lệnh thật:**

- `pnpm run check` exit 0 (typecheck, lint, test, build).
- API 42/42 test (gồm bootstrap, rate limit fail-closed, validateConfig, cổng cấu hình).
- Auth 13/13 test.
- `verify-deploy-config.mjs staging|production` chạy được và chặn đúng placeholder.
- `migration-manifest.mjs --check` khớp.
- Parse YAML của ba workflow (`migrate.yml`, `deploy.yml`, `ci.yml`) thành công.
- Smoke test HTTP trên API dev cục bộ (8787) và web (5173): 8/8.

**Chưa xác minh:** Supabase Auth thật; Cloudflare hostname; D1 remote; Rate limit binding thật; chạy workflow trên GitHub; giao diện trình duyệt (không có Chromium); deploy staging/production.
