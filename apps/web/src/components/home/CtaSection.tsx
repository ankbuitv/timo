import { Link } from "react-router";
import { Button } from "../ui";

export function CtaSection({ label, href, title }: { label: string; href: string; title: string }) {
  const button = <Button size="lg">{label}</Button>;
  return (
    <section
      aria-labelledby="cta-title"
      className="surface-card flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10"
    >
      <div>
        <h2 id="cta-title" className="text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Tạo tài khoản để lưu tiến độ học tập của bạn.
        </p>
      </div>
      {href.startsWith("/") ? (
        <Link to={href}>{button}</Link>
      ) : (
        <a href={href} rel="noopener noreferrer">
          {button}
        </a>
      )}
    </section>
  );
}
