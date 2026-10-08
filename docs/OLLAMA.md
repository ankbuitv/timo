# Tích hợp Ollama Cloud cho TIMO AI (KẾ HOẠCH – CHƯA TRIỂN KHAI)

> **Trạng thái:** chưa có mã gọi AI nào trong repo. Tài liệu này mô tả kiến trúc sẽ triển khai ở Giai đoạn 6.

## Nguyên tắc

- API key **chỉ** nằm trong Worker secret (`wrangler secret put OLLAMA_API_KEY`). Trình duyệt không bao giờ gọi trực tiếp Ollama.
- Mọi yêu cầu AI đi qua `apps/api/src/ai/` với xác thực, quyền `ai:use`, quota và rate limit.
- Đầu ra AI được **gắn nhãn** là do AI tạo; JSON do AI tạo phải qua Zod trước khi nhập; AI không được thực thi thao tác CSDL hay đặc quyền.
- Điểm do AI chấm chỉ là gợi ý; giáo viên duyệt mới có hiệu lực.

## Cấu hình dự kiến

| Biến                   | Loại   | Ghi chú                                                          |
| ---------------------- | ------ | ---------------------------------------------------------------- |
| `OLLAMA_API_KEY`       | Secret | Lấy từ tài khoản Ollama của bạn; không chia sẻ                   |
| `OLLAMA_BASE_URL`      | Var    | Mặc định `https://ollama.com` (xác minh endpoint trước khi dùng) |
| `OLLAMA_DEFAULT_MODEL` | Var    | Chọn sau khi kiểm tra model khả dụng và giá                      |

## Lưu ý về gói và giới hạn (cần xác minh trước khi triển khai)

- Ollama Cloud có gói Free với lượng sử dụng nhỏ và **1 yêu cầu đồng thời** (theo tổng hợp công khai). Gói trả phí tăng số yêu cầu đồng thời.
- Bảng giá và cơ chế tính phí (theo token hay theo tín dụng) đã thay đổi trong năm 2026 theo các nguồn tổng hợp; **phải kiểm tra trực tiếp tại trang giá Ollama** trước khi cấu hình quota.
- Không có SLA công khai theo các nguồn tổng hợp → không hứa hẹn độ sẵn sàng AI cho người dùng; cần trạng thái riêng trên status page.

## Thiết kế dự kiến

1. `AIProvider` interface (`chat`, `stream`, `embed`) + `OllamaCloudProvider` → dễ thay thế.
2. Bảng `ai_usage` (người dùng, tính năng, model, token ước tính, thời gian) và `ai_conversations`.
3. Quota theo vai trò/gói; admin cấu hình model mặc định, system prompt, max tokens, temperature (bảng `ai_settings`).
4. Rate limit theo người dùng (Durable Object hoặc D1 counter theo cửa sổ) và kiểm soát lạm dụng (độ dài prompt, nội dung).
5. Log không chứa nội dung nhạy cảm của học sinh.
6. Tính năng ưu tiên: Gia sư (Socratic), giải thích bài học, tạo flashcard/câu hỏi (JSON + validation), hỏi đáp PDF có trích dẫn trang thực.

## Kiểm thử khi triển khai

- Test với provider giả (fake provider có ý định rõ ràng – KHÔNG dùng làm dữ liệu production).
- Test ghi usage và từ chối khi vượt quota.
- Test JSON không hợp lệ bị loại trước khi lưu.
