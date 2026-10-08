import { BarChart3, BookCheck, Clock3 } from "lucide-react";
import { cn } from "../../lib/cn";

const ICONS = [Clock3, BookCheck, BarChart3];
const TONES = [232, 168, 26];

export function FeaturesSection({
  title,
  items,
}: {
  title: string;
  items: { title: string; description: string }[];
}) {
  return (
    <section aria-labelledby="features-title" className="space-y-6">
      {/* Giữ h2 là con trực tiếp của <section> để cấu trúc tiêu đề – nội dung vẫn liền mạch. */}
      <p className="text-eyebrow -mb-4">Vì sao chọn TIMO</p>
      <h2 id="features-title">{title}</h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          const hue = TONES[i % TONES.length]!;
          return (
            <li
              key={item.title}
              className="surface-card card-interactive rise-in flex h-full flex-col gap-4 p-6"
              style={{
                ["--tone-hue" as string]: String(hue),
                animationDelay: `${i * 70}ms`,
              }}
            >
              <span className="tone-chip flex size-12 items-center justify-center rounded-2xl">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {item.description}
                </p>
              </div>
              <span
                className={cn("mt-auto h-1.5 w-16 rounded-full tone-gradient")}
                aria-hidden="true"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
