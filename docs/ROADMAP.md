# Lộ trình và trạng thái

Trạng thái ghi theo **những gì đã kiểm chứng trong repo**, không theo kế hoạch.

- ✅ **Hoàn thành** – có code, có test/kiểm chứng.
- 🟡 **Một phần** – có một số phần; phần còn lại ghi rõ.
- ⬜ **Chưa bắt đầu** – chỉ có tài liệu hoặc không có gì.

## Giai đoạn 1 – Nền tảng

| Hạng mục                                              | Trạng thái | Chi tiết                                                                                                                                                                                            |
| ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo pnpm + TypeScript strict + ESLint + Prettier | ✅         | `pnpm run check`                                                                                                                                                                                    |
| Cấu trúc `apps/`, `packages/`                         | 🟡         | Có `web`, `api`, `shared`, `validation`, `auth`, `database`. Chưa có `packages/ui`, `packages/config`, `apps/support`                                                                               |
| Design system (token màu TIMO, sáng/tối/hệ thống)     | ✅         | Token + thang chữ + hệ "tone" theo môn/lớp; 18 minh họa SVG gốc, hai phong cách; tài liệu `docs/DESIGN_SYSTEM.md`. Không dùng shadcn/ui CLI hay Motion (CSS transitions + `prefers-reduced-motion`) |
| Schema D1 + migration                                 | 🟡         | 10 bảng nền tảng. Các bảng nghiệp vụ còn lại chưa có                                                                                                                                                |
| Xác thực Supabase                                     | 🟡         | Xác minh JWT + UI đăng nhập/đăng ký/OAuth đã có. **Chưa kiểm thử với project Supabase thật**                                                                                                        |
| RBAC server-side                                      | ✅         | 7 vai trò, 19 quyền, kiểm thử 403                                                                                                                                                                   |
| Khởi tạo quản trị một lần                             | ✅         | Có kiểm thử: sai secret, sai email, gọi lần 2 → 409                                                                                                                                                 |
| Triển khai (Wrangler, CI, deploy có cổng)             | 🟡         | Cấu hình + workflow hoàn chỉnh; **chưa deploy**, chưa có `database_id` thật                                                                                                                         |

## Giai đoạn 2 – Trang chủ, CMS nền, lớp và môn

| Hạng mục                                                                                                                  | Trạng thái | Chi tiết                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| Header, footer, điều hướng desktop + tab di động                                                                          | ✅         | Mục chưa có trang hiển thị "Sắp ra mắt" (không phải liên kết chết)                                       |
| Thông báo cấu hình được, băng chuyền hero                                                                                 | ✅         | Tự chuyển, tạm dừng khi hover/focus, tôn trọng reduced motion                                            |
| Khối trang chủ theo CMS (sắp xếp, bật/tắt, sửa)                                                                           | ✅         | Có kiểm thử đổi thứ tự                                                                                   |
| Lưới lớp học (1–12, 3 cấp)                                                                                                | ✅         | Trang lớp hiển thị danh mục môn                                                                          |
| Môn học chuẩn + tùy chỉnh                                                                                                 | ✅         | CRUD quản trị                                                                                            |
| Khóa học nổi bật                                                                                                          | ⬜         | Hiển thị trạng thái rỗng trung thực                                                                      |
| Môn học phổ biến                                                                                                          | ✅         | Chỉ hiển thị danh sách                                                                                   |
| Thư viện số, kho đề, thi đấu, cộng đồng, blog, TIMO AI, tin tức, lợi ích (thống kê), testimonials, premium trên trang chủ | ⬜         | Chưa có module tương ứng; không đưa vào trang chủ dưới dạng giả                                          |
| SEO: prerender/SSR, sitemap, structured data, OG theo trang                                                               | ⬜         | Hiện là SPA: có `robots.txt`, meta cơ bản, `noindex` cho trang riêng tư. **Chưa đạt yêu cầu SEO đầy đủ** |
| Tách trang theo route (code splitting)                                                                                    | ✅         | Build đã tách chunk                                                                                      |
| Tiếng Việt, font Be Vietnam Pro (subset tiếng Việt)                                                                       | ✅         |                                                                                                          |

## Giai đoạn 3 – Khóa học, bài học, video

⬜ Chưa bắt đầu (Course → Module → Chapter → Lesson → Activity; editor Tiptap; video/HLS; progress). Không có dữ liệu mẫu khóa học.

## Giai đoạn 4 – Bài tập, ngân hàng câu hỏi, thi

⬜ Chưa bắt đầu.

## Giai đoạn 5 – Thư viện số và PDF

⬜ Chưa bắt đầu. Lưu ý: "không cho tải xuống" không đảm bảo ngăn sao chép; cần kiểm soát truy cập và storage private.

## Giai đoạn 6 – Ollama Cloud (TIMO AI)

⬜ Chưa có mã. Xem [OLLAMA.md](OLLAMA.md).

## Giai đoạn 7 – Cộng đồng, blog, tin tức, nhắn tin

⬜ Chưa bắt đầu.

## Giai đoạn 8 – Lớp học, giáo viên, phụ huynh

⬜ Chưa bắt đầu.

## Giai đoạn 9 – Premium, gamification, Arena

⬜ Chưa bắt đầu. Arena cần đánh giá Durable Objects trước khi thiết kế; có thể yêu cầu gói trả phí (kiểm tra CLOUDFLARE.md).

## Giai đoạn 10 – Support Center

⬜ Chưa bắt đầu. Cần D1 riêng `timo-support`, `apps/support`, và chia sẻ auth qua cùng project Supabase.

## Giai đoạn 11 – Trạng thái hệ thống (Upptime)

⬜ Chưa tạo. **Cần chủ sở hữu xác nhận** trước khi tạo repository GitHub mới cho trang trạng thái (`status.timovn.dpdns.org`). Quy trình dự kiến:

1. Tạo repo `timo-status` từ template Upptime; chỉ monitor URL công khai (không có khóa API trong URL).
2. Monitor: web, API `/api/health`, xác thực (endpoint JWKS), Storage (khi có), AI (khi có), thư viện số (khi có), Support.
3. Kênh thông báo: email/Discord/Telegram qua secret của repo status (không commit).
4. Không ghi kết quả giả: chỉ hiển thị dữ liệu Upptime thu thập thật.

## Giai đoạn 12 – Bảo mật, kiểm thử, tối ưu

| Hạng mục                                            | Trạng thái                                                |
| --------------------------------------------------- | --------------------------------------------------------- |
| Kiểm thử đơn vị / tích hợp (69 test)                | ✅                                                        |
| Kiểm thử E2E (Playwright)                           | ⬜ (môi trường không tải được trình duyệt; cần chạy ở CI) |
| Kiểm tra thị giác trên thiết bị thật                | ⬜                                                        |
| Cloudflare Turnstile                                | ⬜                                                        |
| Import JSON                                         | ⬜ ([JSON_IMPORT.md](JSON_IMPORT.md))                     |
| Sao lưu D1 theo lịch + kiểm thử khôi phục           | ⬜ (quy trình đã viết, chưa chạy)                         |
| Chính sách quyền riêng tư / điều khoản cho học sinh | ⬜                                                        |

## Thứ tự đề xuất cho bước tiếp theo

1. Tạo D1 thật (staging) và project Supabase thật; chạy đăng nhập + bootstrap end-to-end.
2. Deploy staging, kiểm tra health, ghi lại URL thật.
3. Thêm Playwright E2E cho: trang chủ, đăng nhập, bootstrap, CRUD lớp/môn, sắp xếp CMS.
4. Bắt đầu Giai đoạn 3 (khóa học) với schema và seed dữ liệu demo được gắn nhãn rõ ràng.

## Rà soát trước triển khai (2026-10-08)

- Đã xong trong code (có test): fail-closed rate limit; cổng cấu hình; JWT chặt hơn; bootstrap xác minh email/khóa qua Supabase, atomic, có audit; manifest migration; migrate tách khỏi deploy; guard cấu hình đã đọc được `wrangler.jsonc`.
- Chưa làm: tất cả việc cần tài khoản Cloudflare/Supabase/GitHub của chủ sở hữu (D1 id, secrets, environments, hostname). Xem `docs/PRE_DEPLOY_REVIEW.md` mục 3–6.
- Chưa bắt đầu Phase 3 cho đến khi chủ sở hữu xác nhận rà soát.

## Hạng mục B (2026-10-08) – đã làm trong mã, chưa xác minh với nhà cung cấp thật

- Bộ nhận diện SVG gốc: biểu trưng mới (`apps/web/src/components/brand/TimoMark.tsx`), favicon, minh họa
  học tập (`components/illustrations/LearningScene.tsx`) dùng trong hero.
- Quản lý nhiều khóa Ollama: bảng `ai_api_keys` + `ai_usage_daily` (migration 0002), mã hóa AES-256-GCM,
  allowlist chống SSRF, router failover có giới hạn, trang `/admin/ai`, 19 test API mới.
- Chưa xác minh: gọi Ollama Cloud thật (cần API key của chủ sở hữu), kiểm thử giao diện trên trình duyệt.

## Rà soát thiết kế toàn giao diện (2026-10-08)

- Trang chủ, trang lớp, giới thiệu, đăng nhập, tài khoản, khởi tạo quản trị: thiết kế lại.
- Quản trị: khung sidebar/nhóm menu, bảng dữ liệu dùng chung, bảng điều khiển có lối tắt;
  các trang danh mục (lớp, môn, người dùng, nhật ký, CMS) đồng bộ theo design system.
- Bộ minh họa: `apps/web/src/lib/visuals.ts` + `SubjectArt` (flat có chiều sâu) + `ChalkArt` (phấn).
- Đã xem bằng cách rasterize: 18 minh họa ở cả hai phong cách, biểu trưng ở 5 kích cỡ, minh họa hero.
- **Chưa** kiểm tra giao diện trong trình duyệt thật (sandbox không có Chromium) – xem checklist.
