import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { EDUCATION_STAGES } from "@timo/shared";
import { Card, EmptyState, ErrorState, Skeleton } from "../ui";
import { usePublicGrades, type PublicGrade } from "../../lib/queries/catalog";

const STAGE_TONES: Record<PublicGrade["stage"], string> = {
  primary: "from-emerald-500 to-teal-500",
  lower_secondary: "from-brand-500 to-secondary-500",
  upper_secondary: "from-accent-500 to-orange-400",
};

export function GradeSection({ groups, title }: { groups: PublicGrade["stage"][]; title: string }) {
  const { data, isPending, isError, refetch } = usePublicGrades();

  return (
    <section id="lop-hoc" aria-labelledby="grades-title" className="scroll-mt-20 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="grades-title" className="text-2xl sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Chương trình GDPT 2018 · Lớp 1 đến lớp 12
          </p>
        </div>
      </div>

      {isPending && (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="status"
          aria-label="Đang tải danh sách lớp"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState
          message="Không tải được danh sách lớp. Vui lòng thử lại."
          onRetry={() => void refetch()}
        />
      )}
      {data && data.length === 0 && (
        <EmptyState
          title="Chưa có lớp học nào"
          description="Quản trị viên chưa cấu hình danh sách lớp."
        />
      )}

      {data &&
        groups.map((stage) => {
          const meta = EDUCATION_STAGES.find((s) => s.key === stage);
          const items = data.filter((g) => g.stage === stage);
          if (!meta || items.length === 0) return null;
          return (
            <div key={stage} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {meta.nameVi} · Lớp {meta.minGrade}–{meta.maxGrade}
              </h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {items.map((g) => (
                  <li key={g.id}>
                    <Link
                      to={`/lop/${g.slug}`}
                      className="group block h-full rounded-[var(--radius-card)] focus-visible:rounded-[var(--radius-card)]"
                    >
                      <Card className="h-full p-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lift">
                        <span
                          className={`mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${STAGE_TONES[stage]}`}
                        >
                          {g.level}
                        </span>
                        <span className="flex items-center justify-between gap-2 font-semibold text-[var(--text-strong)]">
                          {g.nameVi}
                          <ArrowRight
                            className="size-4 text-brand-500 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden="true"
                          />
                        </span>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </section>
  );
}
