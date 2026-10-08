import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "../ui";
import { cn } from "../../lib/cn";
import { LearningScene } from "../illustrations/LearningScene";
import { SubjectArt } from "../illustrations/SubjectArt";
import { hueForSubject } from "../../lib/visuals";

interface Slide {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

const AUTOPLAY_MS = 6000;

function isInternal(href: string) {
  return href.startsWith("/");
}

/** Thẻ môn học nổi quanh minh họa – chỉ là trang trí, dữ liệu là môn có thật trong danh mục. */
function FloatingSubjectCard({
  slug,
  label,
  className,
}: {
  slug: string;
  label: string;
  className?: string;
}) {
  const hue = hueForSubject(slug);
  return (
    <div
      className={cn(
        "surface-card absolute flex items-center gap-2 rounded-2xl px-3 py-2 shadow-lift",
        className,
      )}
      aria-hidden="true"
    >
      <span
        className="tone-soft flex size-9 items-center justify-center rounded-xl"
        style={{ ["--tone-hue" as string]: String(hue) }}
      >
        <SubjectArt
          artKey={slug === "toan" ? "toan" : slug === "vat-li" ? "vat-li" : "timo-ai"}
          hue={hue}
          className="size-7"
        />
      </span>
      <span className="text-xs font-bold text-[var(--text-strong)]">{label}</span>
    </div>
  );
}

/**
 * Băng chuyền hero: tự chuyển slide, dừng khi người dùng di chuột/focus,
 * không tự chạy khi người dùng bật "giảm chuyển động".
 */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  const slide = slides[index];
  if (!slide) return null;

  return (
    <section
      aria-roledescription="băng chuyền"
      aria-label="Nổi bật"
      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-white shadow-lift"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Trang trí nền */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent-500/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 size-80 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-12 lg:px-14 lg:py-16">
        <div aria-live={paused ? "polite" : "off"}>
          <div key={index} className="rise-in">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-white/90">
              <span className="size-1.5 rounded-full bg-accent-500" aria-hidden="true" />
              Nền tảng học tập K12 · Chương trình GDPT 2018
            </p>
            <h1 className="text-display mt-5 text-white text-balance-tight">{slide.title}</h1>
            {slide.subtitle && (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                {slide.subtitle}
              </p>
            )}
            {slide.ctaLabel && slide.ctaHref && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {isInternal(slide.ctaHref) ? (
                  <Link to={slide.ctaHref}>
                    <Button
                      size="lg"
                      className="bg-white text-brand-700 shadow-lift hover:bg-white/90"
                    >
                      <Play className="size-4" aria-hidden="true" />
                      {slide.ctaLabel}
                    </Button>
                  </Link>
                ) : (
                  <a href={slide.ctaHref} rel="noopener noreferrer">
                    <Button
                      size="lg"
                      className="bg-white text-brand-700 shadow-lift hover:bg-white/90"
                    >
                      <Play className="size-4" aria-hidden="true" />
                      {slide.ctaLabel}
                    </Button>
                  </a>
                )}
                <Link to="/#lop-hoc">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="border border-white/35 text-white hover:bg-white/15"
                  >
                    Xem lớp học
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {count > 1 && (
            <div className="mt-10 flex items-center gap-4">
              <div className="flex gap-2" role="group" aria-label="Chọn slide">
                {slides.map((s, i) => (
                  <button
                    key={s.title + i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    aria-current={i === index}
                    onClick={() => go(i)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === index ? "w-9 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-white/70">
                {index + 1}/{count}
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  aria-label="Slide trước"
                  onClick={() => go(index - 1)}
                  className="flex size-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Slide tiếp theo"
                  onClick={() => go(index + 1)}
                  className="flex size-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minh họa + thẻ môn học nổi (chỉ hiển thị từ màn hình lớn). */}
        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-6 rounded-full bg-white/10 blur-2xl" />
            <LearningScene className="float-slow relative size-full drop-shadow-2xl" />
            <FloatingSubjectCard
              slug="toan"
              label="Toán học"
              className="float-slower -left-4 top-6 motion-reduce:animate-none"
            />
            <FloatingSubjectCard
              slug="vat-li"
              label="Vật lí"
              className="float-slow -right-2 top-1/3 motion-reduce:animate-none"
            />
            <FloatingSubjectCard
              slug="timo-ai"
              label="TIMO AI"
              className="float-slower bottom-4 left-6 motion-reduce:animate-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
