import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui";
import { Pagination } from "../../components/admin/Pagination";
import { api, type Pagination as PaginationMeta } from "../../lib/api";
import { useAdminMeta, AdminCard } from "./AdminPageFrame";

interface AuditRow {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
}

export default function AuditPage() {
  useAdminMeta("Nhật ký");
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["admin", "audit", page],
    queryFn: async () => {
      const res = await api.get<AuditRow[]>(`/admin/audit-logs?page=${page}&pageSize=20`);
      return { rows: res.data, pagination: res.pagination as PaginationMeta };
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký hệ thống"
        description="Ghi lại các thay đổi quan trọng. Metadata đã được lọc, không chứa bí mật."
      />
      {list.isPending && <Skeleton className="h-64" />}
      {list.isError && (
        <ErrorState message="Không tải được nhật ký." onRetry={() => void list.refetch()} />
      )}
      {list.data && list.data.rows.length === 0 && <EmptyState title="Chưa có bản ghi nhật ký" />}
      {list.data && list.data.rows.length > 0 && (
        <AdminCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Nhật ký hệ thống</caption>
              <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Thời gian
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Hành động
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Đối tượng
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Người thực hiện
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {list.data.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.action}</td>
                    <td className="px-4 py-3">
                      {r.entityType}
                      {r.entityId ? (
                        <span className="text-[var(--text-muted)]">
                          {" "}
                          · {r.entityId.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.actorId ? r.actorId.slice(0, 8) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={list.data.pagination.page}
            pageSize={list.data.pagination.pageSize}
            total={list.data.pagination.total}
            onChange={setPage}
          />
        </AdminCard>
      )}
    </div>
  );
}
