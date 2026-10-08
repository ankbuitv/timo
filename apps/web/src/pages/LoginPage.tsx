import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Card, Field, Input } from "../components/ui";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { AuthNotConfigured } from "../components/RequireAuth";
import { usePageMeta } from "../lib/seo";
import { config } from "../lib/config";

type Mode = "signin" | "signup";
type OAuthProvider = "google" | "facebook" | "azure";

const OAUTH: { provider: OAuthProvider; label: string }[] = [
  { provider: "google", label: "Google" },
  { provider: "facebook", label: "Facebook" },
  { provider: "azure", label: "Microsoft" },
];

function safeNext(raw: string | null): string {
  // Chỉ cho phép đường dẫn nội bộ, chặn open-redirect.
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/tai-khoan";
  return raw;
}

export default function LoginPage() {
  usePageMeta({ title: "Đăng nhập – TIMO", noindex: true });
  const supabase = getSupabase();
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(params.get("next"));

  if (!supabase) return <AuthNotConfigured />;
  if (session) return <Navigate to={next} replace />;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || password.length < 8) {
      setError("Vui lòng nhập email hợp lệ và mật khẩu từ 8 ký tự.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase!.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        toast.success("Đăng nhập thành công");
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        navigate(next, { replace: true });
      } else {
        const { data, error: err } = await supabase!.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${config.appUrl}/dang-nhap` },
        });
        if (err) throw err;
        if (data.session) {
          toast.success("Tạo tài khoản thành công");
          navigate(next, { replace: true });
        } else {
          toast.success("Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư.");
        }
      }
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: OAuthProvider) {
    setError(null);
    const { error: err } = await supabase!.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${config.appUrl}${next}` },
    });
    if (err) setError(translateAuthError(err));
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16">
      <div className="space-y-4">
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-200">
          Học mọi lúc, giỏi mọi nơi
        </p>
        <h1 className="text-3xl sm:text-4xl">
          {mode === "signin" ? "Chào mừng trở lại" : "Tạo tài khoản TIMO"}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Tài khoản dùng chung cho TIMO và Trung tâm hỗ trợ. Trẻ dưới 16 tuổi nên đăng ký cùng phụ
          huynh.
        </p>
      </div>

      <Card className="space-y-5">
        <div
          role="tablist"
          aria-label="Chế độ"
          className="grid grid-cols-2 rounded-xl bg-[var(--surface-muted)] p-1"
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`h-9 rounded-lg text-sm font-semibold ${mode === m ? "bg-[var(--surface-card)] text-brand-600 shadow-soft dark:text-brand-200" : "text-[var(--text-muted)]"}`}
            >
              {m === "signin" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={submit} noValidate>
          <Field label="Email">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            )}
          </Field>
          <Field label="Mật khẩu" hint={mode === "signup" ? "Tối thiểu 8 ký tự." : undefined}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            )}
          </Field>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </p>
          )}
          <Button type="submit" size="lg" loading={busy} className="w-full">
            {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
          </Button>
        </form>

        <div className="relative py-1 text-center text-xs text-[var(--text-muted)]">
          <span className="bg-[var(--surface-card)] px-2 relative z-10">hoặc tiếp tục với</span>
          <span
            className="absolute inset-x-0 top-1/2 h-px bg-[var(--border-subtle)]"
            aria-hidden="true"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {OAUTH.map((o) => (
            <Button
              key={o.provider}
              variant="outline"
              size="sm"
              onClick={() => void oauth(o.provider)}
            >
              {o.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Đăng nhập bằng mạng xã hội chỉ hoạt động khi nhà cung cấp đã được bật trong Supabase (xem
          docs/SUPABASE.md).
        </p>
        <p className="text-center text-sm">
          <Link to="/" className="font-semibold text-brand-600 dark:text-brand-200">
            ← Về trang chủ
          </Link>
        </p>
      </Card>
    </div>
  );
}

function translateAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (/invalid login credentials/i.test(message)) return "Email hoặc mật khẩu không đúng.";
  if (/email not confirmed/i.test(message))
    return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.";
  if (/already registered|already been registered/i.test(message))
    return "Email này đã được đăng ký.";
  if (/rate limit|too many/i.test(message))
    return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  if (/provider is not enabled|unsupported provider/i.test(message))
    return "Nhà cung cấp đăng nhập này chưa được bật.";
  return "Không thể thực hiện yêu cầu. Vui lòng thử lại.";
}
