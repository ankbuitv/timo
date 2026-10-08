# Quản lý khóa Ollama (đa khóa) – TIMO

Tài liệu này mô tả module quản trị khóa AI đã triển khai trong mã nguồn. **Chưa xác minh với
Ollama Cloud thật** (sandbox không có credential); mọi hành vi dưới đây đã được kiểm thử bằng test
đơn vị với nhà cung cấp giả lập.

## 1. Kiến trúc

| Thành phần        | Tệp                                             | Vai trò                                                            |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Mã hóa bí mật     | `apps/api/src/lib/ai-crypto.ts`                 | AES-256-GCM qua Web Crypto, IV ngẫu nhiên 12 byte, vân tay SHA-256 |
| Kiểm tra endpoint | `apps/api/src/lib/ai-endpoint.ts`               | Allowlist host, chống SSRF, chỉ https và đường dẫn gốc hoặc `/api` |
| Router nhiều khóa | `apps/api/src/lib/ai-router.ts`                 | Chọn khóa theo ưu tiên, failover có giới hạn, backoff, ghi usage   |
| API quản trị      | `apps/api/src/routes/admin-ai.ts`               | CRUD, xoay khóa, kiểm tra kết nối, gửi thử, usage, khả dụng        |
| Bảng dữ liệu      | `packages/database/migrations/0002_ai_keys.sql` | `ai_api_keys`, `ai_usage_daily`, quyền `ai:manage`                 |
| Giao diện         | `apps/web/src/pages/admin/AiKeysAdminPage.tsx`  | Trang `/admin/ai`                                                  |
| Kiểm thử          | `apps/api/test/ai.test.ts`                      | 19 test: mã hóa, SSRF, RBAC, failover, 429, giới hạn ngày, audit   |

## 2. Bảo mật bí mật

- Khóa API chỉ nhập **một lần**; API trả về dạng che `••••••••XXXX` (4 ký tự cuối) và vân tay SHA-256
  rút gọn 16 ký tự để phát hiện xoay khóa.
- Trong D1 chỉ có bản mã: `secret_ciphertext` (base64, gồm auth tag GCM) và `secret_iv`.
- `TIMO_AI_ENCRYPTION_KEY` là Worker secret dùng để mã hóa/giải mã. Không có khóa này thì các thao tác
  với bí mật trả **503**; danh sách khóa vẫn xem được (chỉ có bản che).
- Đổi `TIMO_AI_ENCRYPTION_KEY` sẽ làm mọi khóa đã lưu không giải mã được → phải xoay khóa lại.
- Không endpoint nào trả lại khóa gốc; audit chỉ ghi tên, id, 4 ký tự cuối và các trường thay đổi.

Sinh khóa mã hóa:

```bash
openssl rand -base64 32
# hoặc: openssl rand -hex 32
cd apps/api
pnpm exec wrangler secret put TIMO_AI_ENCRYPTION_KEY --env staging
```

## 3. Chống SSRF cho endpoint

Chỉ chấp nhận khi thoả tất cả: `https`, không có user/password, không query/hash, host không phải IP
literal, không phải host nội bộ (`localhost`, `.local`, `.internal`), host nằm trong allowlist, cổng
trống hoặc 443, đường dẫn rỗng hoặc `/api`.

Allowlist mặc định: `ollama.com`. Mở rộng bằng biến `AI_ALLOWED_HOSTS` (phân tách bằng dấu phẩy) –
chỉ dùng khi thực sự cần, vì mỗi host thêm vào là một bề mặt mới.

## 4. Router: quy tắc failover

| Tình huống                      | Hành vi                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| Khóa tắt                        | Bỏ qua hoàn toàn                                               |
| Đã đạt `dailyRequestLimit`      | Bỏ qua, ghi lý do `daily_limit`                                |
| 429 (hết hạn mức)               | **Dừng ngay**, không chuyển khóa khác (chống vượt quota)       |
| 401/403 (khóa sai/hết hiệu lực) | Ghi lỗi, chuyển khóa kế tiếp nếu bật failover                  |
| 5xx / lỗi mạng / hết thời gian  | Ghi lỗi, chuyển khóa kế tiếp, backoff nhân đôi (tối đa 5 giây) |
| 400/404/422                     | Trả lỗi ngay (thử lại chỉ lặp cùng lỗi)                        |

- Số lần thử tối đa: `maxAttempts` (1–5). Không có vòng lặp vô hạn.
- Không thử lại trên **cùng** một khóa sau khi nhà cung cấp đã xử lý, vì chat là thao tác không idempotent.
- Ghi usage theo khóa và theo ngày UTC (`ai_usage_daily`): số yêu cầu, số lỗi, token vào/ra.

## 5. API quản trị (`/api/admin/ai`, quyền `ai:manage`)

| Phương thức | Đường dẫn                 | Mô tả                                                    |
| ----------- | ------------------------- | -------------------------------------------------------- |
| GET         | `/keys`                   | Danh sách khóa (bản che) + usage hôm nay + trạng thái    |
| POST        | `/keys`                   | Thêm khóa (mã hóa ngay)                                  |
| PATCH       | `/keys/:id`               | Đổi tên, bật/tắt, ưu tiên, model, endpoint, giới hạn     |
| POST        | `/keys/:id/rotate`        | Xoay khóa, đặt lại trạng thái cũ                         |
| DELETE      | `/keys/:id`               | Xóa khóa và usage liên quan (cascade)                    |
| POST        | `/keys/:id/test`          | `GET /api/tags` – không tốn quota sinh văn bản           |
| POST        | `/keys/:id/preview`       | Gửi thử một câu ngắn – **có tốn quota**                  |
| GET/PUT     | `/settings`               | Cấu hình router (failover, số lần thử, backoff, timeout) |
| GET         | `/usage?days=14`          | Usage theo ngày (1–30 ngày)                              |
| GET         | `/availability`           | Số khóa theo trạng thái, tổng yêu cầu hôm nay            |
| GET         | `/keys/:id/usage?days=14` | Usage của một khóa                                       |

Quyền `ai:manage` **chỉ** thuộc `super_admin`; vai trò `admin` không có quyền này (khóa API là bí mật
cấp cao). Ẩn menu trong giao diện không phải là biện pháp bảo mật – API luôn kiểm tra quyền.

Ghi chú: mọi thao tác ghi đều chịu rate limit binding `SENSITIVE_RATE_LIMITER`.

## 6. Chưa làm / giới hạn đã biết

- Chưa có lớp tính năng dùng AI cho học sinh (thuộc Phase 6: trợ lý học tập). Hiện mới có hạ tầng +
  trang quản trị.
- Chưa gọi được Ollama Cloud thật trong môi trường này (không có API key). "Kiểm tra kết nối" và
  "Gửi thử" cần chạy trên staging với khóa thật để xác minh.
- Giới hạn theo ngày đếm theo UTC; chưa có giới hạn theo phút (sẽ thêm khi có nhu cầu thực tế).
- Số liệu usage là do TIMO đếm, không phải số liệu của nhà cung cấp; đối chiếu với trang Ollama khi cần.

## 7. Checklist kiểm tra thủ công trên trình duyệt

Sandbox không có trình duyệt nên các bước sau **chưa được xác minh thị giác** – cần người vận hành
kiểm tra trên staging:

1. Đăng nhập bằng tài khoản super_admin (đã bootstrap) → menu trái có mục **Khóa AI**.
   Với tài khoản chỉ có vai trò `admin` hoặc `teacher`, mục này **không** hiển thị; mở trực tiếp
   `/admin/ai` phải bị chặn.
2. Đặt `TIMO_AI_ENCRYPTION_KEY` (mục 2) rồi tải lại trang: cảnh báo vàng "Chưa đặt
   TIMO_AI_ENCRYPTION_KEY" phải biến mất.
3. Thêm khóa với khóa API thật của Ollama → bảng hiện `••••••••XXXX` đúng 4 ký tự cuối.
   Kiểm tra D1: `SELECT secret_ciphertext FROM ai_api_keys` không chứa khóa gốc.
4. Bấm **Kiểm tra**: có thông báo thành công kèm số model; cột "Model khả dụng" hiện danh sách.
5. Bấm **Gửi thử** với khóa thật → có phản hồi và thời gian; sau đó số liệu "Sử dụng 14 ngày" tăng.
6. Tắt khóa rồi **Gửi thử** → nút bị vô hiệu hóa (khóa đang tắt không được gọi).
7. Xoay khóa bằng một khóa sai → **Kiểm tra** phải báo lỗi 401/403 và cột trạng thái chuyển "Lỗi".
8. Kiểm tra dark mode và màn hình 375px: bảng có thanh cuộn ngang, không vỡ bố cục.
9. Trang chủ: hero hiển thị minh họa bên phải ở màn hình ≥1024px, ẩn ở màn hình nhỏ; biểu trưng mới
   hiển thị ở header, footer và favicon.
