import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Skeleton,
} from "../../components/ui";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { describeError } from "../../lib/admin-api";
import { useAdminMeta, AdminCard } from "./AdminPageFrame";

interface AdminSubject {
  id: string;
  slug: string;
  nameVi: string;
  description: string | null;
  isActive: boolean;
  isCustom: boolean;
}

export default function SubjectsAdminPage() {
  useAdminMeta("Môn học");
  const qc = useQueryClient();
  const { can } = useAuth();
  const canManage = can("subjects:manage");
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminSubject | null>(null);

  const list = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: async () => (await api.get<AdminSubject[]>("/admin/subjects")).data,
  });

  const toggle = useMutation({
    mutationFn: (s: AdminSubject) =>
      api.patch(`/admin/subjects/${s.id}`, { isActive: !s.isActive }),
    onSuccess: async () => {
      toast.success("Đã cập nhật môn học");
      await qc.invalidateQueries({ queryKey: ["admin", "subjects"] });
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const remove = useMutation({
    mutationFn: (s: AdminSubject) => api.delete(`/admin/subjects/${s.id}`),
    onSuccess: async () => {
      toast.success("Đã xóa môn học");
      setToDelete(null);
      await qc.invalidateQueries({ queryKey: ["admin", "subjects"] });
    },
    onError: (e) => toast.error(describeError(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị"
        title="Môn học"
        description="Môn học chuẩn và môn tùy chỉnh do quản trị viên thêm."
        actions={
          canManage ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              Thêm môn
            </Button>
          ) : null
        }
      />
      {list.isPending && <Skeleton className="h-64" />}
      {list.isError && (
        <ErrorState
          message="Không tải được danh sách môn học."
          onRetry={() => void list.refetch()}
        />
      )}
      {list.data && list.data.length === 0 && <EmptyState title="Chưa có môn học" />}
      {list.data && list.data.length > 0 && (
        <AdminCard>
          <ul className="divide-y divide-[var(--border-subtle)]">
            {list.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-strong)]">{s.nameVi}</p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">{s.slug}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {s.isCustom && <Badge tone="accent">Tùy chỉnh</Badge>}
                  <Badge tone={s.isActive ? "success" : "neutral"}>
                    {s.isActive ? "Đang mở" : "Đã ẩn"}
                  </Badge>
                  {canManage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggle.mutate(s)}
                        loading={toggle.isPending && toggle.variables?.id === s.id}
                        icon={
                          s.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />
                        }
                      >
                        {s.isActive ? "Ẩn" : "Hiện"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDelete(s)}
                        aria-label={`Xóa ${s.nameVi}`}
                        icon={<Trash2 className="size-4 text-red-600" />}
                      />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {creating && <SubjectCreateDialog onClose={() => setCreating(false)} />}
      <ConfirmDialog
        open={!!toDelete}
        title="Xóa môn học?"
        message={`Môn "${toDelete?.nameVi ?? ""}" sẽ bị xóa khỏi hệ thống.`}
        busy={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}

function SubjectCreateDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [nameVi, setNameVi] = useState("");
  const [slug, setSlug] = useState("");
  const create = useMutation({
    mutationFn: () => api.post("/admin/subjects", { nameVi, slug }),
    onSuccess: async () => {
      toast.success("Đã thêm môn học");
      await qc.invalidateQueries({ queryKey: ["admin", "subjects"] });
      await qc.invalidateQueries({ queryKey: ["public", "subjects"] });
      onClose();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title="Thêm môn học"
      description="Môn học tùy chỉnh sẽ hiển thị trong danh mục công khai."
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Tên môn học">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={nameVi}
              maxLength={120}
              required
              onChange={(e) => setNameVi(e.target.value)}
            />
          )}
        </Field>
        <Field label="Slug" hint="Ví dụ: robot-lap-trinh">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={slug}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              onChange={(e) => setSlug(e.target.value)}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={create.isPending}>
            Lưu
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
