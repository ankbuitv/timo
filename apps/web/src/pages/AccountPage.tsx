import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "../components/ui";
import { api } from "../lib/api";
import { useAuth, type CurrentUser } from "../lib/auth";
import { usePageMeta } from "../lib/seo";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Quản trị viên cấp cao",
  admin: "Quản trị viên",
  moderator: "Kiểm duyệt viên",
  teacher: "Giáo viên",
  student: "Học sinh",
  parent: "Phụ huynh",
  support_agent: "Nhân viên hỗ trợ",
};

export default function AccountPage() {
  usePageMeta({ title: "Tài khoản – TIMO", noindex: true });
  const { session, can } = useAuth();
  const me = useQuery({
    queryKey: ["me", session?.user.id ?? null, "account"],
    queryFn: async () => (await api.get<CurrentUser>("/me")).data,
    enabled: !!session,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Hồ sơ"
        title="Tài khoản của tôi"
        description="Thông tin hồ sơ và quyền truy cập hiện tại."
      />
      {me.isPending && <Skeleton className="h-48" />}
      {me.isError && (
        <ErrorState
          message="Không tải được hồ sơ. Vui lòng đăng nhập lại."
          onRetry={() => void me.refetch()}
        />
      )}
      {me.data && (
        <>
          <Card className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-secondary-500 text-xl font-extrabold text-white shadow-soft">
                {(me.data.displayName || me.data.email || "T").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold text-[var(--text-strong)]">
                  {me.data.displayName}
                </p>
                <p className="truncate text-sm text-[var(--text-muted)]">
                  {me.data.email ?? "Chưa có email"}
                </p>
              </div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Tên hiển thị
                </dt>
                <dd className="mt-1 font-semibold text-[var(--text-strong)]">
                  {me.data.displayName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Email
                </dt>
                <dd className="mt-1 break-all font-semibold text-[var(--text-strong)]">
                  {me.data.email}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Vai trò
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {me.data.roles.map((r) => (
                    <Badge key={r} tone="brand">
                      {ROLE_LABELS[r] ?? r}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </Card>

          {me.data.roles.includes("super_admin") || can("users:view") ? (
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 font-semibold text-[var(--text-strong)]">
                  <ShieldCheck className="size-5 text-brand-500" aria-hidden="true" /> Khu vực quản
                  trị
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  Quản lý người dùng, lớp học, môn học và trang chủ.
                </p>
              </div>
              <Link
                to="/admin"
                className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Mở quản trị →
              </Link>
            </Card>
          ) : null}

          {me.data.roles.length === 1 && me.data.roles[0] === "student" && (
            <Card>
              <p className="text-sm text-[var(--text-muted)]">
                Thông tin tiến độ học tập, lịch sử và cài đặt quyền riêng tư sẽ có ở các giai đoạn
                tiếp theo.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
