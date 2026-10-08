import { Link } from "react-router";
import { TimoMark } from "../brand/TimoMark";

/** Logo TIMO: biểu trưng gốc + wordmark + khẩu hiệu. */
export function TimoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2.5 rounded-xl"
      aria-label="TIMO – Trang chủ"
    >
      <TimoMark className="size-9 shrink-0 shadow-soft transition-transform duration-300 group-hover:-rotate-6" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-tight text-[var(--text-strong)]">TIMO</span>
          <span className="mt-0.5 hidden text-[11px] font-medium text-[var(--text-muted)] sm:block">
            Học mọi lúc, giỏi mọi nơi
          </span>
        </span>
      )}
    </Link>
  );
}
