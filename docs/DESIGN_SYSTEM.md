# TIMO Design System

Tài liệu này mô tả hệ thống thiết kế đang dùng trong `apps/web`. Mọi thành phần giao diện phải bám
theo tài liệu này; khi cần thêm màu/kích thước mới, cập nhật token ở đây và trong
`apps/web/src/styles/index.css` trước, không hardcode trong component.

Nguồn sự thật: `apps/web/src/styles/index.css` (token), `apps/web/src/components/ui/index.tsx`
(thành phần), `apps/web/src/lib/visuals.ts` (màu theo môn/lớp + dữ liệu minh họa).

## 1. Nguyên tắc

1. **Không màu cứng trong component.** Mọi màu đi qua token Tailwind (`brand-500`, `success-600`…)
   hoặc hệ "tone" (`--tone-hue`).
2. **Hai phong cách minh họa, một nguồn dữ liệu.** Hình học khai báo một lần trong `visuals.ts`,
   render ra flat vector (marketing/điều hướng) hoặc phấn vẽ tay (nội dung học tập).
3. **Trung thực trạng thái.** Không có nút giả, không số liệu mẫu; mục chưa làm hiển thị nhãn
   "Đang xây dựng"/"Sắp ra mắt" hoặc để trống có chủ đích.
4. **Tiếng Việt là ngôn ngữ gốc.** Nhãn, thông báo lỗi và nội dung mẫu viết bằng tiếng Việt.
5. **Chuyển động có thể tắt.** Mọi hiệu ứng phải nằm dưới `prefers-reduced-motion`.

## 2. Màu sắc

### Màu thương hiệu (tĩnh, có trong `@theme`)

| Token             | Mã        | Dùng cho                                     |
| ----------------- | --------- | -------------------------------------------- |
| `brand-500`       | `#6258F5` | Hành động chính, liên kết, trạng thái active |
| `secondary-500`   | `#3B82F6` | Hành động phụ, gradient hero                 |
| `accent-500`      | `#FF8747` | Điểm nhấn, mục "sắp ra mắt", cảnh báo nhẹ    |
| `success-500/600` | `#10B981` | Trạng thái thành công, đã hoàn thành         |
| `red-600`         | Tailwind  | Lỗi, thao tác phá huỷ                        |

### Màu ngữ nghĩa theo chủ đề (đổi giữa sáng/tối)

`--surface-page`, `--surface-card`, `--surface-muted`, `--surface-sunken`, `--surface-inverse`,
`--text-strong`, `--text-body`, `--text-muted`, `--border-subtle`, `--border-strong`, `--focus-ring`,
`--hero-from`, `--hero-to`.

Không được dùng mã màu trực tiếp trong JSX, trừ hình minh họa SVG (nơi màu được tính từ `hue`).

### Hệ "tone" theo môn học và khối lớp

Một biến duy nhất `--tone-hue` (0–360) điều khiển cả nhóm tiện ích:

| Lớp tiện ích       | Ý nghĩa                                                 |
| ------------------ | ------------------------------------------------------- |
| `tone-surface`     | Nền thẻ rất nhạt + viền nhạt theo tone                  |
| `tone-soft`        | Nền nhạt hơn cho ô minh họa                             |
| `tone-chip`        | Nền đậm hơn + chữ tương phản cao (nhãn, icon)           |
| `tone-ink`         | Màu chữ/icon theo tone                                  |
| `tone-gradient`    | Gradient cho ô số lớp, thanh nhấn                       |
| `card-interactive` | Nâng nhẹ + viền tone khi hover (đổi màu viền theo tone) |

Gán hue: `style={{ "--tone-hue": String(hue) }}`.

- `hueForGrade(level)` – 12 sắc độ riêng cho lớp 1–12 (lệch dần quanh bánh xe màu).
- `hueForSubject(slug)` – hue theo môn: Toán 232, Tiếng Việt 350, Ngữ văn 268, Tiếng Anh 208,
  Vật lí 190, Hóa học 158, Sinh học 128, Lịch sử 26, Địa lí 44, Tin học 250, Công nghệ 300,
  GDCD 316, KHTN 172, Lịch sử và Địa lí 12.
- Môn chưa có trong bảng dùng hue mặc định 245 (brand).

## 3. Chữ

| Lớp            | Cỡ (clamp)                     | Dùng cho                         |
| -------------- | ------------------------------ | -------------------------------- |
| `text-display` | `2.1rem → 3.6rem`, weight 800  | Tiêu đề hero (một lần mỗi trang) |
| `h1`           | `1.75rem → 2.6rem`             | Tiêu đề trang                    |
| `h2`           | `1.35rem → 1.85rem`            | Tiêu đề khối                     |
| `h3`           | `1.1rem → 1.3rem`              | Tiêu đề thẻ                      |
| `text-eyebrow` | `0.78rem`, uppercase, tracking | Nhãn nhỏ trên tiêu đề khối       |
| body           | 0.875–1rem                     | Nội dung                         |

Font: **Be Vietnam Pro** (subset tiếng Việt, tự host qua `@fontsource`). Tiêu đề dùng
`text-wrap: balance` và `letter-spacing` âm nhẹ.

## 4. Khoảng cách & bố cục

- Nhịp khối trang chủ: `.section-stack` (2.5rem ở mobile, 4rem từ `md`).
- Bề rộng nội dung: `.section-shell` (tối đa 80rem, padding 1rem → 1.5rem).
- Thẻ: bán kính `--radius-card` (1.25rem); ô nhỏ dùng `rounded-xl`/`rounded-2xl`; nút và nhãn dùng
  `rounded-xl`/`rounded-full`.
- Lưới phổ biến: lớp học `2 → 3 → 4 → 6` cột; môn học `1 → 2 → 3 → 4` cột; chân trang 1 → 4 cột.

## 5. Đổ bóng

| Token           | Dùng cho                           |
| --------------- | ---------------------------------- |
| `--shadow-soft` | Thẻ thường, nút chính              |
| `--shadow-lift` | Thẻ nổi khi hover, hero, hộp thoại |
| `--shadow-tile` | Ô số lớp, ô icon có chiều sâu      |

## 6. Thành phần dùng chung (`components/ui`)

`Button` (primary, secondary, outline, ghost, soft, danger × sm/md/lg), `Card` (nhận `tone`),
`Badge` (neutral, brand, success, accent, warning, danger), `Field` (render-prop cho id/aria),
`Input`, `Select`, `Textarea`, `Dialog` (thẻ `<dialog>` gốc), `EmptyState` (kèm minh họa),
`ErrorState`, `Skeleton`, `PageHeader` (có `eyebrow`), `StatTile`, `DataTable`.

Quy ước:

- `Field` truyền `{ id, describedBy, invalid }` để mọi ô nhập có nhãn + mô tả + trạng thái lỗi.
- `EmptyState` nhận `artSlug` (minh họa theo môn) hoặc `artKey` (`book`, `thu-vien`, `ky-thi`, `timo-ai`).
- Bảng quản trị dùng class `.data-table` (header chữ nhỏ, hàng có hover, cuộn ngang trong `DataTable`).

## 7. Minh họa

Hai phong cách, cùng dữ liệu:

| Phong cách  | Component    | Đặc điểm                                                                | Dùng ở đâu                                               |
| ----------- | ------------ | ----------------------------------------------------------------------- | -------------------------------------------------------- |
| Flat vector | `SubjectArt` | Khối gradient, lớp lệch phía dưới tạo chiều sâu, vệt sáng, bóng đổ mềm  | Trang chủ, thẻ môn, lối vào nhanh, trạng thái rỗng       |
| Phấn vẽ tay | `ChalkArt`   | Nét trắng 2.6px bo tròn, nét phấn vàng cho điểm nhấn, lớp phác lệch nhẹ | Thẻ môn ở trang lớp, khối "sắp ra mắt", trang giới thiệu |

Quy tắc vai trò trong motif (`visuals.ts`):

- Khối đặc (fill): `base` (gradient tone), `accent` (gradient cam), `deep` (tone đậm), `paper`
  (mặt sáng – được tô trắng kèm viền mảnh để vẫn thấy trên nền sáng).
- Nét (stroke, không fill): `line` (nét chính), `muted` (nét phụ, có thể đứt).
- Thứ tự vẽ = thứ tự khai báo; lớp "chiều sâu" luôn ở dưới cùng.

Bộ 18 chủ đề: Toán, Vật lí, Hóa học, Sinh học, Ngữ văn, Tiếng Anh, Lịch sử, Địa lí, Tiếng Việt,
Tin học, Công nghệ, GDCD, KHTN, Lịch sử và Địa lí, Thư viện số, Thi trực tuyến, TIMO AI, Sách
(mặc định). Tất cả là thiết kế gốc của TIMO; không dùng tài sản của OLM, Khan Academy hay nguồn khác.

Khung vẽ chuẩn `0 0 120 120`, có bóng đổ ở `y≈113` và vùng an toàn `6–114`.

## 8. Chuyển động

- Xuất hiện: `.rise-in` / `.rise-in-slow` (dịch lên 14px, 520–760ms, easing `cubic-bezier(.22,1,.36,1)`).
- Nổi nhẹ: `.float-slow` / `.float-slower` (chỉ dùng cho hình trang trí, kèm `motion-reduce:animate-none`).
- Tương tác: thẻ nâng 3px trong 220ms (`card-interactive`); nút đổi màu 200ms.
- Tất cả bị vô hiệu hoá khi `prefers-reduced-motion: reduce` (quy tắc toàn cục trong `index.css`).

## 9. Khả năng truy cập

- Mọi hình trang trí đặt `aria-hidden`; hình mang thông tin có `<title>` và `role="img"`.
- Vòng focus dùng `:focus-visible` với `--focus-ring` 3px.
- Liên kết "Bỏ qua điều hướng" ở đầu trang công khai; `<main id="main">` là đích.
- Bảng có `<caption class="sr-only">`, tiêu đề cột `scope="col"`; nút chỉ có icon phải có `aria-label`.
- Vùng cập nhật động dùng `aria-live="polite"` (khung quản trị) hoặc `role="status"` (khu vực tải).
- Trạng thái lỗi dùng `role="alert"`.
- Không dùng màu làm dấu hiệu duy nhất: trạng thái khóa AI/badge luôn kèm chữ và icon.

## 10. Kiểm thử

- `apps/web/src/lib/visuals.test.tsx` – 18 motif hợp lệ, render được cả hai phong cách, ánh xạ slug,
  12 hue lớp khác nhau, thuộc tính trợ năng của hình.
- `apps/web/src/components/brand/brand.test.tsx` – biểu trưng, minh họa, logo.
- `apps/web/src/pages/HomePage.test.tsx` – thứ tự khối CMS, nhóm lớp, trạng thái rỗng trung thực.
- Quy trình xem trước hình minh họa: biên dịch `visuals.ts` bằng esbuild rồi rasterize bảng 18 hình
  (dùng cho rà soát thị giác khi không có trình duyệt).
