import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ArrowRight, BookMarked, LayoutTemplate, School, Users } from "lucide-react";
import { Card, ErrorState, PageHeader, Skeleton, StatTile } from "../../components/ui";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useAdminMeta } from "./AdminPageFrame";

interface Overview {
  users: number;
  grades: number;
  subjects: number;
  homepageSections: number;
  note: string;
}

/** Lối tắt trong bảng điều khiển; chỉ hiển thị mục mà người dùng có quyền xem. */
const SHORTCUTS = [
  { to: "/admin/lop-hoc", label: "Quản lý lớp học", permission: "grades:view", icon: School },
  { to: "/admin/mon-hoc", label: "Quản lý môn học", permission: "subjects:view", icon: BookMarked },
  { to: "/admin/cms", label: "Chỉnh trang chủ", permission: "cms:view", icon: LayoutTemplate },
] as const;

export default function OverviewPage() {
  useAdminMeta("Tổng quan");
  const { can } = useAuth();
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => (await api.get<Overview>("/admin/overview")).data,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị"
        title="Bảng điều khiển"
        description="Số liệu được đếm trực tiếp từ cơ sở dữ liệu D1 – không phải dữ liệu mẫu."
      />

      {q.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {q.isError && (
        <ErrorState message="Không tải được số liệu tổng quan." onRetry={() => void q.refetch()} />
      )}

      {q.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Người dùng"
              value={q.data.users.toLocaleString("vi-VN")}
              hint="Hồ sơ đã tạo trong D1"
              hue={232}
              icon={<Users className="size-5" aria-hidden="true" />}
            />
            <StatTile
              label="Lớp học"
              value={q.data.grades.toLocaleString("vi-VN")}
              hint="Lớp 1–12 theo Chương trình GDPT 2018"
              hue={168}
              icon={<School className="size-5" aria-hidden="true" />}
            />
            <StatTile
              label="Môn học"
              value={q.data.subjects.toLocaleString("vi-VN")}
              hint="Gồm môn chuẩn và môn tùy chỉnh"
              hue={208}
              icon={<BookMarked className="size-5" aria-hidden="true" />}
            />
            <StatTile
              label="Khối trang chủ"
              value={q.data.homepageSections.toLocaleString("vi-VN")}
              hint="Khối CMS đang cấu hình"
              hue={26}
              icon={<LayoutTemplate className="size-5" aria-hidden="true" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-4">
              <h2 className="text-base font-bold">Lối tắt</h2>
              <ul className="space-y-2">
                {SHORTCUTS.filter((s) => can(s.permission)).map((s) => (
                  <li key={s.to}>
                    <Link
                      to={s.to}
                      className="group flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] px-4 py-3 text-sm font-semibold text-[var(--text-strong)] transition-colors hover:border-brand-300 hover:bg-[var(--surface-muted)]"
                    >
                      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
                        <s.icon className="size-4.5" aria-hidden="true" />
                      </span>
                      {s.label}
                      <ArrowRight
                        className="ml-auto size-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
                {SHORTCUTS.every((s) => !can(s.permission)) && (
                  <li className="text-sm text-[var(--text-muted)]">
                    Vai trò của bạn không có quyền chỉnh danh mục nội dung.
                  </li>
                )}
              </ul>
            </Card>

            <Card className="space-y-3">
              <h2 className="text-base font-bold">Quy trình vận hành</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-body)]">
                <li>Kiểm tra lớp học và môn học trước khi mở nội dung.</li>
                <li>Cấu hình trang chủ: bật/tắt khối, sắp xếp thứ tự và chỉnh thông báo.</li>
                <li>Quản lý khóa AI riêng cho từng môi trường, chỉ hiển thị dạng che.</li>
                <li>Mọi thay đổi đều được ghi vào nhật ký hệ thống.</li>
              </ol>
              <p className="rounded-2xl bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-muted)]">
                {q.data.note}
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
