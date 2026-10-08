import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Outlet,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from "react-router";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SiteFooter } from "./components/layout/SiteFooter";
import { MobileTabBar } from "./components/layout/MobileTabBar";
import { AdminShell } from "./components/layout/AdminShell";
import { RequireAuth, LoadingPanel } from "./components/RequireAuth";
import { RequirePermission } from "./components/RequirePermission";
import { Button, Card } from "./components/ui";
import { SubjectArt } from "./components/illustrations/SubjectArt";
import { HomePage } from "./pages/HomePage";

// Tách mã theo trang (code splitting): trang quản trị và đăng nhập chỉ tải khi cần.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const BootstrapPage = lazy(() => import("./pages/BootstrapPage"));
const GradePage = lazy(() => import("./pages/GradePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const OverviewPage = lazy(() => import("./pages/admin/OverviewPage"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const GradesAdminPage = lazy(() => import("./pages/admin/GradesAdminPage"));
const SubjectsAdminPage = lazy(() => import("./pages/admin/SubjectsAdminPage"));
const CmsPage = lazy(() => import("./pages/admin/CmsPage"));
const AuditPage = lazy(() => import("./pages/admin/AuditPage"));
const AiKeysAdminPage = lazy(() => import("./pages/admin/AiKeysAdminPage"));

function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
      >
        Bỏ qua điều hướng
      </a>
      <SiteHeader />
      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Suspense fallback={<LoadingPanel />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
      <MobileTabBar />
      <ScrollRestoration />
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Suspense fallback={<LoadingPanel />}>
          <AdminShell />
        </Suspense>
      </main>
      <MobileTabBar />
    </div>
  );
}

function RouteErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
      <Card className="space-y-4 text-center">
        <span className="tone-soft mx-auto flex size-20 items-center justify-center rounded-3xl">
          <SubjectArt artKey="book" hue={notFound ? 232 : 26} className="size-14" />
        </span>
        <p className="text-eyebrow">{notFound ? "Lỗi 404" : "Sự cố"}</p>
        <h1>{notFound ? "Không tìm thấy trang" : "Đã xảy ra lỗi"}</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {notFound
            ? "Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển."
            : "Hệ thống gặp sự cố ngoài dự kiến. Vui lòng tải lại trang."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/">
            <Button>Về trang chủ</Button>
          </Link>
          <Link to="/#lop-hoc">
            <Button variant="outline">Xem lớp học</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage />, errorElement: <RouteErrorPage /> },
      { path: "lop/:slug", element: <GradePage />, errorElement: <RouteErrorPage /> },
      { path: "thong-tin", element: <AboutPage />, errorElement: <RouteErrorPage /> },
      { path: "dang-nhap", element: <LoginPage />, errorElement: <RouteErrorPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "tai-khoan", element: <AccountPage />, errorElement: <RouteErrorPage /> },
          {
            path: "khoi-tao-quan-tri",
            element: <BootstrapPage />,
            errorElement: <RouteErrorPage />,
          },
        ],
      },
      { path: "*", element: <RouteErrorPage /> },
    ],
  },
  {
    path: "admin",
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <OverviewPage />, errorElement: <RouteErrorPage /> },
          {
            element: <RequirePermission permission="users:view" />,
            children: [
              { path: "nguoi-dung", element: <UsersPage />, errorElement: <RouteErrorPage /> },
            ],
          },
          {
            element: <RequirePermission permission="grades:view" />,
            children: [
              { path: "lop-hoc", element: <GradesAdminPage />, errorElement: <RouteErrorPage /> },
            ],
          },
          {
            element: <RequirePermission permission="subjects:view" />,
            children: [
              { path: "mon-hoc", element: <SubjectsAdminPage />, errorElement: <RouteErrorPage /> },
            ],
          },
          {
            element: <RequirePermission permission="cms:view" />,
            children: [{ path: "cms", element: <CmsPage />, errorElement: <RouteErrorPage /> }],
          },
          {
            element: <RequirePermission permission="ai:manage" />,
            children: [
              { path: "ai", element: <AiKeysAdminPage />, errorElement: <RouteErrorPage /> },
            ],
          },
          {
            element: <RequirePermission permission="audit:view" />,
            children: [
              { path: "nhat-ky", element: <AuditPage />, errorElement: <RouteErrorPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
