# Ảnh xem trước thiết kế

Các ảnh này được tạo bằng cách **rasterize chính mã nguồn minh họa** (không phải ảnh chụp trình duyệt),
dùng cho việc rà soát thị giác trong môi trường không có trình duyệt.

| Tệp         | Nội dung                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| `flat.png`  | 18 minh họa ở phong cách flat vector (dùng cho trang chủ, lối vào nhanh) |
| `chalk.png` | 18 minh họa ở phong cách phấn vẽ tay (dùng cho thẻ môn ở trang lớp)      |
| `scene.png` | Minh họa hero (`LearningScene`) đặt trên nền gradient thương hiệu        |
| `brand.png` | Biểu trưng `TimoMark` ở 16/24/32/40/64px trên nền sáng                   |

Cách tạo lại: biên dịch `apps/web/src/lib/visuals.ts` (hoặc component tương ứng) bằng esbuild sang
một tệp SVG rồi rasterize (ví dụ bằng `sharp`). Xem hướng dẫn ở cuối `docs/DESIGN_SYSTEM.md`.

**Ảnh này không thay thế việc kiểm tra trong trình duyệt thật** — bố cục, khoảng cách, responsive,
menu và trạng thái hover/focus vẫn cần con người xem trực tiếp.
