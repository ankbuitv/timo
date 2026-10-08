import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Bell, LogIn, Menu, MessageSquare, Search, User, X } from "lucide-react";
import { PUBLIC_NAV } from "../../lib/navigation";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/cn";
import { Badge } from "../ui";
import { ThemeToggle } from "./ThemeToggle";
import { TimoLogo } from "./Logo";

/** Nút chưa triển khai: hiển thị rõ trạng thái, không giả vờ hoạt động. */
function ComingSoon({ label, icon: Icon }: { label: string; icon: typeof Search }) {
  return (
    <button
      type="button"
      disabled
      aria-label={`${label} – sắp ra mắt`}
      title={`${label} – sắp ra mắt`}
      className="flex size-10 cursor-not-allowed items-center justify-center rounded-xl text-[var(--text-muted)] opacity-60"
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, session, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--surface-card)_85%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-[4.5rem] sm:gap-4 sm:px-6">
        <TimoLogo />

        <nav aria-label="Điều hướng chính" className="ml-4 hidden min-w-0 flex-1 xl:block">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {PUBLIC_NAV.map((item) => (
              <li key={item.label} className="shrink-0">
                {item.href ? (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]",
                        isActive ||
                          (item.href === "/thong-tin" && location.pathname === "/thong-tin")
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-100"
                          : "text-[var(--text-body)]",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)]"
                  >
                    {item.label}
                    <Badge>Sắp ra mắt</Badge>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:inline-flex">
            <ComingSoon label="Tìm kiếm" icon={Search} />
          </span>
          <span className="hidden md:inline-flex">
            <ComingSoon label="Tin nhắn" icon={MessageSquare} />
          </span>
          <span className="hidden md:inline-flex">
            <ComingSoon label="Thông báo" icon={Bell} />
          </span>
          <ThemeToggle />
          {session && user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/tai-khoan"
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-[var(--text-strong)] hover:bg-[var(--surface-muted)]"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-100">
                  <User className="size-4" aria-hidden="true" />
                </span>
                <span className="max-w-32 truncate">{user.displayName}</span>
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              to="/dang-nhap"
              className="hidden items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-600 md:inline-flex"
            >
              <LogIn className="size-4" aria-hidden="true" />
              Đăng nhập
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            className="flex size-10 items-center justify-center rounded-xl hover:bg-[var(--surface-muted)] xl:hidden"
          >
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 pb-6 pt-4 xl:hidden"
        >
          <p className="text-eyebrow mb-3">Điều hướng</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PUBLIC_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  {item.href ? (
                    <Link
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-14 items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 text-sm font-semibold text-[var(--text-strong)] hover:border-brand-300 hover:bg-[var(--surface-muted)]"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
                        <Icon className="size-4.5" aria-hidden="true" />
                      </span>
                      {item.label}
                    </Link>
                  ) : (
                    <span className="flex min-h-14 items-center gap-2.5 rounded-2xl border border-dashed border-[var(--border-subtle)] p-3 text-sm text-[var(--text-muted)]">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)]">
                        <Icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <span className="flex flex-col">
                        {item.label}
                        <span className="text-[11px] font-bold uppercase tracking-wide">
                          Sắp ra mắt
                        </span>
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
            {session && user ? (
              <div className="flex items-center justify-between gap-2">
                <Link
                  to="/tai-khoan"
                  onClick={() => setOpen(false)}
                  className="font-semibold text-[var(--text-strong)]"
                >
                  {user.displayName}
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="text-sm font-medium text-[var(--text-muted)]"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                to="/dang-nhap"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 font-semibold text-brand-700 dark:text-brand-100"
              >
                Đăng nhập / Đăng ký
                <LogIn className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
