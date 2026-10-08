import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatTile,
  Textarea,
} from "../../components/ui";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { api } from "../../lib/api";
import { describeError } from "../../lib/admin-api";
import { useAdminMeta, AdminCard } from "./AdminPageFrame";

interface AiKey {
  id: string;
  name: string;
  provider: string;
  maskedKey: string;
  fingerprint: string;
  baseUrl: string;
  model: string | null;
  priority: number;
  isEnabled: boolean;
  dailyRequestLimit: number;
  availability: "ok" | "error" | "unknown" | "disabled";
  lastSuccessAt: number | null;
  lastErrorAt: number | null;
  lastErrorMessage: string | null;
  lastCheckedAt: number | null;
  availableModels: string[] | null;
  createdAt: number;
  updatedAt: number;
  usageToday: {
    requests: number;
    failures: number;
    promptTokens: number;
    completionTokens: number;
  };
}

interface AiSettings {
  failoverEnabled: boolean;
  maxAttempts: number;
  backoffBaseMs: number;
  timeoutMs: number;
  defaultModel: string | null;
  allowedHosts: string[];
  defaultBaseUrl: string;
  encryptionKeyConfigured: boolean;
}

interface Availability {
  counts: { ok: number; error: number; unknown: number; disabled: number };
  enabled: number;
  total: number;
  lastSuccessAt: number | null;
  requestsToday: number;
  hasDisabled: boolean;
}

interface UsageResponse {
  days: number;
  rows: {
    keyId: string;
    day: string;
    requests: number;
    failures: number;
    promptTokens: number;
    completionTokens: number;
  }[];
  totals: { requests: number; failures: number; promptTokens: number; completionTokens: number };
}

const TIME_FMT = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatTime(value: number | null): string {
  return value ? TIME_FMT.format(new Date(value)) : "—";
}

function availabilityBadge(key: AiKey) {
  switch (key.availability) {
    case "ok":
      return (
        <Badge tone="success">
          <CheckCircle2 className="size-3.5" aria-hidden="true" /> Hoạt động
        </Badge>
      );
    case "error":
      return (
        <Badge tone="danger">
          <XCircle className="size-3.5" aria-hidden="true" /> Lỗi gần nhất
        </Badge>
      );
    case "disabled":
      return <Badge tone="neutral">Đang tắt</Badge>;
    default:
      return (
        <Badge tone="accent">
          <AlertTriangle className="size-3.5" aria-hidden="true" /> Chưa kiểm tra
        </Badge>
      );
  }
}

export default function AiKeysAdminPage() {
  useAdminMeta("Khóa AI");
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [rotating, setRotating] = useState<AiKey | null>(null);
  const [toDelete, setToDelete] = useState<AiKey | null>(null);
  const [previewing, setPreviewing] = useState<AiKey | null>(null);

  const keys = useQuery({
    queryKey: ["admin", "ai", "keys"],
    queryFn: async () => (await api.get<AiKey[]>("/admin/ai/keys")).data,
  });
  const availability = useQuery({
    queryKey: ["admin", "ai", "availability"],
    queryFn: async () => (await api.get<Availability>("/admin/ai/availability")).data,
  });
  const settings = useQuery({
    queryKey: ["admin", "ai", "settings"],
    queryFn: async () => (await api.get<AiSettings>("/admin/ai/settings")).data,
  });
  const usage = useQuery({
    queryKey: ["admin", "ai", "usage"],
    queryFn: async () => (await api.get<UsageResponse>("/admin/ai/usage?days=14")).data,
  });

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "ai", "keys"] }),
      qc.invalidateQueries({ queryKey: ["admin", "ai", "availability"] }),
      qc.invalidateQueries({ queryKey: ["admin", "ai", "usage"] }),
    ]);
  };

  const toggle = useMutation({
    mutationFn: (k: AiKey) => api.patch(`/admin/ai/keys/${k.id}`, { isEnabled: !k.isEnabled }),
    onSuccess: async () => {
      toast.success("Đã cập nhật trạng thái khóa");
      await invalidateAll();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const testKey = useMutation({
    mutationFn: (k: AiKey) =>
      api.post<{ ok: boolean; message: string; models: string[]; latencyMs: number }>(
        `/admin/ai/keys/${k.id}/test`,
        {},
      ),
    onSuccess: async (res) => {
      if (res.data.ok) toast.success(`${res.data.message} (${res.data.latencyMs}ms)`);
      else toast.error(res.data.message);
      await invalidateAll();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const remove = useMutation({
    mutationFn: (k: AiKey) => api.delete(`/admin/ai/keys/${k.id}`),
    onSuccess: async () => {
      toast.success("Đã xóa khóa");
      setToDelete(null);
      await invalidateAll();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const keyName = (id: string) => keys.data?.find((k) => k.id === id)?.name ?? id.slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị"
        title="Khóa AI (Ollama Cloud)"
        description="Nhiều khóa dự phòng theo thứ tự ưu tiên. Khóa được mã hóa AES-256-GCM trong D1 và chỉ hiển thị dạng che."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Thêm khóa
          </Button>
        }
      />

      {settings.data && !settings.data.encryptionKeyConfigured && (
        <Card className="border-l-4 border-l-amber-500 p-4 text-sm">
          <p className="font-semibold text-[var(--text-strong)]">
            Chưa đặt <code>TIMO_AI_ENCRYPTION_KEY</code>
          </p>
          <p className="mt-1 text-[var(--text-muted)]">
            Đây là Worker secret dùng để mã hóa/giải mã khóa API. Chưa đặt thì không thể thêm, xoay
            hoặc kiểm tra khóa. Xem <code>docs/AI_KEYS.md</code> để tạo khóa 32 byte.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(keys.isPending || availability.isPending) && (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        )}
        {availability.data && (
          <>
            <StatTile
              label="Khóa đang bật"
              value={`${availability.data.enabled}/${availability.data.total}`}
              hint="Bật/tắt từng khóa để kiểm soát chi phí"
              hue={232}
            />
            <StatTile
              label="Sẵn sàng"
              value={String(availability.data.counts.ok)}
              hint="Có lần thành công gần hơn lỗi gần nhất"
              hue={168}
              tone="success"
            />
            <StatTile
              label="Đang lỗi"
              value={String(availability.data.counts.error)}
              hint="Lần gọi gần nhất thất bại"
              hue={26}
              tone="danger"
            />
            <StatTile
              label="Yêu cầu hôm nay"
              value={String(availability.data.requestsToday)}
              hint="Tổng theo tất cả khóa (UTC)"
              hue={208}
            />
          </>
        )}
      </div>

      {keys.isError && (
        <ErrorState
          message="Không tải được danh sách khóa AI."
          onRetry={() => void keys.refetch()}
        />
      )}

      {keys.data && keys.data.length === 0 && (
        <EmptyState
          title="Chưa có khóa AI nào"
          description="Thêm khóa Ollama Cloud đầu tiên để bật các tính năng trợ lý học tập. Khóa chỉ được nhập một lần và lưu ở dạng mã hóa."
          action={
            <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              Thêm khóa
            </Button>
          }
        />
      )}

      {keys.data && keys.data.length > 0 && (
        <DataTable>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[960px]">
              <caption className="sr-only">Danh sách khóa API Ollama Cloud</caption>
              <thead>
                <tr>
                  <th scope="col">Tên / khóa</th>
                  <th scope="col">Model</th>
                  <th scope="col">Ưu tiên</th>
                  <th scope="col">Giới hạn/ngày</th>
                  <th scope="col">Hôm nay</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Lần cuối</th>
                  <th scope="col" className="text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.data.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <div className="font-semibold text-[var(--text-strong)]">{k.name}</div>
                      <div className="font-mono text-xs text-[var(--text-muted)]">
                        {k.maskedKey}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">{k.baseUrl}</div>
                    </td>
                    <td>
                      {k.model ?? <span className="text-[var(--text-muted)]">Theo mặc định</span>}
                    </td>
                    <td>{k.priority}</td>
                    <td>{k.dailyRequestLimit === 0 ? "Không giới hạn" : k.dailyRequestLimit}</td>
                    <td>
                      {k.usageToday.requests} yêu cầu
                      {k.usageToday.failures > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          {" "}
                          · {k.usageToday.failures} lỗi
                        </span>
                      )}
                    </td>
                    <td>
                      {availabilityBadge(k)}
                      {k.lastErrorMessage && (
                        <div
                          className="mt-1 max-w-[220px] truncate text-xs text-[var(--text-muted)]"
                          title={k.lastErrorMessage}
                        >
                          {k.lastErrorMessage}
                        </div>
                      )}
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">
                      <div>Thành công: {formatTime(k.lastSuccessAt)}</div>
                      <div>Lỗi: {formatTime(k.lastErrorAt)}</div>
                      <div>Kiểm tra: {formatTime(k.lastCheckedAt)}</div>
                    </td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          loading={testKey.isPending && testKey.variables?.id === k.id}
                          onClick={() => testKey.mutate(k)}
                        >
                          <RefreshCw className="size-3.5" aria-hidden="true" /> Kiểm tra
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewing(k)}
                          disabled={!k.isEnabled}
                        >
                          <Send className="size-3.5" aria-hidden="true" /> Gửi thử
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRotating(k)}>
                          Xoay khóa
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggle.mutate(k)}>
                          {k.isEnabled ? "Tắt" : "Bật"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => setToDelete(k)}
                          aria-label={`Xóa khóa ${k.name}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      )}

      {keys.data?.some((k) => k.availableModels && k.availableModels.length > 0) && (
        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-strong)]">
            <Activity className="size-4" aria-hidden="true" /> Model khả dụng (lấy từ lần kiểm tra
            kết nối gần nhất)
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {keys.data
              .filter((k) => k.availableModels && k.availableModels.length > 0)
              .map((k) => (
                <li key={k.id}>
                  <span className="font-medium text-[var(--text-strong)]">{k.name}:</span>{" "}
                  <span className="text-[var(--text-muted)]">
                    {k.availableModels?.slice(0, 12).join(", ")}
                    {(k.availableModels?.length ?? 0) > 12
                      ? ` … (+${(k.availableModels?.length ?? 0) - 12})`
                      : ""}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}

      {usage.data && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-[var(--text-strong)]">
            Sử dụng 14 ngày gần nhất
          </h2>
          {usage.data.rows.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Chưa có lượt gọi nào được ghi nhận. Số liệu chỉ xuất hiện sau khi hệ thống thực sự gọi
              nhà cung cấp.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {usage.data.totals.requests} yêu cầu · {usage.data.totals.failures} lỗi ·{" "}
                {usage.data.totals.promptTokens + usage.data.totals.completionTokens} token
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {usage.data.rows.slice(0, 10).map((r) => (
                  <li key={`${r.keyId}-${r.day}`} className="flex justify-between gap-3">
                    <span className="text-[var(--text-muted)]">
                      {r.day} · {keyName(r.keyId)}
                    </span>
                    <span>
                      {r.requests} yêu cầu{r.failures > 0 ? ` (${r.failures} lỗi)` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      {settings.data && <RouterSettingsCard settings={settings.data} onSaved={invalidateAll} />}

      {creating && (
        <CreateKeyDialog
          settings={settings.data}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await invalidateAll();
          }}
        />
      )}
      {rotating && (
        <RotateKeyDialog
          item={rotating}
          onClose={() => setRotating(null)}
          onDone={async () => {
            setRotating(null);
            await invalidateAll();
          }}
        />
      )}
      {previewing && (
        <PreviewDialog
          item={previewing}
          onClose={() => setPreviewing(null)}
          onDone={invalidateAll}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title="Xóa khóa AI?"
        message={`Khóa "${toDelete?.name ?? ""}" và toàn bộ số liệu sử dụng của nó sẽ bị xóa khỏi hệ thống.`}
        confirmLabel="Xóa khóa"
        busy={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}

/** Nhập khóa mới. Server trả về bản che; khóa gốc không bao giờ được đọc lại. */
function CreateKeyDialog({
  settings,
  onClose,
  onCreated,
}: {
  settings?: AiSettings;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [priority, setPriority] = useState("100");
  const [dailyRequestLimit, setDailyRequestLimit] = useState("0");

  const create = useMutation({
    mutationFn: () =>
      api.post("/admin/ai/keys", {
        name,
        key,
        ...(model ? { model } : {}),
        ...(baseUrl ? { baseUrl } : {}),
        priority: Number(priority),
        dailyRequestLimit: Number(dailyRequestLimit),
      }),
    onSuccess: async () => {
      toast.success("Đã thêm khóa AI (khóa gốc không được lưu dạng đọc được)");
      await onCreated();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Thêm khóa AI"
      description="Khóa được mã hóa trước khi lưu."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Tên hiển thị" hint="Ví dụ: Ollama Cloud – khóa chính">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={60}
            />
          )}
        </Field>
        <Field
          label="Khóa API"
          hint="Dán khóa từ Ollama. Hệ thống chỉ lưu bản mã và 4 ký tự cuối để hiển thị."
        >
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Model" hint="Để trống sẽ dùng model mặc định của hệ thống">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gemma4:31b"
              />
            )}
          </Field>
          <Field label="Thứ tự ưu tiên" hint="Số nhỏ hơn được gọi trước">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="number"
                min={0}
                max={1000}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field
          label="Endpoint"
          hint={`Mặc định ${settings?.defaultBaseUrl ?? "https://ollama.com/api"}. Chỉ host trong danh sách cho phép.`}
        >
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={settings?.defaultBaseUrl ?? "https://ollama.com/api"}
            />
          )}
        </Field>
        <Field label="Giới hạn yêu cầu mỗi ngày" hint="0 = không giới hạn. Đếm theo ngày UTC.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="number"
              min={0}
              max={1000000}
              value={dailyRequestLimit}
              onChange={(e) => setDailyRequestLimit(e.target.value)}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={create.isPending}>
            Lưu khóa
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function RotateKeyDialog({
  item,
  onClose,
  onDone,
}: {
  item: AiKey;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const rotate = useMutation({
    mutationFn: () => api.post(`/admin/ai/keys/${item.id}/rotate`, { key }),
    onSuccess: async () => {
      toast.success("Đã xoay khóa. Trạng thái cũ của khóa đã được đặt lại.");
      await onDone();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Xoay khóa: ${item.name}`}
      description="Khóa cũ bị ghi đè hoàn toàn; không thể khôi phục."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          rotate.mutate();
        }}
      >
        <Field label="Khóa API mới">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={rotate.isPending}>
            Xoay khóa
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function PreviewDialog({
  item,
  onClose,
  onDone,
}: {
  item: AiKey;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [prompt, setPrompt] = useState(
    "Xin chào, bạn là trợ lý học tập TIMO. Hãy giới thiệu ngắn gọn.",
  );
  const [result, setResult] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: () =>
      api.post<{
        ok: boolean;
        content?: string;
        message?: string;
        model?: string;
        latencyMs?: number;
      }>(`/admin/ai/keys/${item.id}/preview`, { prompt }),
    onSuccess: async (res) => {
      if (res.data.ok) {
        setResult(res.data.content ?? "");
        toast.success(
          `Phản hồi trong ${res.data.latencyMs ?? 0}ms qua model ${res.data.model ?? "?"}`,
        );
      } else {
        toast.error(res.data.message ?? "Không gọi được nhà cung cấp");
      }
      await onDone();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Gửi thử qua ${item.name}`}
      description="Có tiêu tốn hạn mức của nhà cung cấp. Hệ thống không chuyển sang khóa khác khi gặp 429."
    >
      <div className="space-y-4">
        <Field label="Nội dung gửi thử">
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
            />
          )}
        </Field>
        {result !== null && (
          <div className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm whitespace-pre-wrap">
            {result}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button loading={send.isPending} onClick={() => send.mutate()}>
            Gửi thử
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function RouterSettingsCard({
  settings,
  onSaved,
}: {
  settings: AiSettings;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(settings);
  const save = useMutation({
    mutationFn: () =>
      api.put("/admin/ai/settings", {
        failoverEnabled: draft.failoverEnabled,
        maxAttempts: draft.maxAttempts,
        backoffBaseMs: draft.backoffBaseMs,
        timeoutMs: draft.timeoutMs,
        defaultModel: draft.defaultModel || null,
      }),
    onSuccess: async () => {
      toast.success("Đã lưu cấu hình router");
      await onSaved();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <AdminCard>
      <div className="border-b border-[var(--border-subtle)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--text-strong)]">Cấu hình router</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Failover có giới hạn, có backoff. Lỗi 429 luôn dừng lại thay vì đổi khóa để tránh vượt hạn
          mức nhà cung cấp.
        </p>
      </div>
      <form
        className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Bật failover">
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={draft.failoverEnabled ? "on" : "off"}
              onChange={(e) => setDraft({ ...draft, failoverEnabled: e.target.value === "on" })}
            >
              <option value="on">Bật (chuyển khóa khi lỗi mạng/5xx/401)</option>
              <option value="off">Tắt (chỉ dùng khóa ưu tiên cao nhất)</option>
            </Select>
          )}
        </Field>
        <Field label="Số lần thử tối đa" hint="1–5, không retry vô hạn">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="number"
              min={1}
              max={5}
              value={draft.maxAttempts}
              onChange={(e) => setDraft({ ...draft, maxAttempts: Number(e.target.value) })}
            />
          )}
        </Field>
        <Field label="Model mặc định" hint="Dùng khi khóa không khai báo model riêng">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={draft.defaultModel ?? ""}
              onChange={(e) => setDraft({ ...draft, defaultModel: e.target.value })}
              placeholder="gemma4:31b"
            />
          )}
        </Field>
        <Field label="Backoff cơ sở (ms)" hint="Nhân đôi sau mỗi lần thử, tối đa 5 giây">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="number"
              min={0}
              max={5000}
              value={draft.backoffBaseMs}
              onChange={(e) => setDraft({ ...draft, backoffBaseMs: Number(e.target.value) })}
            />
          )}
        </Field>
        <Field label="Thời gian chờ (ms)">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="number"
              min={1000}
              max={120000}
              value={draft.timeoutMs}
              onChange={(e) => setDraft({ ...draft, timeoutMs: Number(e.target.value) })}
            />
          )}
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-xs text-[var(--text-muted)]">
            Host được phép: {settings.allowedHosts.join(", ")} (mở rộng bằng biến{" "}
            <code>AI_ALLOWED_HOSTS</code>).
          </p>
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
          <Button type="submit" loading={save.isPending}>
            Lưu cấu hình
          </Button>
        </div>
      </form>
    </AdminCard>
  );
}
