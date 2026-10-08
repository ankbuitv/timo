import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../lib/auth";
import { Skeleton, Card, Button } from "./ui";
import { Link } from "react-router";

export function LoadingPanel() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-10" role="status" aria-label="Đang tải">
      <Skeleton className="h-8 w-1/3" />
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
      <Card>
        <h1 className="text-xl">Chưa cấu hình đăng nhập</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Biến môi trường <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code> chưa
          được thiết lập. Xem hướng dẫn trong <code>docs/SUPABASE.md</code>.
        </p>
        <div className="mt-4">
          <Link to="/">
            <Button variant="outline">Về trang chủ</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
