# TIMO – Học mọi lúc, giỏi mọi nơi

> _Learn Anywhere, Excel Everywhere._

**TIMO** là nền tảng học tập K12 cho học sinh Việt Nam (lớp 1–12), giáo viên, quản trị viên, phụ huynh và nhân viên hỗ trợ.
Dự án được xây dựng theo **Chương trình Giáo dục phổ thông 2018** (định hướng _Kết nối tri thức với cuộc sống_).

> ⚠️ **Trạng thái:** phiên bản nền tảng thử nghiệm (Giai đoạn 1–2 một phần). Nhiều tính năng trong đặc tả đầy đủ **chưa được triển khai**.
> Xem [docs/ROADMAP.md](docs/ROADMAP.md) để biết chính xác đã làm gì, chưa làm gì. TIMO University là dự án tương lai và **không** có trong phiên bản này.

---

## Đã làm được gì (đã kiểm chứng)

| Khu vực                                                                             | Trạng thái | Ghi chú                                                                      |
| ----------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| Monorepo pnpm, TypeScript strict, ESLint, Prettier                                  | ✅         | `pnpm run check`                                                             |
| Cơ sở dữ liệu Cloudflare D1 (Drizzle) + migration                                   | ✅         | 10 bảng, ràng buộc lớp 1–12, seed RBAC và dữ liệu mặc định                   |
| Xác thực JWT Supabase (JWKS) phía server                                            | ✅         | Kiểm thử bằng khóa ES256 cục bộ; **chưa kiểm thử với project Supabase thật** |
| Phân quyền RBAC phía server (7 vai trò hệ thống, quyền chi tiết)                    | ✅         | Vai trò tùy chỉnh: cấu trúc có, giao diện chưa có                            |
| Khởi tạo Super Admin một lần (SETUP_SECRET + email được chỉ định)                   | ✅         | Ghi cờ một lần, ghi nhật ký                                                  |
| API công khai: lớp học, môn học, cấu trúc trang chủ                                 | ✅         | Dữ liệu từ D1                                                                |
| Trang chủ điều khiển bằng CMS (băng chuyền, thông báo, lớp, môn, lợi ích, CTA)      | ✅         | Admin sắp xếp, bật/tắt, sửa cấu hình                                         |
| Quản trị: tổng quan, người dùng (xem), lớp học, môn học, CMS, nhật ký               | ✅         | CRUD có xác nhận khi xóa, phân trang, validation                             |
| Nhật ký kiểm toán (audit log)                                                       | ✅         | Metadata đã lọc bí mật                                                       |
| Chủ đề Sáng / Tối / Theo hệ thống, Tiếng Việt, responsive, điều hướng di động riêng | ✅         | Đã kiểm tra bằng test; **chưa kiểm tra thị giác trên trình duyệt thật**      |
| Kiểm thử tự động                                                                    | ✅         | 69 test (xem bên dưới)                                                       |
| Triển khai Cloudflare Workers / GitHub Actions                                      | ⚠️         | Đã có cấu hình và workflow; **chưa deploy** (xem DEPLOYMENT.md)              |

**Chưa có:** khóa học, bài học, video, bài tập, ngân hàng câu hỏi, thi, thư viện số, PDF reader, TIMO AI, cộng đồng, blog, lớp học/phụ huynh, premium, Arena, Support Center, Upptime, import JSON, SEO prerender. Chi tiết trong [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Cấu trúc thư mục

```
timo/
├── apps/
│   ├── web/              # Frontend: Vite + React 19 + React Router + TanStack Query + Tailwind v4
│   └── api/              # Backend: Cloudflare Worker + Hono + D1 (Drizzle)
├── packages/
│   ├── shared/           # Hằng số: cấp học, môn học, vai trò, quyền, thương hiệu
│   ├── validation/       # Schema Zod dùng chung (API và form)
│   ├── auth/             # Xác thực JWT Supabase, tính quyền
│   └── database/         # Schema Drizzle + migration SQL (nguồn sự thật)
├── infrastructure/
│   └── scripts/          # Kiểm tra cấu hình trước khi deploy
├── docs/                 # Tài liệu kỹ thuật (tiếng Việt)
├── .github/workflows/    # CI và deploy (có cổng chặn)
└── .env.example          # Mẫu biến môi trường (không có giá trị thật)
```

---

## Yêu cầu

- Node.js **≥ 22.13** (dùng `node:sqlite` trong kiểm thử)
- pnpm **10.34.6** (`npm i -g pnpm@10.34.6` hoặc `corepack enable`)
- Tài khoản Supabase (miễn phí) để đăng nhập thật — _không bắt buộc_ để chạy kiểm thử và xem trang chủ
- Tài khoản Cloudflare (miễn phí) để deploy — _không bắt buộc_ để phát triển cục bộ

## Cài đặt và chạy cục bộ

```bash
# 1. Cài phụ thuộc
pnpm install

# 2. Áp dụng migration lên D1 cục bộ (SQLite cục bộ của Wrangler)
cd apps/api && pnpm run migrate:local && cd ../..

# 3. Chạy API (cổng 8787) – terminal 1
pnpm run dev:api

# 4. Chạy web (cổng 5173, tự chuyển tiếp /api sang API) – terminal 2
pnpm run dev:web
```

Mở http://localhost:5173 để xem trang chủ. Dữ liệu lớp học, môn học và khối trang chủ được seed sẵn từ migration.

### Cấu hình đăng nhập (tùy chọn nhưng cần cho khu vực quản trị)

1. Tạo project Supabase, lấy **Project URL** và **anon key** → điền vào `apps/web/.env.local`:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
2. Tạo `apps/api/.dev.vars` (đã git ignore) từ `apps/api/.dev.vars.example`, điền `SUPABASE_URL`, `SETUP_SECRET` (≥ 32 ký tự ngẫu nhiên), `INITIAL_ADMIN_EMAIL`.
3. Đăng ký tài khoản bằng email đó trên `/dang-nhap`, rồi mở `/khoi-tao-quan-tri` và nhập `SETUP_SECRET`.

Chi tiết: [docs/SUPABASE.md](docs/SUPABASE.md), [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md).

## Kiểm tra chất lượng

```bash
pnpm run typecheck   # TypeScript strict, mọi package
pnpm run lint        # ESLint (typescript-eslint, react-hooks)
pnpm run test        # Vitest: validation, auth, API tích hợp, web
pnpm run build       # Vite build + wrangler dry-run
pnpm run check       # Tất cả ở trên
```

Kết quả gần nhất (chạy thực tế trong môi trường phát triển):

| Gói                                                                                                  | Test  |
| ---------------------------------------------------------------------------------------------------- | ----- |
| `@timo/validation`                                                                                   | 19 ✅ |
| `@timo/auth` (RBAC, JWT)                                                                             | 10 ✅ |
| `@timo/api` (29 test tích hợp trên migration thật, D1 giả lập bằng node:sqlite + 1 test unit logger) | 30 ✅ |
| `@timo/web` (hợp đồng API, trang chủ CMS, theme)                                                     | 10 ✅ |

Ngoài ra đã kiểm tra: `wrangler deploy --dry-run` thành công; `wrangler d1 migrations apply --local` áp dụng đủ 2 migration trên workerd; `vite build` thành công với code splitting theo trang.

## Biến môi trường

Xem chi tiết và phân loại công khai/bí mật trong [`.env.example`](.env.example) và [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Nguyên tắc:

- `VITE_*` → đưa vào trình duyệt, **chỉ** giá trị công khai.
- Bí mật (`SETUP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `OLLAMA_API_KEY`, `CLOUDFLARE_API_TOKEN`) → **không bao giờ** commit; dùng `wrangler secret put` hoặc GitHub Environment secrets.

## Tài liệu

| Tài liệu                                      | Nội dung                                            |
| --------------------------------------------- | --------------------------------------------------- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)       | Kiến trúc, module, luồng dữ liệu                    |
| [DATABASE.md](docs/DATABASE.md)               | Schema D1, ràng buộc, migration                     |
| [API.md](docs/API.md)                         | Danh sách endpoint, định dạng lỗi                   |
| [AUTHENTICATION.md](docs/AUTHENTICATION.md)   | Supabase Auth, RBAC, bootstrap                      |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md)           | Triển khai staging/production, rollback             |
| [CLOUDFLARE.md](docs/CLOUDFLARE.md)           | Workers, D1, rate limit, giới hạn free tier, domain |
| [SUPABASE.md](docs/SUPABASE.md)               | Thiết lập project, provider, giới hạn free tier     |
| [OLLAMA.md](docs/OLLAMA.md)                   | Kế hoạch tích hợp AI (chưa triển khai)              |
| [JSON_IMPORT.md](docs/JSON_IMPORT.md)         | Kế hoạch import JSON (chưa triển khai)              |
| [SECURITY.md](docs/SECURITY.md)               | Biện pháp bảo mật đã có và còn thiếu                |
| [BACKUP.md](docs/BACKUP.md)                   | Sao lưu, khôi phục D1 và Storage                    |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Lỗi thường gặp                                      |
| [ROADMAP.md](docs/ROADMAP.md)                 | Trạng thái từng giai đoạn                           |
| [OPERATIONS.md](docs/OPERATIONS.md)           | Vận hành hằng ngày (tóm tắt)                        |

## Giấy phép

Mã nguồn theo giấy phép trong file [LICENSE](LICENSE).
