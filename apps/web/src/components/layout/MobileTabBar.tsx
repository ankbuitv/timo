import { NavLink } from "react-router";
import { User } from "lucide-react";
import { MOBILE_TABS } from "../../lib/navigation";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/cn";

/** Thanh tab cố định dành riêng cho màn hình nhỏ (< md). */
export function MobileTabBar() {
  const { session } = useAuth();
  const tabs = [
    ...MOBILE_TABS,
    session
      ? { label: "Tài khoản", href: "/tai-khoan", icon: User }
      : { label: "Đăng nhập", href: "/dang-nhap", icon: User },
  ];
  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--surface-card)_92%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <NavLink
              to={href}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                  isActive ? "text-brand-600 dark:text-brand-200" : "text-[var(--text-muted)]",
                )
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
