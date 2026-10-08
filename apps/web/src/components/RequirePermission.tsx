import { Outlet } from "react-router";
import { useAuth } from "../lib/auth";
import { Card } from "./ui";

export function RequirePermission({ permission }: { permission: string }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <Card className="text-center">
        <h1 className="text-xl">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Tài khoản của bạn chưa được cấp quyền cho mục này.
        </p>
      </Card>
    );
  }
  return <Outlet />;
}
