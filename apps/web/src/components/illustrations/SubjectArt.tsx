import { useId } from "react";
import { DEPTH_ROLES, FILL_ROLES, motifFor, type ArtKey, type Prim } from "../../lib/visuals";

/**
 * Minh họa flat vector có chiều sâu nhẹ (phong cách marketing / điều hướng).
 *
 * Quy tắc render (xem `lib/visuals.ts`):
 * - `base` / `accent` / `deep`: khối đặc, có lớp lệch phía dưới tạo chiều sâu.
 * - `paper`: mặt sáng (trang giấy, màn hình) – tô trắng kèm viền mảnh để không biến mất trên nền sáng.
 * - `line` / `muted`: chỉ vẽ NÉT, không tô – dùng cho đường trục, quỹ đạo, nét chữ.
 */
export function SubjectArt({
  artKey,
  hue,
  className,
  title,
}: {
  artKey: ArtKey;
  /** Hue (0–360) của môn học; lấy từ `hueForSubject`. */
  hue: number;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const baseId = `sa-base-${uid}`;
  const accentId = `sa-accent-${uid}`;
  const paperId = `sa-paper-${uid}`;
  const motif = motifFor(artKey);

  function shape(p: Prim, key: string, layer: "main" | "depth") {
    const role = p.role ?? "base";
    const filled = FILL_ROLES.includes(role);
    const fillFor = (): string => {
      if (layer === "depth") {
        if (role === "base") return `hsl(${hue + 18} 62% 40%)`;
        if (role === "accent") return "#d9641f";
        return `hsl(${hue + 16} 55% 30%)`;
      }
      if (role === "base") return `url(#${baseId})`;
      if (role === "accent") return `url(#${accentId})`;
      if (role === "paper") return `url(#${paperId})`;
      return `hsl(${hue + 14} 62% 40%)`;
    };
    const strokeFor = (): string => {
      if (role === "muted") return `hsl(${hue} 32% 58%)`;
      if (role === "paper") return `hsl(${hue} 50% 60%)`;
      return `hsl(${hue + 18} 48% 30%)`;
    };

    const props: Record<string, unknown> = filled
      ? { fill: fillFor() }
      : { fill: "none", stroke: strokeFor(), strokeWidth: role === "muted" ? 2.4 : 3 };
    if (filled && role === "paper" && layer === "main") {
      props.stroke = strokeFor();
      props.strokeWidth = 1.9;
    }
    const dash = !filled && "dashed" in p && p.dashed ? "6 5" : undefined;
    if (dash) props.strokeDasharray = dash;
    const common = {
      ...props,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
    };

    switch (p.kind) {
      case "path":
        return <path key={key} d={p.d} {...common} />;
      case "rect":
        return (
          <rect key={key} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r ?? 2} {...common} />
        );
      case "circle":
        return <circle key={key} cx={p.cx} cy={p.cy} r={p.r} {...common} />;
      case "ellipse":
        return <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} {...common} />;
      case "line":
        return <line key={key} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} {...common} />;
      case "polyline":
        return <polyline key={key} points={p.points} {...common} />;
      case "text":
        return (
          <text
            key={key}
            x={p.x}
            y={p.y}
            fontSize={p.size ?? 20}
            fontWeight={800}
            fill={layer === "depth" ? fillFor() : filled ? fillFor() : strokeFor()}
            fontFamily="var(--font-sans)"
          >
            {p.content}
          </text>
        );
    }
  }

  const rotated = (p: Prim) =>
    p.kind !== "text" && "rotate" in p && p.rotate
      ? `rotate(${p.rotate} ${"cx" in p ? p.cx : "x" in p ? p.x + p.w / 2 : 60} ${
          "cy" in p ? p.cy : "y" in p ? p.y + p.h / 2 : 60
        })`
      : undefined;

  function shapeGroup(p: Prim, key: string, layer: "main" | "depth") {
    const transform = rotated(p);
    const node = shape(p, key, layer);
    return transform ? (
      <g key={key} transform={transform}>
        {node}
      </g>
    ) : (
      node
    );
  }

  // Thứ tự vẽ = thứ tự khai báo trong motif (nét khai sau sẽ nằm trên khối khai trước),
  // còn lớp "chiều sâu" luôn nằm dưới cùng.
  const depthLayer = motif.prims.filter((p) => DEPTH_ROLES.includes(p.role ?? "base"));

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={baseId} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 92% 76%)`} />
          <stop offset="1" stopColor={`hsl(${hue + 8} 78% 54%)`} />
        </linearGradient>
        <linearGradient id={accentId} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#ffb27d" />
          <stop offset="1" stopColor="#f0782f" />
        </linearGradient>
        <linearGradient id={paperId} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor={`hsl(${hue} 55% 92%)`} />
        </linearGradient>
      </defs>

      {/* Bóng đổ mềm dưới hình. */}
      <ellipse cx="60" cy="113" rx="40" ry="5.5" fill={`hsl(${hue} 40% 40%)`} opacity="0.12" />

      {/* Lớp khối phía dưới (chiều sâu nhẹ). */}
      <g transform="translate(2 3.4)" opacity="0.96">
        {depthLayer.map((p, i) => shapeGroup(p, `d-${i}`, "depth"))}
      </g>

      <g>{motif.prims.map((p, i) => shapeGroup(p, `m-${i}`, "main"))}</g>

      {/* Vệt sáng trên cạnh trên của khối tròn chính. */}
      <g opacity="0.45">
        {motif.prims
          .filter((p) => p.kind === "circle" && p.role === "base")
          .map((p, i) => {
            const c = p as Extract<Prim, { kind: "circle" }>;
            return (
              <ellipse
                key={`hl-${i}`}
                cx={c.cx - c.r * 0.35}
                cy={c.cy - c.r * 0.5}
                rx={c.r * 0.42}
                ry={c.r * 0.24}
                fill="#ffffff"
              />
            );
          })}
      </g>
    </svg>
  );
}
