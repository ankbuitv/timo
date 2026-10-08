import { useQuery } from "@tanstack/react-query";
import { BookMarked, LayoutTemplate, School, Users } from "lucide-react";
import { Card, ErrorState, PageHeader, Skeleton } from "../../components/ui";
import { api } from "../../lib/api";
import { useAdminMeta } from "./AdminPageFrame";

interface Overview {
  users: number;
  grades: number;
  subjects: number;
  homepageSections: number;
  note: string;
}

export default function OverviewPage() {
  useAdminMeta("Tổng quan");
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => (await api.get<Overview>("/admin/overview")).data,
  });
  const stats = q.data
    ? [
        {
          label: "Người dùng",
          value: q.data.users,
          icon: Users,
          tone: "text-brand-600 bg-brand-50 dark:bg-brand-900/40 dark:text-brand-200",
        },
        {
          label: "Lớp học",
          value: q.data.grades,
          icon: School,
          tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-200",
        },
        {
          label: "Môn học",
          value: q.data.subjects,
          icon: BookMarked,
          tone: "text-secondary-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-200",
        },
        {
          label: "Khối trang chủ",
          value: q.data.homepageSections,
          icon: LayoutTemplate,
          tone: "text-accent-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-200",
        },
      ]
    : [];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan"
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
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="flex items-center gap-4">
                  <span
                    className={`flex size-12 items-center justify-center rounded-2xl ${s.tone}`}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">{s.label}</p>
                    <p className="text-2xl font-bold text-[var(--text-strong)]">
                      {s.value.toLocaleString("vi-VN")}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card>
            <h2 className="text-base">Quy trình vận hành</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>Kiểm tra lớp học và môn học trước khi mở nội dung.</li>
              <li>Cấu hình trang chủ: bật/tắt khối, sắp xếp lại thứ tự và chỉnh thông báo.</li>
              <li>Mọi thay đổi đều được ghi vào nhật ký hệ thống.</li>
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
