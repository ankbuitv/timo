import { Link } from "react-router";

/** Logo TIMO: biểu tượng gradient + wordmark. Thiết kế gốc, không sao chép thương hiệu bên thứ ba. */
export function TimoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2.5 rounded-xl"
      aria-label="TIMO – Trang chủ"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-secondary-500 shadow-soft transition-transform group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path d="M4 6h16v3h-6.5v9h-3V9H4z" fill="#fff" />
          <circle cx="18.5" cy="17.5" r="2.5" fill="#FF8747" />
        </svg>
      </span>
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
