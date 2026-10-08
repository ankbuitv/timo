import { NavLink, Outlet } from "react-router";
import {
  BookMarked,
  Bot,
  LayoutDashboard,
  LayoutTemplate,
  ScrollText,
  School,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/cn";

interface AdminLink {
  to: string;
  label: string;
  icon: LucideIcon;
  permission: string;
}

export const ADMIN_LINKS: AdminLink[] = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, permission: "users:view" },
  { to: "/admin/nguoi-dung", label: "Người dùng", icon: Users, permission: "users:view" },
  { to: "/admin/lop-hoc", label: "Lớp học", icon: School, permission: "grades:view" },
  { to: "/admin/mon-hoc", label: "Môn học", icon: BookMarked, permission: "subjects:view" },
  { to: "/admin/cms", label: "Trang chủ (CMS)", icon: LayoutTemplate, permission: "cms:view" },
  { to: "/admin/ai", label: "Khóa AI", icon: Bot, permission: "ai:manage" },
  { to: "/admin/nhat-ky", label: "Nhật ký", icon: ScrollText, permission: "audit:view" },
];

/**
 * Khung quản trị: sidebar trên desktop, thanh cuộn ngang trên mobile.
 * Ẩn mục menu KHÔNG phải cơ chế bảo mật – API luôn kiểm tra quyền.
 */
export function AdminShell() {
  const { can, user } = useAuth();
  const links = ADMIN_LINKS.filter((l) => can(l.permission));
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:py-8">
      <aside className="md:w-60 md:shrink-0">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Quản trị TIMO
        </div>
        <nav aria-label="Menu quản trị" className="-mx-1 overflow-x-auto md:overflow-visible">
          <ul className="flex gap-1.5 px-1 md:flex-col">
            {links.map(({ to, label, icon: Icon }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  end={to === "/admin"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-brand-500 text-white shadow-soft"
                        : "text-[var(--text-body)] hover:bg-[var(--surface-muted)]",
                    )
                  }
                >
                  <Icon className="size-4.5" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {user && (
          <p className="mt-6 hidden text-xs text-[var(--text-muted)] md:block">
            Vai trò: {user.roles.join(", ")}
          </p>
        )}
      </aside>
      <section className="min-w-0 flex-1" aria-live="polite">
        <Outlet />
      </section>
    </div>
  );
}
