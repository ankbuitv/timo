import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Skeleton,
  ErrorState,
  Badge,
} from "../components/ui";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { usePageMeta } from "../lib/seo";

interface SetupStatus {
  initialized: boolean;
}

/**
 * Khởi tạo quản trị viên đầu tiên (một lần). Cần:
 * tài khoản đã đăng nhập đúng INITIAL_ADMIN_EMAIL + SETUP_SECRET (Cloudflare Secret).
 * Sau khi thành công, route này không còn tác dụng.
 */
export default function BootstrapPage() {
  usePageMeta({ title: "Khởi tạo quản trị – TIMO", noindex: true });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = useQuery({
    queryKey: ["setup", "status"],
    queryFn: async () => (await api.get<SetupStatus>("/setup/status", { auth: false })).data,
  });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/setup/bootstrap", { setupSecret: secret });
      setSecret("");
      toast.success("Đã khởi tạo quản trị viên. Tải lại để áp dụng quyền mới.");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["setup"] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Không thể thực hiện khởi tạo.");
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    {
      title: "Tài khoản đã xác nhận email",
      description: "Supabase phải xác nhận email của bạn trước khi cấp quyền quản trị.",
    },
    {
      title: "Đúng email quản trị ban đầu",
      description: "Email của bạn phải trùng INITIAL_ADMIN_EMAIL đã cấu hình cho môi trường.",
    },
    {
      title: "Bí mật cài đặt từ người vận hành",
      description: "SETUP_SECRET là Worker secret, tối thiểu 32 ký tự ngẫu nhiên.",
    },
  ];
  return (
    <div className="section-shell section-stack">
      <PageHeader
        eyebrow="Thiết lập một lần"
        title="Khởi tạo quản trị viên"
        description="Thao tác một lần để cấp quyền Super Admin cho tài khoản được chỉ định."
      />
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="surface-card flex flex-col gap-2 p-5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-sm font-extrabold text-brand-700 dark:bg-brand-900/60 dark:text-brand-100">
              {i + 1}
            </span>
            <p className="font-bold text-[var(--text-strong)]">{step.title}</p>
            <p className="text-sm text-[var(--text-muted)]">{step.description}</p>
          </li>
        ))}
      </ol>
      {status.isPending && <Skeleton className="h-40" />}
      {status.isError && (
        <ErrorState
          message="Không kiểm tra được trạng thái hệ thống."
          onRetry={() => void status.refetch()}
        />
      )}
      {status.data?.initialized ? (
        <Card className="space-y-2">
          <Badge tone="success">Đã khởi tạo</Badge>
          <p className="text-sm">
            Hệ thống đã có quản trị viên. Chức năng khởi tạo đã bị vô hiệu hóa vĩnh viễn.
          </p>
        </Card>
      ) : status.data ? (
        <Card>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            Tài khoản hiện tại: <strong>{user?.email}</strong>. Chỉ tài khoản có email được cấu hình
            làm quản trị ban đầu mới có thể thực hiện bước này. Nhập bí mật cài đặt do người vận
            hành cung cấp.
          </p>
          <form className="space-y-4" onSubmit={submit}>
            <Field
              label="Bí mật cài đặt (SETUP_SECRET)"
              hint="Tối thiểu 32 ký tự. Mọi lần thử đều được ghi vào nhật ký."
            >
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="off"
                  required
                  minLength={32}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" loading={busy}>
              Khởi tạo quản trị viên
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
