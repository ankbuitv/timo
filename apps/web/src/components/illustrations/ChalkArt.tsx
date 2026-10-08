import { motifFor, type ArtKey, type ArtRole, type Prim } from "../../lib/visuals";
import { cn } from "../../lib/cn";

/**
 * Minh họa kiểu phấn vẽ tay trên bảng xanh – dùng cho nội dung học tập.
 *
 * Cùng dữ liệu hình học với `SubjectArt` nhưng chỉ vẽ NÉT: nét phấn trắng, một nét màu phấn
 * vàng cho điểm nhấn, thêm một lớp "phác lại" hơi lệch để tạo cảm giác vẽ tay, cùng vài hạt
 * phấn mờ. Không dùng ảnh hay tài sản của bên thứ ba.
 */
const CHALK = "#f4fbf7";
const CHALK_WARM = "#ffd166";
const CHALK_MINT = "#9be7c4";

const STROKE: Record<
  ArtRole,
  { stroke: string; width: number; opacity: number; dashed?: boolean }
> = {
  base: { stroke: CHALK, width: 2.6, opacity: 0.95 },
  accent: { stroke: CHALK_WARM, width: 2.6, opacity: 1 },
  deep: { stroke: CHALK_MINT, width: 2.2, opacity: 0.9 },
  paper: { stroke: CHALK, width: 1.8, opacity: 0.55, dashed: true },
  line: { stroke: CHALK, width: 2.2, opacity: 0.85 },
  muted: { stroke: CHALK, width: 1.6, opacity: 0.6, dashed: true },
};

export function ChalkArt({
  artKey,
  className,
  title,
  board = true,
}: {
  artKey: ArtKey;
  className?: string;
  title?: string;
  /** Bật nền bảng xanh phía sau hình. */
  board?: boolean;
}) {
  const motif = motifFor(artKey);

  function shape(p: Prim, key: string, sketch = false) {
    const role = p.role ?? "base";
    const s = STROKE[role];
    const stroke = sketch ? s.stroke : s.stroke;
    const props = {
      fill: "none",
      stroke,
      strokeWidth: s.width,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      opacity: sketch ? s.opacity * 0.4 : s.opacity,
      strokeDasharray:
        p.kind !== "text" && "dashed" in p && p.dashed ? "6 5" : s.dashed ? "5 5" : undefined,
    };
    switch (p.kind) {
      case "path":
        return <path key={key} d={p.d} {...props} />;
      case "rect":
        return <rect key={key} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r ?? 2} {...props} />;
      case "circle":
        return <circle key={key} cx={p.cx} cy={p.cy} r={p.r} {...props} />;
      case "ellipse":
        return <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} {...props} />;
      case "line":
        return <line key={key} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} {...props} />;
      case "polyline":
        return <polyline key={key} points={p.points} {...props} />;
      case "text":
        return (
          <text
            key={key}
            x={p.x}
            y={p.y}
            fontSize={p.size ?? 20}
            fontWeight={700}
            fill={stroke}
            opacity={props.opacity}
            fontFamily="var(--font-chalk)"
          >
            {p.content}
          </text>
        );
    }
  }

  const svg = (
    <svg
      viewBox="0 0 120 120"
      className={board ? "size-full" : className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {/* Hạt phấn mờ */}
      <g fill={CHALK} opacity="0.14">
        <circle cx="16" cy="104" r="2.4" />
        <circle cx="24" cy="112" r="1.6" />
        <circle cx="104" cy="18" r="2" />
        <circle cx="98" cy="10" r="1.3" />
      </g>
      {/* Lớp phác lại: hơi lệch và mờ, tạo cảm giác nét vẽ tay. */}
      <g transform="rotate(0.6 60 60)" opacity="1">
        {motif.prims.map((p, i) => shape(p, `s-${i}`, true))}
      </g>
      <g>{motif.prims.map((p, i) => shape(p, `m-${i}`))}</g>
    </svg>
  );

  if (!board) return svg;
  return (
    <div className={cn("chalkboard chalkboard-grid aspect-square w-full p-3", className)}>
      {svg}
    </div>
  );
}
