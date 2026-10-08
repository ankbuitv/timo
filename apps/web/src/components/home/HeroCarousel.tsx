import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui";
import { cn } from "../../lib/cn";
import { LearningScene } from "../illustrations/LearningScene";

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
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-accent-500/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 size-72 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Minh họa SVG gốc của TIMO – chỉ hiển thị từ màn hình lớn để không che nội dung. */}
      <div
        className="pointer-events-none absolute inset-y-6 right-6 hidden w-[42%] max-w-lg items-center lg:flex"
        aria-hidden="true"
      >
        <LearningScene className="h-full w-full drop-shadow-2xl" />
      </div>

      <div
        className="relative min-h-72 px-6 py-12 sm:px-12 sm:py-16 md:min-h-80"
        aria-live={paused ? "polite" : "off"}
      >
        <div key={index} className="max-w-2xl animate-[toast-in_500ms_ease-out] lg:max-w-[54%]">
          <p className="text-sm font-semibold text-white/80">
            Slide {index + 1} / {count}
          </p>
          <h1 className="mt-3 text-3xl leading-tight text-white sm:text-5xl">{slide.title}</h1>
          {slide.subtitle && (
            <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">{slide.subtitle}</p>
          )}
          {slide.ctaLabel && slide.ctaHref && (
            <div className="mt-8">
              {isInternal(slide.ctaHref) ? (
                <Link to={slide.ctaHref}>
                  <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90">
                    {slide.ctaLabel}
                  </Button>
                </Link>
              ) : (
                <a href={slide.ctaHref} rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90">
                    {slide.ctaLabel}
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="relative flex items-center justify-between gap-4 px-6 pb-6 sm:px-12">
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
                  i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
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
    </section>
  );
}
