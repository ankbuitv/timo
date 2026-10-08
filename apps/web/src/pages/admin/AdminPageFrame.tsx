import type { ReactNode } from "react";
import { usePageMeta } from "../../lib/seo";

export function useAdminMeta(title: string) {
  usePageMeta({ title: `${title} – Quản trị TIMO`, noindex: true });
}

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`surface-card overflow-hidden ${className}`}>{children}</div>;
}
