/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Để trống = cùng origin (khuyến nghị khi dùng route /api). */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  /** Khóa anon của Supabase là khóa CÔNG KHAI, an toàn cho trình duyệt. KHÔNG dùng service_role. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PUBLIC_APP_URL?: string;
  readonly VITE_PUBLIC_SUPPORT_URL?: string;
  readonly VITE_PUBLIC_STATUS_URL?: string;
  readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
