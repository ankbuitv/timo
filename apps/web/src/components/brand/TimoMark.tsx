import { useId } from "react";

/**
 * Biểu trưng TIMO – thiết kế gốc của dự án, không sao chép thương hiệu bên thứ ba.
 *
 * Hình khối: chữ T cách điệu (thanh ngang + trụ dọc bo tròn) trong ô squircle gradient,
 * kèm "tia tiến bộ" màu cam phía trên bên phải thể hiện tinh thần tiến bộ mỗi ngày.
 */
export function TimoMark({
  className,
  title,
}: {
  className?: string;
  /** Chỉ truyền khi biểu trưng đứng một mình; trong liên kết đã có nhãn thì để trống. */
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `timo-mark-${uid}`;
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6258F5" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {/* Thanh ngang của chữ T */}
      <rect x="7.5" y="9" width="17" height="4.6" rx="2.3" fill="#ffffff" />
      {/* Trụ dọc, thu ngắn để nhường chỗ cho tia tiến bộ */}
      <rect x="13.7" y="9" width="4.6" height="14.4" rx="2.3" fill="#ffffff" />
      {/* Tia tiến bộ: cung nhỏ + điểm sáng */}
      <path
        d="M22.4 22.6c2.6-.6 4.4-2.6 4.6-5.2"
        fill="none"
        stroke="#FF8747"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="27" cy="16.2" r="1.9" fill="#FF8747" />
    </svg>
  );
}
