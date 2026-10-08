import { Link } from "react-router";
import { config } from "../../lib/config";
import { TIMO_BRAND } from "@timo/shared";
import { TimoMark } from "../brand/TimoMark";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] pb-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <TimoMark className="size-9 shrink-0" />
            <p className="text-lg font-bold text-[var(--text-strong)]">TIMO</p>
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{TIMO_BRAND.sloganVi}</p>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Nền tảng học tập K12 theo Chương trình GDPT 2018 – Kết nối tri thức với cuộc sống.
          </p>
        </div>
        <nav aria-label="Liên kết" className="grid grid-cols-2 gap-2 text-sm">
          <Link className="hover:text-brand-600" to="/thong-tin">
            Giới thiệu
          </Link>
          <Link className="hover:text-brand-600" to="/#lop-hoc">
            Lớp học
          </Link>
          {config.supportUrl && (
            <a className="hover:text-brand-600" href={config.supportUrl} rel="noopener noreferrer">
              Trung tâm hỗ trợ
            </a>
          )}
          {config.statusUrl && (
            <a className="hover:text-brand-600" href={config.statusUrl} rel="noopener noreferrer">
              Trạng thái hệ thống
            </a>
          )}
        </nav>
        <p className="text-xs text-[var(--text-muted)]">
          © {year} TIMO. Phiên bản thử nghiệm – một số tính năng đang được phát triển.
        </p>
      </div>
    </footer>
  );
}
