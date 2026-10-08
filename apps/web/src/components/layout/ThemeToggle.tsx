import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../lib/theme-provider";
import { THEME_LABELS, type ThemePreference } from "../../lib/theme";
import { cn } from "../../lib/cn";

const OPTIONS: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];

/** Bộ chọn chủ đề: Sáng / Tối / Theo hệ thống. Lưu lựa chọn trong localStorage. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Chủ đề giao diện"
      className="inline-flex rounded-xl bg-[var(--surface-muted)] p-1"
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={THEME_LABELS[value]}
            title={THEME_LABELS[value]}
            onClick={() => setPreference(value)}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors",
              selected
                ? "bg-[var(--surface-card)] text-brand-600 shadow-soft dark:text-brand-200"
                : "text-[var(--text-muted)] hover:text-[var(--text-strong)]",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
