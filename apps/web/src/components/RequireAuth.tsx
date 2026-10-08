import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../lib/auth";
import { Skeleton, Card, Button } from "./ui";
import { Link } from "react-router";
import { KeyRound } from "lucide-react";

export function LoadingPanel() {
  return (
    <div className="section-shell space-y-4 py-10" role="status" aria-label="Đang tải">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-2/5" />
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}

/** Chặn truy cập trang yêu cầu đăng nhập (UX). Quyền thật được kiểm tra trên API. */
export function RequireAuth() {
  const { session, loading, authConfigured } = useAuth();
  const location = useLocation();
  if (!authConfigured) return <AuthNotConfigured />;
  if (loading) return <LoadingPanel />;
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/dang-nhap?next=${next}`} replace />;
  }
  return <Outlet />;
}

export function AuthNotConfigured() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="space-y-4 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100">
          <KeyRound className="size-7" aria-hidden="true" />
        </span>
        <h1>Chưa cấu hình đăng nhập</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Biến môi trường <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code> chưa
          được thiết lập cho môi trường này. Xem hướng dẫn trong <code>docs/SUPABASE.md</code>.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Trong lúc đó, bạn vẫn xem được danh mục lớp học và môn học ở trang chủ.
        </p>
        <div className="flex justify-center">
          <Link to="/">
            <Button variant="outline">Về trang chủ</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
