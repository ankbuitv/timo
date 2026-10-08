import { Link } from "react-router";
import { Code2, Mail, ShieldCheck } from "lucide-react";
import { config } from "../../lib/config";
import { TIMO_BRAND } from "@timo/shared";
import { TimoMark } from "../brand/TimoMark";

/** Liên kết ở chân trang – chỉ gồm đường dẫn đã tồn tại hoặc URL cấu hình qua env. */
const EXPLORE_LINKS = [
  { label: "Lớp học 1–12", to: "/#lop-hoc" },
  { label: "Môn học", to: "/#mon-hoc" },
  { label: "Giới thiệu TIMO", to: "/thong-tin" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] pb-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <TimoMark className="size-10 shrink-0" />
            <div>
              <p className="text-lg font-extrabold leading-none text-[var(--text-strong)]">TIMO</p>
              <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                {TIMO_BRAND.sloganVi}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
            Nền tảng học tập K12 Việt Nam theo Chương trình GDPT 2018 – {TIMO_BRAND.sloganEn}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Phiên bản thử nghiệm · nội dung đang được xây dựng
          </p>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="text-eyebrow">
            Khám phá
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {EXPLORE_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  className="text-[var(--text-body)] transition-colors hover:text-brand-600 dark:hover:text-brand-200"
                  to={l.to}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-account">
          <h2 id="footer-account" className="text-eyebrow">
            Tài khoản
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                className="text-[var(--text-body)] transition-colors hover:text-brand-600 dark:hover:text-brand-200"
                to="/dang-nhap"
              >
                Đăng nhập / Đăng ký
              </Link>
            </li>
            <li>
              <Link
                className="text-[var(--text-body)] transition-colors hover:text-brand-600 dark:hover:text-brand-200"
                to="/tai-khoan"
              >
                Trang cá nhân
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-system">
          <h2 id="footer-system" className="text-eyebrow">
            Hệ thống
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {config.supportUrl && (
              <li>
                <a
                  className="text-[var(--text-body)] transition-colors hover:text-brand-600 dark:hover:text-brand-200"
                  href={config.supportUrl}
                  rel="noopener noreferrer"
                >
                  Trung tâm hỗ trợ
                </a>
              </li>
            )}
            {config.statusUrl && (
              <li>
                <a
                  className="text-[var(--text-body)] transition-colors hover:text-brand-600 dark:hover:text-brand-200"
                  href={config.statusUrl}
                  rel="noopener noreferrer"
                >
                  Trạng thái hệ thống
                </a>
              </li>
            )}
            {config.repositoryUrl && (
              <li>
                <a
                  className="inline-flex items-center gap-2 text-[var(--text-body)] transition-colors hover:text-brand-600 dark:hover:text-brand-200"
                  href={config.repositoryUrl}
                  rel="noopener noreferrer"
                >
                  <Code2 className="size-4" aria-hidden="true" />
                  Mã nguồn
                </a>
              </li>
            )}
            {config.supportEmail && (
              <li>
                <a
                  className="inline-flex items-center gap-2 text-[var(--text-body)] transition-colors hover:text-brand-600 dark:hover:text-brand-200"
                  href={`mailto:${config.supportEmail}`}
                >
                  <Mail className="size-4" aria-hidden="true" />
                  Liên hệ hỗ trợ
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div className="border-t border-[var(--border-subtle)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} TIMO. Dự án học tập phi lợi nhuận dành cho học sinh Việt Nam.</p>
          <p>
            Không sao chép nội dung, hình ảnh hay thương hiệu của nền tảng khác. Hình minh họa là
            thiết kế gốc của TIMO.
          </p>
        </div>
      </div>
    </footer>
  );
}
