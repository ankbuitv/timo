import { Button } from "../ui";

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label="Phân trang"
      className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-4 py-3 text-sm"
    >
      <span className="text-[var(--text-muted)]">
        Trang {page} / {pages} · {total.toLocaleString("vi-VN")} bản ghi
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </nav>
  );
}
