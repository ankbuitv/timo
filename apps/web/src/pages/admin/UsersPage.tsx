import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Badge, EmptyState, ErrorState, Input, PageHeader, Skeleton } from "../../components/ui";
import { Pagination } from "../../components/admin/Pagination";
import { api, type Pagination as PaginationMeta } from "../../lib/api";
import { useAdminMeta, AdminCard } from "./AdminPageFrame";

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  status: "active" | "suspended" | "deleted";
  createdAt: number;
}

const STATUS_LABEL = { active: "Hoạt động", suspended: "Tạm khóa", deleted: "Đã xóa" } as const;

export default function UsersPage() {
  useAdminMeta("Người dùng");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  const list = useQuery({
    queryKey: ["admin", "users", page, q],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (q) params.set("q", q);
      const res = await api.get<AdminUser[]>(`/admin/users?${params.toString()}`);
      return { rows: res.data, pagination: res.pagination as PaginationMeta };
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng"
        description="Danh sách hồ sơ được tạo khi người dùng đăng nhập lần đầu."
      />
      <form
        role="search"
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(search.trim());
        }}
      >
        <Input
          aria-label="Tìm theo email"
          placeholder="Tìm theo email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <button
          type="submit"
          className="h-11 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Tìm kiếm
        </button>
      </form>
      {list.isPending && <Skeleton className="h-64" />}
      {list.isError && (
        <ErrorState
          message="Không tải được danh sách người dùng."
          onRetry={() => void list.refetch()}
        />
      )}
      {list.data && list.data.rows.length === 0 && (
        <EmptyState title="Không có người dùng phù hợp" />
      )}
      {list.data && list.data.rows.length > 0 && (
        <AdminCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh sách người dùng</caption>
              <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Tên
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tham gia
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {list.data.rows.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-semibold text-[var(--text-strong)]">
                      {u.displayName}
                    </td>
                    <td className="px-4 py-3 break-all">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status === "active" ? "success" : "danger"}>
                        {STATUS_LABEL[u.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
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
