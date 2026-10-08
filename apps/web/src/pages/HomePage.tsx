import { ErrorState, Skeleton } from "../components/ui";
import { AnnouncementBar } from "../components/home/AnnouncementBar";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { GradeSection } from "../components/home/GradeSection";
import { SubjectsSection } from "../components/home/SubjectsSection";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { CtaSection } from "../components/home/CtaSection";
import { FeaturedCoursesSection } from "../components/home/FeaturedCoursesSection";
import { usePublicHomepage, type HomepageSection } from "../lib/queries/catalog";
import { usePageMeta } from "../lib/seo";
import { TIMO_BRAND } from "@timo/shared";

/** Trang chủ được điều khiển bởi CMS: thứ tự và nội dung khối lấy từ API. */
export function HomePage() {
  const { data, isPending, isError, refetch } = usePublicHomepage();
  usePageMeta({
    title: `TIMO – ${TIMO_BRAND.sloganVi}`,
    description:
      "Nền tảng học tập K12 theo Chương trình GDPT 2018 – bài giảng, luyện tập và theo dõi tiến độ.",
  });

  return (
    <>
      {isPending && <HomeSkeleton />}
      {isError && (
        <div className="mx-auto max-w-3xl px-4 py-16">
          <ErrorState message="Không tải được nội dung trang chủ." onRetry={() => void refetch()} />
        </div>
      )}
      {data && <HomeSections sections={data} />}
    </>
  );
}

function HomeSections({ sections }: { sections: HomepageSection[] }) {
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case "announcement":
            return section.config.enabled ? (
              <AnnouncementBar
                key={section.key}
                message={section.config.message}
                tone={section.config.tone}
              />
            ) : null;
          case "hero":
            return (
              <div key={section.key} className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
                <HeroCarousel slides={section.config.slides} />
              </div>
            );
          case "grades":
            return (
              <div key={section.key} className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
                <GradeSection title={section.titleVi} groups={section.config.groups} />
              </div>
            );
          case "featured_courses":
            return (
              <div key={section.key} className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <FeaturedCoursesSection title={section.titleVi} note={section.config.note} />
              </div>
            );
          case "subjects":
            return (
              <div key={section.key} className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <SubjectsSection title={section.titleVi} limit={section.config.limit} />
              </div>
            );
          case "features":
            return (
              <div key={section.key} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <FeaturesSection title={section.titleVi} items={section.config.items} />
              </div>
            );
          case "cta":
            return (
              <div key={section.key} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <CtaSection
                  title={section.titleVi}
                  label={section.config.ctaLabel}
                  href={section.config.ctaHref}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function HomeSkeleton() {
  return (
    <div
      className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6"
      role="status"
      aria-label="Đang tải trang chủ"
    >
      <Skeleton className="h-72 rounded-[2rem]" />
      <Skeleton className="h-40" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
