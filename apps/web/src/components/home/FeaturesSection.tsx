import { BarChart3, BookCheck, Clock3 } from "lucide-react";

const ICONS = [Clock3, BookCheck, BarChart3];

export function FeaturesSection({
  title,
  items,
}: {
  title: string;
  items: { title: string; description: string }[];
}) {
  return (
    <section aria-labelledby="features-title" className="space-y-6">
      <h2 id="features-title" className="text-2xl sm:text-3xl">
        {title}
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          return (
            <li key={item.title} className="surface-card p-6">
              <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-200">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.description}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
