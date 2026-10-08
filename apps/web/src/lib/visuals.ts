/**
 * Thư viện hình học minh họa của TIMO.
 *
 * Mỗi chủ đề (môn học, thư viện, thi, AI…) được mô tả MỘT LẦN bằng dữ liệu hình học
 * (primitive) trong hệ toạ độ 120×120. Từ dữ liệu đó, hai bộ render tạo ra hai phong cách:
 *
 * - `SubjectArt`: flat vector hiện đại, có chiều sâu nhẹ (khối dưới tối hơn, viền sáng trên,
 *   bóng đổ mềm) – dùng cho marketing và điều hướng.
 * - `ChalkArt`: nét phấn vẽ tay (chỉ viền, nét tròn, có nét phác thứ hai) trên bảng xanh –
 *   dùng cho nội dung học tập.
 *
 * Toàn bộ hình là thiết kế gốc của dự án, không sao chép từ OLM, Khan Academy hay bất kỳ
 * nguồn nào khác. Màu lấy từ biến CSS `--tone-hue` của từng môn/lớp nên tự đổi theo chủ đề
 * sáng/tối mà không cần thêm màu cứng.
 */

/**
 * Vai trò quyết định cách render:
 * - Khối đặc (fill): `base` (gradient theo tone), `accent` (gradient cam), `deep` (tone đậm hơn),
 *   `paper` (mặt sáng như trang giấy/màn hình – có viền mảnh để vẫn thấy trên nền trắng).
 * - Nét (stroke, không fill): `line` (nét chính), `muted` (nét phụ, có thể đứt).
 */
export type ArtRole = "base" | "accent" | "deep" | "paper" | "line" | "muted";

export const FILL_ROLES: readonly ArtRole[] = ["base", "accent", "deep", "paper"];
export const DEPTH_ROLES: readonly ArtRole[] = ["base", "accent", "deep"];

export type Prim =
  | { kind: "path"; d: string; role?: ArtRole; dashed?: boolean }
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      r?: number;
      role?: ArtRole;
      rotate?: number;
    }
  | { kind: "circle"; cx: number; cy: number; r: number; role?: ArtRole; dashed?: boolean }
  | {
      kind: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      role?: ArtRole;
      rotate?: number;
      dashed?: boolean;
    }
  | {
      kind: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      role?: ArtRole;
      dashed?: boolean;
    }
  | { kind: "polyline"; points: string; role?: ArtRole; dashed?: boolean }
  | { kind: "text"; x: number; y: number; content: string; size?: number; role?: ArtRole };

export interface Motif {
  prims: Prim[];
}

export type ArtKey =
  | "toan"
  | "vat-li"
  | "hoa-hoc"
  | "sinh-hoc"
  | "van-hoc"
  | "tieng-anh"
  | "lich-su"
  | "dia-li"
  | "tieng-viet"
  | "tin-hoc"
  | "cong-nghe"
  | "gdcd"
  | "khtn"
  | "lich-su-dia-li"
  | "thu-vien"
  | "ky-thi"
  | "timo-ai"
  | "book";

const MOTIFS: Record<ArtKey, Motif> = {
  // Toán học: tam giác, compa, thước kẻ, ký hiệu π.
  toan: {
    prims: [
      { kind: "path", d: "M60 26 L93 92 L27 92 Z", role: "base" },
      { kind: "line", x1: 60, y1: 30, x2: 60, y2: 88, role: "muted", dashed: true },
      { kind: "line", x1: 60, y1: 26, x2: 40, y2: 86, role: "line" },
      { kind: "line", x1: 60, y1: 26, x2: 82, y2: 78, role: "line" },
      { kind: "circle", cx: 60, cy: 24, r: 5.5, role: "accent" },
      { kind: "rect", x: 12, y: 74, w: 32, h: 13, r: 4, role: "paper", rotate: -8 },
      { kind: "line", x1: 20, y1: 76, x2: 20, y2: 85, role: "muted" },
      { kind: "line", x1: 28, y1: 75, x2: 28, y2: 84, role: "muted" },
      { kind: "line", x1: 36, y1: 73, x2: 36, y2: 82, role: "muted" },
      { kind: "text", x: 94, y: 40, content: "π", size: 28, role: "deep" },
      { kind: "text", x: 14, y: 34, content: "+", size: 24, role: "accent" },
    ],
  },

  // Vật lí: nam châm chữ U, quỹ đạo electron, mũi tên lực.
  "vat-li": {
    prims: [
      {
        kind: "path",
        d: "M30 32 h18 v36 a12 12 0 0 0 24 0 V32 h18 v36 a30 30 0 0 1 -60 0 z",
        role: "base",
      },
      { kind: "rect", x: 26, y: 24, w: 26, h: 13, r: 4, role: "accent" },
      { kind: "rect", x: 68, y: 24, w: 26, h: 13, r: 4, role: "deep" },
      { kind: "ellipse", cx: 60, cy: 62, rx: 44, ry: 15, role: "line", rotate: -22 },
      { kind: "circle", cx: 24, cy: 46, r: 5, role: "deep" },
      { kind: "circle", cx: 96, cy: 76, r: 5, role: "accent" },
      { kind: "line", x1: 30, y1: 100, x2: 74, y2: 100, role: "line" },
      { kind: "polyline", points: "74 96 84 100 74 104", role: "line" },
    ],
  },

  // Hóa học: bình tam giác, dung dịch, bọt khí, vòng phân tử.
  "hoa-hoc": {
    prims: [
      {
        kind: "path",
        d: "M48 24 h24 v20 l22 50 a8 8 0 0 1 -7 11 H33 a8 8 0 0 1 -7 -11 l22 -50 z",
        role: "base",
      },
      {
        kind: "path",
        d: "M38 76 h44 l10 18 a8 8 0 0 1 -7 11 H33 a8 8 0 0 1 -7 -11 z",
        role: "accent",
      },
      { kind: "rect", x: 44, y: 18, w: 32, h: 9, r: 4.5, role: "deep" },
      { kind: "circle", cx: 54, cy: 68, r: 4, role: "paper" },
      { kind: "circle", cx: 66, cy: 60, r: 3, role: "paper" },
      { kind: "circle", cx: 60, cy: 78, r: 2.5, role: "paper" },
      { kind: "polyline", points: "84 32 L96 24 L108 32 L108 46 L96 54 L84 46 Z", role: "line" },
      { kind: "circle", cx: 96, cy: 24, r: 4, role: "accent" },
      { kind: "circle", cx: 108, cy: 39, r: 4, role: "accent" },
      { kind: "line", x1: 84, y1: 62, x2: 70, y2: 74, role: "muted" },
    ],
  },

  // Sinh học: lá, tế bào, chuỗi DNA.
  "sinh-hoc": {
    prims: [
      {
        kind: "path",
        d: "M64 16 c26 14 32 44 20 68 -30 4 -52 -14 -54 -40 0 -14 10 -24 34 -28 z",
        role: "base",
      },
      { kind: "line", x1: 50, y1: 76, x2: 74, y2: 34, role: "line" },
      { kind: "line", x1: 58, y1: 64, x2: 50, y2: 54, role: "muted" },
      { kind: "line", x1: 66, y1: 50, x2: 58, y2: 40, role: "muted" },
      { kind: "circle", cx: 26, cy: 84, r: 15, role: "paper" },
      { kind: "circle", cx: 26, cy: 84, r: 15, role: "muted" },
      { kind: "circle", cx: 26, cy: 84, r: 6, role: "accent" },
      { kind: "path", d: "M96 70 c-9 8 9 14 0 22 -9 8 9 14 0 22", role: "line" },
      { kind: "path", d: "M108 70 c-9 8 9 14 0 22 -9 8 9 14 0 22", role: "line" },
      { kind: "line", x1: 97, y1: 82, x2: 107, y2: 82, role: "muted" },
      { kind: "line", x1: 97, y1: 94, x2: 107, y2: 94, role: "muted" },
    ],
  },

  // Ngữ văn: sách có bìa và khối giấy, kèm bút lông.
  "van-hoc": {
    prims: [
      { kind: "rect", x: 18, y: 24, w: 74, h: 76, r: 9, role: "paper" },
      { kind: "rect", x: 18, y: 24, w: 18, h: 76, r: 8, role: "base" },
      { kind: "rect", x: 84, y: 24, w: 14, h: 76, r: 7, role: "deep" },
      { kind: "line", x1: 44, y1: 46, x2: 78, y2: 46, role: "muted" },
      { kind: "line", x1: 44, y1: 58, x2: 78, y2: 58, role: "muted" },
      { kind: "line", x1: 44, y1: 70, x2: 66, y2: 70, role: "muted" },
      { kind: "text", x: 22, y: 44, content: "V", size: 22, role: "paper" },
      { kind: "rect", x: 96, y: 46, w: 10, h: 44, r: 5, role: "accent", rotate: 14 },
      { kind: "path", d: "M92 96 l6 -8 8 5 -8 5 z", role: "deep" },
      {
        kind: "path",
        d: "M96 12 c10 6 4 20 -6 24 12 -2 20 -12 20 -22 0 -4 -6 -8 -14 -2 z",
        role: "accent",
      },
    ],
  },

  // Tiếng Anh: bong bóng hội thoại "Aa" và quả địa cầu.
  "tieng-anh": {
    prims: [
      { kind: "rect", x: 8, y: 18, w: 74, h: 48, r: 15, role: "base" },
      { kind: "path", d: "M32 64 v20 l20 -20 z", role: "base" },
      { kind: "text", x: 22, y: 52, content: "Aa", size: 28, role: "paper" },
      { kind: "circle", cx: 90, cy: 80, r: 24, role: "base" },
      {
        kind: "path",
        d: "M74 62 c8 6 22 4 30 -4 4 8 2 18 -6 24 -10 7 -22 4 -28 -5 -4 -6 -2 -12 4 -15 z",
        role: "accent",
      },
      { kind: "ellipse", cx: 90, cy: 80, rx: 24, ry: 10, role: "paper" },
      { kind: "line", x1: 90, y1: 56, x2: 90, y2: 104, role: "paper" },
      { kind: "ellipse", cx: 90, cy: 80, rx: 11, ry: 24, role: "paper" },
      { kind: "circle", cx: 18, cy: 92, r: 4, role: "accent" },
      { kind: "circle", cx: 36, cy: 100, r: 3, role: "accent" },
    ],
  },

  // Lịch sử: trống đồng và cuộn giấy.
  "lich-su": {
    prims: [
      { kind: "circle", cx: 40, cy: 50, r: 30, role: "base" },
      { kind: "circle", cx: 40, cy: 50, r: 21, role: "paper" },
      { kind: "circle", cx: 40, cy: 50, r: 13, role: "accent" },
      { kind: "path", d: "M40 42 l3 7 8 1 -6 6 2 8 -7 -4 -7 4 2 -8 -6 -6 8 -1 z", role: "paper" },
      { kind: "circle", cx: 40, cy: 20, r: 4, role: "deep" },
      { kind: "rect", x: 82, y: 32, w: 28, h: 52, r: 4, role: "paper" },
      { kind: "ellipse", cx: 96, cy: 30, rx: 14, ry: 6, role: "base" },
      { kind: "ellipse", cx: 96, cy: 86, rx: 14, ry: 6, role: "base" },
      { kind: "line", x1: 88, y1: 48, x2: 104, y2: 48, role: "muted" },
      { kind: "line", x1: 88, y1: 60, x2: 104, y2: 60, role: "muted" },
      { kind: "line", x1: 88, y1: 72, x2: 99, y2: 72, role: "muted" },
    ],
  },

  // Địa lí: quả địa cầu, dãy núi, la bàn.
  "dia-li": {
    prims: [
      { kind: "circle", cx: 44, cy: 50, r: 31, role: "base" },
      {
        kind: "path",
        d: "M24 34 c14 8 34 6 48 -6 4 10 0 24 -12 32 -14 9 -32 6 -40 -6 -6 -8 -4 -16 4 -20 z",
        role: "accent",
      },
      { kind: "ellipse", cx: 44, cy: 50, rx: 31, ry: 12, role: "paper" },
      { kind: "ellipse", cx: 44, cy: 50, rx: 13, ry: 31, role: "paper" },
      { kind: "path", d: "M62 104 l17 -28 17 28 z", role: "deep" },
      { kind: "path", d: "M80 104 l15 -17 15 17 z", role: "base" },
      { kind: "path", d: "M74 90 l5 -8 5 8 z", role: "paper" },
      { kind: "circle", cx: 20, cy: 92, r: 13, role: "paper" },
      { kind: "path", d: "M20 81 l6 12 -6 11 -6 -11 z", role: "accent" },
      { kind: "circle", cx: 20, cy: 92, r: 3, role: "deep" },
    ],
  },

  // Tiếng Việt: trang vở kẻ dòng, chữ a/â/ă và bút chì.
  "tieng-viet": {
    prims: [
      { kind: "rect", x: 14, y: 22, w: 90, h: 76, r: 10, role: "base" },
      { kind: "rect", x: 20, y: 28, w: 78, h: 64, r: 7, role: "paper" },
      { kind: "line", x1: 26, y1: 48, x2: 92, y2: 48, role: "muted" },
      { kind: "line", x1: 26, y1: 66, x2: 92, y2: 66, role: "muted" },
      { kind: "line", x1: 26, y1: 84, x2: 92, y2: 84, role: "muted" },
      { kind: "text", x: 28, y: 44, content: "a", size: 22, role: "base" },
      { kind: "text", x: 50, y: 44, content: "â", size: 22, role: "deep" },
      { kind: "text", x: 70, y: 44, content: "ă", size: 22, role: "accent" },
      { kind: "path", d: "M28 60 q12 -8 24 0 q12 8 24 0", role: "accent" },
      { kind: "line", x1: 30, y1: 78, x2: 82, y2: 78, role: "muted" },
      { kind: "line", x1: 30, y1: 94, x2: 68, y2: 94, role: "muted" },
      { kind: "rect", x: 92, y: 8, w: 22, h: 9, r: 4.5, role: "accent", rotate: 14 },
    ],
  },

  // Tin học: màn hình, dấu ngoặc mã, con trỏ chuột.
  "tin-hoc": {
    prims: [
      { kind: "rect", x: 10, y: 22, w: 100, h: 62, r: 11, role: "base" },
      { kind: "rect", x: 19, y: 31, w: 82, h: 44, r: 7, role: "paper" },
      { kind: "text", x: 27, y: 62, content: "{ }", size: 24, role: "deep" },
      { kind: "line", x1: 62, y1: 46, x2: 92, y2: 46, role: "muted" },
      { kind: "line", x1: 62, y1: 58, x2: 84, y2: 58, role: "muted" },
      { kind: "rect", x: 50, y: 84, w: 20, h: 11, r: 3, role: "deep" },
      { kind: "rect", x: 32, y: 95, w: 56, h: 9, r: 4.5, role: "accent" },
      { kind: "path", d: "M84 64 l15 7 -6 2.5 -2.5 6 z", role: "accent" },
    ],
  },

  // Công nghệ: bánh răng và cờ lê.
  "cong-nghe": {
    prims: [
      { kind: "rect", x: 40, y: 12, w: 12, h: 14, r: 3, role: "base" },
      { kind: "rect", x: 40, y: 74, w: 12, h: 14, r: 3, role: "base" },
      { kind: "rect", x: 12, y: 44, w: 14, h: 12, r: 3, role: "base" },
      { kind: "rect", x: 66, y: 44, w: 14, h: 12, r: 3, role: "base" },
      { kind: "circle", cx: 46, cy: 50, r: 25, role: "base" },
      { kind: "circle", cx: 46, cy: 50, r: 9, role: "paper" },
      { kind: "path", d: "M84 22 a14 14 0 1 0 13 21 l-10 -6 4 -13 z", role: "accent" },
      { kind: "line", x1: 88, y1: 88, x2: 108, y2: 66, role: "deep" },
      { kind: "circle", cx: 110, cy: 62, r: 8, role: "deep" },
    ],
  },

  // Giáo dục công dân: cân công lí.
  gdcd: {
    prims: [
      { kind: "rect", x: 57, y: 30, w: 7, h: 60, r: 3.5, role: "deep" },
      { kind: "rect", x: 34, y: 90, w: 52, h: 10, r: 5, role: "base" },
      { kind: "rect", x: 22, y: 30, w: 76, h: 7, r: 3.5, role: "base" },
      { kind: "circle", cx: 60, cy: 24, r: 6, role: "accent" },
      { kind: "line", x1: 26, y1: 37, x2: 26, y2: 54, role: "line" },
      { kind: "line", x1: 94, y1: 37, x2: 94, y2: 54, role: "line" },
      { kind: "path", d: "M8 54 h34 a17 17 0 0 1 -34 0 z", role: "accent" },
      { kind: "path", d: "M78 54 h34 a17 17 0 0 1 -34 0 z", role: "accent" },
      { kind: "line", x1: 60, y1: 36, x2: 60, y2: 64, role: "line" },
      { kind: "circle", cx: 60, cy: 68, r: 5, role: "accent" },
    ],
  },

  // Khoa học tự nhiên: kính lúp soi mầm cây và bánh răng nhỏ.
  khtn: {
    prims: [
      { kind: "circle", cx: 48, cy: 46, r: 30, role: "base" },
      { kind: "circle", cx: 48, cy: 46, r: 24, role: "paper" },
      { kind: "path", d: "M48 66 c-12 -8 -14 -26 -6 -38 9 4 14 15 6 38 z", role: "base" },
      { kind: "line", x1: 48, y1: 60, x2: 48, y2: 34, role: "line" },
      { kind: "path", d: "M48 46 q9 -6 12 -15", role: "accent" },
      { kind: "line", x1: 26, y1: 98, x2: 54, y2: 74, role: "deep" },
      { kind: "rect", x: 92, y: 66, w: 8, h: 11, r: 2, role: "base" },
      { kind: "rect", x: 92, y: 100, w: 8, h: 11, r: 2, role: "base" },
      { kind: "rect", x: 72, y: 84, w: 11, h: 8, r: 2, role: "base" },
      { kind: "rect", x: 110, y: 84, w: 10, h: 8, r: 2, role: "base" },
      { kind: "circle", cx: 96, cy: 88, r: 16, role: "base" },
      { kind: "circle", cx: 96, cy: 88, r: 6, role: "paper" },
    ],
  },

  // Lịch sử và Địa lí (tích hợp THCS): nửa trống đồng, nửa địa cầu, ghim bản đồ.
  "lich-su-dia-li": {
    prims: [
      { kind: "path", d: "M60 14 a38 38 0 0 0 0 76 z", role: "base" },
      { kind: "path", d: "M60 24 a28 28 0 0 0 0 56 z", role: "paper" },
      { kind: "circle", cx: 60, cy: 52, r: 15, role: "accent" },
      { kind: "path", d: "M60 44 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 z", role: "paper" },
      { kind: "ellipse", cx: 60, cy: 52, rx: 38, ry: 15, role: "line" },
      { kind: "ellipse", cx: 60, cy: 52, rx: 17, ry: 38, role: "line" },
      { kind: "circle", cx: 60, cy: 52, r: 38, role: "muted", dashed: true },
      {
        kind: "path",
        d: "M94 96 a10 10 0 0 1 10 10 l-10 14 -10 -14 a10 10 0 0 1 10 -10 z",
        role: "accent",
      },
      { kind: "circle", cx: 94, cy: 104, r: 4, role: "paper" },
    ],
  },

  // Thư viện số: kệ sách và thẻ đánh dấu.
  "thu-vien": {
    prims: [
      { kind: "rect", x: 14, y: 28, w: 19, h: 52, r: 4, role: "base" },
      { kind: "rect", x: 37, y: 18, w: 17, h: 62, r: 4, role: "accent" },
      { kind: "rect", x: 58, y: 34, w: 17, h: 46, r: 4, role: "deep" },
      { kind: "line", x1: 20, y1: 40, x2: 27, y2: 40, role: "paper" },
      { kind: "line", x1: 43, y1: 32, x2: 48, y2: 32, role: "paper" },
      { kind: "line", x1: 64, y1: 46, x2: 69, y2: 46, role: "paper" },
      { kind: "rect", x: 8, y: 80, w: 76, h: 9, r: 4.5, role: "muted" },
      { kind: "rect", x: 86, y: 40, w: 26, h: 48, r: 7, role: "paper" },
      { kind: "line", x1: 92, y1: 56, x2: 106, y2: 56, role: "muted" },
      { kind: "line", x1: 92, y1: 68, x2: 106, y2: 68, role: "muted" },
      { kind: "path", d: "M97 40 v18 l7 -6 7 6 v-18 z", role: "accent" },
    ],
  },

  // Thi trực tuyến: phiếu trả lời, đồng hồ, dấu tick.
  "ky-thi": {
    prims: [
      { kind: "rect", x: 12, y: 20, w: 62, h: 84, r: 9, role: "paper" },
      { kind: "line", x1: 22, y1: 34, x2: 46, y2: 34, role: "muted" },
      { kind: "circle", cx: 26, cy: 52, r: 6.5, role: "base" },
      { kind: "circle", cx: 50, cy: 52, r: 6.5, role: "muted" },
      { kind: "circle", cx: 26, cy: 74, r: 6.5, role: "muted" },
      { kind: "circle", cx: 50, cy: 74, r: 6.5, role: "base" },
      { kind: "circle", cx: 26, cy: 96, r: 6.5, role: "base" },
      { kind: "circle", cx: 50, cy: 96, r: 6.5, role: "muted" },
      { kind: "circle", cx: 92, cy: 40, r: 23, role: "base" },
      { kind: "circle", cx: 92, cy: 40, r: 17, role: "paper" },
      { kind: "line", x1: 92, y1: 40, x2: 92, y2: 27, role: "deep" },
      { kind: "line", x1: 92, y1: 40, x2: 102, y2: 45, role: "deep" },
      { kind: "polyline", points: "82 78 90 88 108 62", role: "accent" },
      { kind: "rect", x: 62, y: 98, w: 46, h: 10, r: 5, role: "deep", rotate: -14 },
    ],
  },

  // TIMO AI: robot thân thiện, tia sáng và bong bóng.
  "timo-ai": {
    prims: [
      { kind: "rect", x: 16, y: 78, w: 9, h: 16, r: 4.5, role: "deep" },
      { kind: "rect", x: 95, y: 78, w: 9, h: 16, r: 4.5, role: "deep" },
      { kind: "line", x1: 60, y1: 30, x2: 60, y2: 18, role: "deep" },
      { kind: "circle", cx: 60, cy: 14, r: 5, role: "accent" },
      { kind: "rect", x: 18, y: 28, w: 84, h: 60, r: 18, role: "base" },
      { kind: "rect", x: 28, y: 40, w: 64, h: 36, r: 13, role: "paper" },
      { kind: "circle", cx: 47, cy: 57, r: 5.5, role: "deep" },
      { kind: "circle", cx: 73, cy: 57, r: 5.5, role: "deep" },
      { kind: "path", d: "M53 66 q7 6 14 0", role: "accent" },
      { kind: "path", d: "M96 12 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z", role: "accent" },
      { kind: "path", d: "M26 92 h22 v14 l-16 -14 z", role: "base" },
    ],
  },

  // Sách (mặc định cho môn tuỳ chỉnh chưa có hình riêng).
  book: {
    prims: [
      { kind: "rect", x: 22, y: 20, w: 78, h: 84, r: 10, role: "base" },
      { kind: "rect", x: 22, y: 20, w: 13, h: 84, r: 6, role: "deep" },
      { kind: "rect", x: 40, y: 34, w: 50, h: 56, r: 6, role: "paper" },
      { kind: "line", x1: 48, y1: 50, x2: 82, y2: 50, role: "muted" },
      { kind: "line", x1: 48, y1: 62, x2: 82, y2: 62, role: "muted" },
      { kind: "line", x1: 48, y1: 74, x2: 68, y2: 74, role: "muted" },
      { kind: "path", d: "M96 20 v28 l-9 -7 -9 7 v-28 z", role: "accent" },
      {
        kind: "path",
        d: "M92 84 l5 10 11 1 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -1 z",
        role: "accent",
      },
    ],
  },
};

export function motifFor(key: ArtKey): Motif {
  return MOTIFS[key];
}

/** Tone màu (hue) cho từng môn học – dùng chung cho thẻ, hình minh họa và nhãn. */
const SUBJECT_HUES: Record<string, number> = {
  toan: 232,
  "tieng-viet": 350,
  "van-hoc": 268,
  "tieng-anh": 208,
  "vat-li": 190,
  "hoa-hoc": 158,
  "sinh-hoc": 128,
  "lich-su": 26,
  "dia-li": 44,
  "tin-hoc": 250,
  "cong-nghe": 300,
  gdcd: 316,
  khtn: 172,
  "lich-su-dia-li": 12,
};

/** Từ slug môn học (do CMS/D1 trả về) sang khóa hình minh họa. */
const SLUG_TO_ART: Record<string, ArtKey> = {
  toan: "toan",
  "tieng-viet": "tieng-viet",
  "van-hoc": "van-hoc",
  "tieng-anh": "tieng-anh",
  "vat-li": "vat-li",
  "hoa-hoc": "hoa-hoc",
  "sinh-hoc": "sinh-hoc",
  "lich-su": "lich-su",
  "dia-li": "dia-li",
  "tin-hoc": "tin-hoc",
  "cong-nghe": "cong-nghe",
  gdcd: "gdcd",
  khtn: "khtn",
  "lich-su-dia-li": "lich-su-dia-li",
};

export function artKeyForSubject(slug: string): ArtKey {
  return SLUG_TO_ART[slug] ?? "book";
}

export function hueForSubject(slug: string): number {
  return SUBJECT_HUES[slug] ?? 245;
}

/** Tone theo cấp học, dùng cho thẻ lớp và các khối theo khối lớp. */
export const STAGE_HUES = {
  primary: 150,
  lower_secondary: 232,
  upper_secondary: 26,
} as const;

// 12 sắc độ riêng cho lớp 1–12 (lệch dần quanh bánh xe màu, vẫn trong tông thương hiệu).
const GRADE_HUES = [150, 156, 163, 172, 186, 200, 214, 228, 244, 262, 282, 302];

export function hueForGrade(level: number): number {
  const index = Math.min(Math.max(Math.round(level), 1), 12) - 1;
  return GRADE_HUES[index] ?? STAGE_HUES.primary;
}
