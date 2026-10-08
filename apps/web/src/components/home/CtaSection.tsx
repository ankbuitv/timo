import { Link } from "react-router";
import { ArrowRight, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "../ui";

/** Khối kêu gọi hành động: nền gradient thương hiệu + ba điểm nhấn có thật trên hệ thống. */
export function CtaSection({ label, href, title }: { label: string; href: string; title: string }) {
  const button = (
    <Button size="lg" className="bg-white text-brand-700 shadow-lift hover:bg-white/90">
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Button>
  );
  const points = [
    { icon: BookOpenCheck, text: "Danh mục lớp 1–12 theo chương trình GDPT 2018" },
    { icon: ShieldCheck, text: "Phân quyền rõ ràng cho học sinh, giáo viên và quản trị" },
    { icon: Sparkles, text: "Trợ lý AI dùng khóa mã hóa, không lộ ra trình duyệt" },
  ];
  return (
    <section
      aria-labelledby="cta-title"
      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] px-6 py-10 text-white shadow-lift sm:px-10 sm:py-12"
    >
      <div
        className="pointer-events-none absolute -right-16 -bottom-20 size-72 rounded-full bg-accent-500/30 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 id="cta-title" className="text-h2 text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm text-white/85 sm:text-base">
            Tạo tài khoản để theo dõi tiến độ học tập. Phụ huynh nên đăng ký cùng học sinh dưới 16
            tuổi.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/90">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-white" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0">
          {href.startsWith("/") ? (
            <Link to={href}>{button}</Link>
          ) : (
            <a href={href} rel="noopener noreferrer">
              {button}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
