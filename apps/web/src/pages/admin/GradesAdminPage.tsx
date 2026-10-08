import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  Field,
  Input,
  PageHeader,
  Select,
  ErrorState,
  Skeleton,
  EmptyState,
} from "../../components/ui";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { describeError } from "../../lib/admin-api";
import { useAdminMeta, AdminCard } from "./AdminPageFrame";
import { stageForGrade, EDUCATION_STAGES } from "@timo/shared";

interface AdminGrade {
  id: string;
  level: number;
  slug: string;
  nameVi: string;
  stage: "primary" | "lower_secondary" | "upper_secondary";
  isActive: boolean;
  sortOrder: number;
}

const STAGE_LABEL = Object.fromEntries(EDUCATION_STAGES.map((s) => [s.key, s.nameVi]));

export default function GradesAdminPage() {
  useAdminMeta("Lớp học");
  const qc = useQueryClient();
  const { can } = useAuth();
  const canManage = can("grades:manage");
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminGrade | null>(null);

  const list = useQuery({
    queryKey: ["admin", "grades"],
    queryFn: async () => (await api.get<AdminGrade[]>("/admin/grades")).data,
  });

  const toggle = useMutation({
    mutationFn: (g: AdminGrade) => api.patch(`/admin/grades/${g.id}`, { isActive: !g.isActive }),
    onSuccess: async () => {
      toast.success("Đã cập nhật lớp học");
      await qc.invalidateQueries({ queryKey: ["admin", "grades"] });
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const remove = useMutation({
    mutationFn: (g: AdminGrade) => api.delete(`/admin/grades/${g.id}`),
    onSuccess: async () => {
      toast.success("Đã xóa lớp học");
      setToDelete(null);
      await qc.invalidateQueries({ queryKey: ["admin", "grades"] });
    },
    onError: (e) => toast.error(describeError(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị"
        title="Lớp học"
        description="Chương trình GDPT 2018: lớp 1–12 theo ba cấp Tiểu học, THCS và THPT."
        actions={
          canManage ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              Thêm lớp
            </Button>
          ) : null
        }
      />
      {list.isPending && <Skeleton className="h-64" />}
      {list.isError && (
        <ErrorState message="Không tải được danh sách lớp." onRetry={() => void list.refetch()} />
      )}
      {list.data && list.data.length === 0 && <EmptyState title="Chưa có lớp học" />}
      {list.data && list.data.length > 0 && (
        <AdminCard>
          <div className="overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">Danh sách lớp học</caption>
              <thead>
                <tr>
                  <th scope="col">Lớp</th>
                  <th scope="col">Slug</th>
                  <th scope="col">Cấp học</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((g) => (
                  <tr key={g.id}>
                    <td className="font-semibold text-[var(--text-strong)]">{g.nameVi}</td>
                    <td className="font-mono text-xs">{g.slug}</td>
                    <td>{STAGE_LABEL[g.stage]}</td>
                    <td>
                      <Badge tone={g.isActive ? "success" : "neutral"}>
                        {g.isActive ? "Đang mở" : "Đã ẩn"}
                      </Badge>
                    </td>
                    <td>
                      {canManage && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            loading={toggle.isPending && toggle.variables?.id === g.id}
                            onClick={() => toggle.mutate(g)}
                            icon={
                              g.isActive ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )
                            }
                          >
                            {g.isActive ? "Ẩn" : "Hiện"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToDelete(g)}
                            aria-label={`Xóa ${g.nameVi}`}
                            icon={<Trash2 className="size-4 text-red-600" />}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {creating && <GradeCreateDialog onClose={() => setCreating(false)} />}
      <ConfirmDialog
        open={!!toDelete}
        title="Xóa lớp học?"
        message={`Lớp "${toDelete?.nameVi ?? ""}" sẽ bị xóa khỏi hệ thống.`}
        busy={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}

function GradeCreateDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [level, setLevel] = useState(1);
  const [slug, setSlug] = useState("lop-1");
  const [nameVi, setNameVi] = useState("Lớp 1");
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const stage = stageForGrade(level) ?? "primary";

  const create = useMutation({
    mutationFn: () =>
      api.post("/admin/grades", { level, slug, nameVi, stage, sortOrder, isActive }),
    onSuccess: async () => {
      toast.success("Đã thêm lớp học");
      await qc.invalidateQueries({ queryKey: ["admin", "grades"] });
      await qc.invalidateQueries({ queryKey: ["public", "grades"] });
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
      title="Thêm lớp học"
      description="Cấp học được xác định tự động theo số lớp."
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Số lớp" hint={`Thuộc: ${STAGE_LABEL[stage]}`}>
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={level}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLevel(v);
                setSlug(`lop-${v}`);
                setNameVi(`Lớp ${v}`);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Lớp {n}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Tên hiển thị">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={nameVi}
              onChange={(e) => setNameVi(e.target.value)}
              maxLength={100}
              required
            />
          )}
        </Field>
        <Field label="Slug (đường dẫn)" hint="Chữ thường không dấu, số và dấu gạch ngang.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          )}
        </Field>
        <Field label="Thứ tự hiển thị">
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="number"
              min={0}
              max={1000}
              aria-describedby={describedBy}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          )}
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-brand-500"
          />
          Hiển thị công khai
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} type="button">
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
