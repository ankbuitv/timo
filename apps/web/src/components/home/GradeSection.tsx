import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { EDUCATION_STAGES } from "@timo/shared";
import { EmptyState, ErrorState, Skeleton } from "../ui";
import { usePublicGrades, type PublicGrade } from "../../lib/queries/catalog";
import { hueForGrade } from "../../lib/visuals";

/**
 * Thẻ lớp học 1–12. Mỗi lớp có sắc độ riêng (hueForGrade) và hình khối theo cấp học:
 * Mầm (Tiểu học) → Cầu (THCS) → Tên lửa (THPT). Toàn bộ hình là SVG gốc của TIMO.
 */
function StageMotif({ stage, className }: { stage: PublicGrade["stage"]; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      {stage === "primary" && (
        <>
          {/* Mầm cây: hạt, thân, hai lá. */}
          <ellipse cx="24" cy="40" rx="9" ry="3" {...common} opacity="0.45" />
          <path d="M24 40V22" {...common} />
          <path d="M24 30c-7 0-10-4-10-9 6 0 10 3 10 9z" {...common} />
          <path d="M24 26c0-7 4-10 10-10 0 7-4 10-10 10z" {...common} />
        </>
      )}
      {stage === "lower_secondary" && (
        <>
          {/* Cầu: nhịp cầu, hai trụ, dầm. */}
          <path d="M4 34h40" {...common} />
          <path d="M10 34V18M38 34V18" {...common} />
          <path d="M4 20c10 8 30 8 40 0" {...common} />
          <path d="M16 22v12M24 24v10M32 22v12" {...common} opacity="0.6" />
        </>
      )}
      {stage === "upper_secondary" && (
        <>
          {/* Tên lửa: thân, cửa sổ, cánh, khói. */}
          <path d="M24 4c6 6 8 14 8 22v8H16v-8c0-8 2-16 8-22z" {...common} />
          <circle cx="24" cy="20" r="4" {...common} />
          <path d="M16 26l-6 8h6M32 26l6 8h-6" {...common} />
          <path d="M20 38c0 4 2 6 4 6s4-2 4-6" {...common} opacity="0.6" />
        </>
      )}
    </svg>
  );
}

export function GradeSection({ groups, title }: { groups: PublicGrade["stage"][]; title: string }) {
  const { data, isPending, isError, refetch } = usePublicGrades();

  return (
    <section id="lop-hoc" aria-labelledby="grades-title" className="scroll-mt-24 space-y-6">
      <p className="text-eyebrow -mb-4">Chương trình GDPT 2018</p>
      <h2 id="grades-title">{title}</h2>
      <p className="max-w-2xl text-sm text-[var(--text-muted)]">
        Chọn lớp để xem danh mục môn học tương ứng. Lớp 1–5 Tiểu học, 6–9 THCS, 10–12 THPT.
      </p>

      {isPending && (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="status"
          aria-label="Đang tải danh sách lớp"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
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
            <div key={stage} className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="tone-chip inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ ["--tone-hue" as string]: String(hueForGrade(meta.minGrade)) }}
                >
                  <StageMotif stage={stage} className="size-5" />
                </span>
                <h3 className="text-base font-bold text-[var(--text-strong)]">
                  {meta.nameVi}
                  <span className="ml-2 text-sm font-medium text-[var(--text-muted)]">
                    Lớp {meta.minGrade}–{meta.maxGrade}
                  </span>
                </h3>
                <span className="h-px flex-1 bg-[var(--border-subtle)]" aria-hidden="true" />
              </div>

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {items.map((g) => (
                  <li key={g.id}>
                    <GradeCard grade={g} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </section>
  );
}

function GradeCard({ grade }: { grade: PublicGrade }) {
  const hue = hueForGrade(grade.level);
  return (
    <Link
      to={`/lop/${grade.slug}`}
      className="tone-surface card-interactive group flex h-full flex-col justify-between gap-4 rounded-[var(--radius-card)] border p-4"
      style={{ ["--tone-hue" as string]: String(hue) }}
      aria-label={`${grade.nameVi} – xem môn học và nội dung`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="tone-gradient flex size-12 items-center justify-center rounded-2xl text-xl font-extrabold text-white shadow-tile"
          aria-hidden="true"
        >
          {grade.level}
        </span>
        <StageMotif
          stage={grade.stage}
          className="tone-ink size-7 opacity-70 transition-opacity group-hover:opacity-100"
        />
      </div>
      <div>
        <p className="text-sm font-bold text-[var(--text-strong)]">{grade.nameVi}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)]">
          Xem môn học
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </p>
      </div>
    </Link>
  );
}
