import { NavLink, Outlet, Link } from "react-router";
import {
  Bot,
  BookMarked,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  ScrollText,
  School,
  UserCog,
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

interface AdminGroup {
  label: string;
  links: AdminLink[];
}

export const ADMIN_GROUPS: AdminGroup[] = [
  {
    label: "Tổng quan",
    links: [
      { to: "/admin", label: "Bảng điều khiển", icon: LayoutDashboard, permission: "users:view" },
    ],
  },
  {
    label: "Danh mục nội dung",
    links: [
      { to: "/admin/lop-hoc", label: "Lớp học", icon: School, permission: "grades:view" },
      { to: "/admin/mon-hoc", label: "Môn học", icon: BookMarked, permission: "subjects:view" },
      { to: "/admin/cms", label: "Trang chủ (CMS)", icon: LayoutTemplate, permission: "cms:view" },
    ],
  },
  {
    label: "Người dùng & an toàn",
    links: [
      { to: "/admin/nguoi-dung", label: "Người dùng", icon: Users, permission: "users:view" },
      { to: "/admin/ai", label: "Khóa AI", icon: Bot, permission: "ai:manage" },
      { to: "/admin/nhat-ky", label: "Nhật ký", icon: ScrollText, permission: "audit:view" },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Quản trị viên cấp cao",
  admin: "Quản trị viên",
  moderator: "Kiểm duyệt viên",
  teacher: "Giáo viên",
  student: "Học sinh",
  parent: "Phụ huynh",
  support_agent: "Nhân viên hỗ trợ",
};

/**
 * Khung quản trị: sidebar trên desktop, thanh cuộn ngang trên mobile.
 * Ẩn mục menu KHÔNG phải cơ chế bảo mật – API luôn kiểm tra quyền.
 */
export function AdminShell() {
  const { can, user, signOut } = useAuth();
  const groups = ADMIN_GROUPS.map((g) => ({
    ...g,
    links: g.links.filter((l) => can(l.permission)),
  })).filter((g) => g.links.length > 0);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:gap-8 md:py-8">
      <aside className="md:w-64 md:shrink-0">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
          <p className="text-eyebrow">Quản trị TIMO</p>
          {user && (
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/60 dark:text-brand-100">
                <UserCog className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text-strong)]">
                  {user.displayName}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") || "Chưa có vai trò"}
                </p>
              </div>
            </div>
          )}
          <Link
            to="/"
            className="mt-4 inline-flex text-xs font-semibold text-brand-600 dark:text-brand-200"
          >
            ← Về trang chủ
          </Link>
        </div>

        <nav aria-label="Menu quản trị" className="mt-4 -mx-1 overflow-x-auto md:overflow-visible">
          <div className="flex gap-1.5 px-1 md:flex-col md:gap-4">
            {groups.map((group) => (
              <div key={group.label} className="shrink-0 md:shrink">
                <p className="mb-1.5 hidden px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] md:block">
                  {group.label}
                </p>
                <ul className="flex gap-1.5 md:flex-col">
                  {group.links.map(({ to, label, icon: Icon }) => (
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
              </div>
            ))}
          </div>
        </nav>

        {user && (
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 hidden w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)] md:flex"
          >
            <LogOut className="size-4.5" aria-hidden="true" />
            Đăng xuất
          </button>
        )}
      </aside>
      <section className="min-w-0 flex-1" aria-live="polite">
        <Outlet />
      </section>
    </div>
  );
}
