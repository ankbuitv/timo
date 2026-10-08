import { ErrorState, Skeleton } from "../components/ui";
import { AnnouncementBar } from "../components/home/AnnouncementBar";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { GradeSection } from "../components/home/GradeSection";
import { SubjectsSection } from "../components/home/SubjectsSection";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { CtaSection } from "../components/home/CtaSection";
import { FeaturedCoursesSection } from "../components/home/FeaturedCoursesSection";
import { QuickStartSection, RoadmapSection } from "../components/home/Sections";
import { usePublicHomepage, type HomepageSection } from "../lib/queries/catalog";
import { usePageMeta } from "../lib/seo";
import { TIMO_BRAND } from "@timo/shared";

/**
 * Trang chủ được điều khiển bởi CMS: thứ tự và nội dung khối lấy từ API.
 *
 * Hai khối tĩnh được chèn vào theo vị trí cố định (không thuộc CMS):
 * - "Đi tới nội dung bạn cần" ngay sau hero (lối vào nhanh tới các trang đã có).
 * - "TIMO đang ở đâu trên lộ trình" ngay trước khối kêu gọi hành động.
 */
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
  const heroIndex = sections.findIndex((s) => s.type === "hero");
  const ctaIndex = sections.findIndex((s) => s.type === "cta");
  const quickStartAt = heroIndex >= 0 ? heroIndex + 1 : 0;
  const roadmapAt = ctaIndex >= 0 ? ctaIndex : sections.length;

  // Mỗi khối nội dung nằm trong một "dải" có nhịp dọc thống nhất; khối hero/announcement
  // tràn viền nên được xử lý riêng.
  const nodes: React.ReactNode[] = [];
  sections.forEach((section, index) => {
    if (index === quickStartAt) {
      nodes.push(
        <Shell key="static-quickstart">
          <QuickStartSection />
        </Shell>,
      );
    }
    if (index === roadmapAt) {
      nodes.push(
        <Shell key="static-roadmap">
          <RoadmapSection />
        </Shell>,
      );
    }
    nodes.push(<SectionNode key={section.key} section={section} />);
  });
  if (quickStartAt >= sections.length) {
    nodes.push(
      <Shell key="static-quickstart">
        <QuickStartSection />
      </Shell>,
    );
  }
  if (roadmapAt >= sections.length) {
    nodes.push(
      <Shell key="static-roadmap">
        <RoadmapSection />
      </Shell>,
    );
  }

  return <div className="section-stack">{nodes}</div>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="section-shell">{children}</div>;
}

function SectionNode({ section }: { section: HomepageSection }) {
  switch (section.type) {
    case "announcement":
      return section.config.enabled ? (
        <AnnouncementBar message={section.config.message} tone={section.config.tone} />
      ) : null;
    case "hero":
      return (
        <div className="section-shell pt-4 sm:pt-6">
          <HeroCarousel slides={section.config.slides} />
        </div>
      );
    case "grades":
      return (
        <Shell>
          <GradeSection title={section.titleVi} groups={section.config.groups} />
        </Shell>
      );
    case "featured_courses":
      return (
        <Shell>
          <FeaturedCoursesSection title={section.titleVi} note={section.config.note} />
        </Shell>
      );
    case "subjects":
      return (
        <Shell>
          <SubjectsSection title={section.titleVi} limit={section.config.limit} />
        </Shell>
      );
    case "features":
      return (
        <Shell>
          <FeaturesSection title={section.titleVi} items={section.config.items} />
        </Shell>
      );
    case "cta":
      return (
        <Shell>
          <CtaSection
            title={section.titleVi}
            label={section.config.ctaLabel}
            href={section.config.ctaHref}
          />
        </Shell>
      );
    default:
      return null;
  }
}

function HomeSkeleton() {
  return (
    <div className="section-stack" role="status" aria-label="Đang tải trang chủ">
      <div className="section-shell pt-4">
        <Skeleton className="h-80 rounded-[2rem]" />
      </div>
      <div className="section-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <div className="section-shell grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="section-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
