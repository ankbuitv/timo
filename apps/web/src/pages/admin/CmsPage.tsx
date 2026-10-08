import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Skeleton,
  Textarea,
} from "../../components/ui";
import { api } from "../../lib/api";
import { describeError } from "../../lib/admin-api";
import { useAdminMeta, AdminCard } from "./AdminPageFrame";
import { useAuth } from "../../lib/auth";

interface AdminSection {
  id: string;
  key: string;
  type: string;
  titleVi: string;
  config: Record<string, unknown>;
  position: number;
  isEnabled: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  hero: "Băng chuyền nổi bật",
  announcement: "Thông báo",
  grades: "Chọn lớp học",
  featured_courses: "Khóa học nổi bật",
  subjects: "Môn học phổ biến",
  features: "Lợi ích",
  cta: "Kêu gọi hành động",
};

export default function CmsPage() {
  useAdminMeta("Trang chủ (CMS)");
  const qc = useQueryClient();
  const { can } = useAuth();
  const canManage = can("cms:manage");
  const [editing, setEditing] = useState<AdminSection | null>(null);

  const list = useQuery({
    queryKey: ["admin", "homepage-sections"],
    queryFn: async () => (await api.get<AdminSection[]>("/admin/homepage-sections")).data,
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "homepage-sections"] });
    await qc.invalidateQueries({ queryKey: ["public", "homepage"] });
  };

  const toggle = useMutation({
    mutationFn: (s: AdminSection) =>
      api.patch(`/admin/homepage-sections/${s.id}`, { isEnabled: !s.isEnabled }),
    onSuccess: async () => {
      toast.success("Đã cập nhật khối trang chủ");
      await invalidate();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const reorder = useMutation({
    mutationFn: (order: string[]) => api.put("/admin/homepage-sections/order", { order }),
    onSuccess: async () => {
      toast.success("Đã lưu thứ tự mới");
      await invalidate();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  function move(index: number, delta: -1 | 1) {
    if (!list.data) return;
    const target = index + delta;
    if (target < 0 || target >= list.data.length) return;
    const ids = list.data.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    reorder.mutate(ids);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trang chủ (CMS)"
        description="Sắp xếp, bật/tắt và chỉnh nội dung các khối trang chủ. Cấu hình được kiểm tra nghiêm ngặt trước khi lưu."
      />
      {list.isPending && <Skeleton className="h-72" />}
      {list.isError && (
        <ErrorState
          message="Không tải được cấu trúc trang chủ."
          onRetry={() => void list.refetch()}
        />
      )}
      {list.data && (
        <AdminCard>
          <ol className="divide-y divide-[var(--border-subtle)]">
            {list.data.map((s, index) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-sm font-bold text-[var(--text-muted)]"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-strong)]">{s.titleVi}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {TYPE_LABEL[s.type] ?? s.type} · <span className="font-mono">{s.key}</span>
                  </p>
                </div>
                <Badge tone={s.isEnabled ? "success" : "neutral"}>
                  {s.isEnabled ? "Hiển thị" : "Đang ẩn"}
                </Badge>
                {canManage && (
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Lên: ${s.titleVi}`}
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => move(index, -1)}
                      icon={<ArrowUp className="size-4" />}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Xuống: ${s.titleVi}`}
                      disabled={index === list.data!.length - 1 || reorder.isPending}
                      onClick={() => move(index, 1)}
                      icon={<ArrowDown className="size-4" />}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggle.mutate(s)}
                      loading={toggle.isPending && toggle.variables?.id === s.id}
                      icon={
                        s.isEnabled ? <EyeOff className="size-4" /> : <Eye className="size-4" />
                      }
                    >
                      {s.isEnabled ? "Ẩn" : "Hiện"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(s)}
                      icon={<Pencil className="size-4" />}
                    >
                      Sửa
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </AdminCard>
      )}
      {editing && (
        <SectionEditDialog
          section={editing}
          onClose={() => setEditing(null)}
          onSaved={invalidate}
        />
      )}
    </div>
  );
}

function SectionEditDialog({
  section,
  onClose,
  onSaved,
}: {
  section: AdminSection;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(section.titleVi);
  const [configText, setConfigText] = useState(() => JSON.stringify(section.config, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      let config: unknown;
      try {
        config = JSON.parse(configText);
      } catch {
        throw new Error("Cấu hình JSON không hợp lệ (kiểm tra dấu ngoặc và dấu phẩy).");
      }
      return api.patch(`/admin/homepage-sections/${section.id}`, { titleVi: title, config });
    },
    onSuccess: async () => {
      toast.success("Đã lưu khối trang chủ");
      await onSaved();
      onClose();
    },
    onError: (e) => {
      const msg = describeError(e);
      setJsonError(msg);
      toast.error(msg);
    },
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Sửa: ${section.titleVi}`}
      description="Nội dung được kiểm tra bằng schema trước khi lưu. Liên kết chỉ được là đường dẫn nội bộ hoặc https."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setJsonError(null);
          save.mutate();
        }}
      >
        <Field label="Tiêu đề khối">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          )}
        </Field>
        <Field label="Cấu hình (JSON)" error={jsonError ?? undefined}>
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              spellCheck={false}
              className="min-h-64 font-mono text-xs"
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={save.isPending}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
