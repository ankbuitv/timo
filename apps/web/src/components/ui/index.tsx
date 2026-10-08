import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type CSSProperties,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { SubjectArt } from "../illustrations/SubjectArt";
import { artKeyForSubject, hueForSubject } from "../../lib/visuals";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-soft hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300",
  secondary:
    "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-600 disabled:bg-secondary-500/50",
  outline:
    "border border-[var(--border-strong)] bg-[var(--surface-card)] text-[var(--text-strong)] hover:border-brand-400 hover:bg-[var(--surface-muted)]",
  ghost: "text-[var(--text-body)] hover:bg-[var(--surface-muted)]",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/50 dark:text-brand-100 dark:hover:bg-brand-900/70",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-xl",
  md: "h-11 px-4.5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-2xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 select-none",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});

/** Khối nội dung cơ bản. `tone` đổi màu viền/nền nhẹ theo môn học hoặc khối lớp. */
export function Card({
  className,
  children,
  tone,
  style,
}: {
  className?: string;
  children: ReactNode;
  /** Hue (0–360) để áp hệ màu "tone" (xem styles/index.css). */
  tone?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("surface-card p-5 sm:p-6", tone !== undefined && "tone-surface", className)}
      style={{
        ...(tone !== undefined ? { ["--tone-hue" as string]: String(tone) } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "brand" | "success" | "accent" | "warning" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-[var(--surface-muted)] text-[var(--text-body)]",
    brand: "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-100",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100",
    accent: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100",
    warning: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-strong)]">
        {label}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 text-[var(--text-strong)] placeholder:text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] focus:border-brand-500 focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-red-500";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(inputBase, "h-11", className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(inputBase, "h-11 pr-9", className)} {...rest}>
        {children}
      </select>
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(inputBase, "min-h-24 py-2.5", className)} {...rest} />;
});

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden="true" />;
}

/**
 * Trạng thái rỗng. Truyền `artSlug` để hiện minh họa môn học, hoặc `artKey` cho hình chung.
 */
export function EmptyState({
  title,
  description,
  action,
  artSlug,
  artKey,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  artSlug?: string;
  artKey?: "book" | "thu-vien" | "ky-thi" | "timo-ai";
}) {
  const art = artKey ?? (artSlug ? artKeyForSubject(artSlug) : "book");
  const hue = artSlug ? hueForSubject(artSlug) : 245;
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)] px-6 py-12 text-center">
      <span
        className="tone-soft flex size-20 items-center justify-center rounded-3xl"
        style={{ ["--tone-hue" as string]: String(hue) }}
      >
        <SubjectArt artKey={art} hue={hue} className="size-14" />
      </span>
      <h3 className="text-base">{title}</h3>
      {description && <p className="max-w-md text-sm text-[var(--text-muted)]">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950/40"
    >
      <AlertTriangle className="size-8 text-red-600 dark:text-red-400" aria-hidden="true" />
      <p className="max-w-md text-sm font-medium text-red-800 dark:text-red-200">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Hộp thoại dùng phần tử <dialog> gốc: focus trap, Esc, và vai trò ARIA có sẵn. */
export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(92vw,34rem)] rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-0 text-[var(--text-body)] shadow-lift backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 rounded-t-[var(--radius-card)] border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-5">
        <div>
          <h2 id={titleId} className="text-lg">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại"
          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-card)]"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="p-5">{children}</div>
      {footer && (
        <div className="flex flex-wrap justify-end gap-2 rounded-b-[var(--radius-card)] border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-eyebrow mb-1.5">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-muted)] sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Dải số liệu dùng chung cho bảng điều khiển quản trị. */
export function StatTile({
  label,
  value,
  hint,
  hue = 232,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  hue?: number;
  icon?: ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div
      className="surface-card flex items-start gap-4 p-5"
      style={{ ["--tone-hue" as string]: String(hue) }}
    >
      {icon && (
        <span className="tone-chip flex size-11 shrink-0 items-center justify-center rounded-2xl">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </div>
        <div
          className={cn(
            "mt-1 text-2xl font-extrabold",
            tone === "danger"
              ? "text-red-600 dark:text-red-400"
              : tone === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-[var(--text-strong)]",
          )}
        >
          {value}
        </div>
        {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    </div>
  );
}

/** Bọc bảng dữ liệu quản trị: bo góc, cuộn ngang trên màn hình nhỏ. */
export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("surface-panel", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
