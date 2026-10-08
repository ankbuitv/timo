import { Link, useParams } from "react-router";
import { ArrowLeft, BookOpen, Construction } from "lucide-react";
import { EDUCATION_STAGES } from "@timo/shared";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui";
import { usePublicGrades, usePublicSubjects } from "../lib/queries/catalog";
import { usePageMeta } from "../lib/seo";
import { ChalkArt } from "../components/illustrations/ChalkArt";
import { artKeyForSubject, hueForGrade } from "../lib/visuals";

/**
 * Trang lớp học: bảng phấn (chalk) giới thiệu lớp + danh mục môn học dạng thẻ minh họa.
 * Nội dung bài học theo môn chưa có nên hiển thị trạng thái trung thực.
 */
export default function GradePage() {
  const { slug = "" } = useParams();
  const grades = usePublicGrades();
  const subjects = usePublicSubjects();
  const grade = grades.data?.find((g) => g.slug === slug);
  usePageMeta({
    title: grade ? `${grade.nameVi} – TIMO` : "Lớp học – TIMO",
    description: grade ? `Môn học ${grade.nameVi} theo Chương trình GDPT 2018.` : undefined,
  });

  if (grades.isPending)
    return (
      <div className="section-shell space-y-4 py-10">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-44" />
      </div>
    );
  if (grades.isError)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message="Không tải được thông tin lớp." onRetry={() => void grades.refetch()} />
      </div>
    );
  if (!grade) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Không tìm thấy lớp học"
          description="Lớp này không tồn tại hoặc chưa được mở."
          action={
            <Link to="/#lop-hoc" className="font-semibold text-brand-600 dark:text-brand-200">
              ← Về danh mục lớp học
            </Link>
          }
        />
      </div>
    );
  }
  const stage = EDUCATION_STAGES.find((s) => s.key === grade.stage);
  const hue = hueForGrade(grade.level);
  const siblings = (grades.data ?? []).filter((g) => g.stage === grade.stage);

  return (
    <div className="section-shell section-stack">
      <div className="space-y-6">
        <Link
          to="/#lop-hoc"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-200"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Tất cả lớp học
        </Link>

        {/* Bảng phấn: minh họa theo cấp học + thông tin lớp. */}
        <div className="grid items-center gap-6 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <div className="chalkboard chalkboard-grid mx-auto w-full max-w-[10rem] p-3">
            <ChalkArt
              artKey={stage?.key === "primary" ? "book" : artKeyForSubject("toan")}
              board={false}
            />
          </div>
          <div>
            <p className="text-eyebrow">Chương trình GDPT 2018</p>
            <PageHeader
              title={grade.nameVi}
              description={`${stage?.nameVi ?? ""} · ${
                siblings.length > 0
                  ? `Các lớp cùng cấp: ${siblings.map((s) => s.nameVi).join(", ")}`
                  : "Kết nối tri thức với cuộc sống."
              }`}
              actions={<Badge tone="brand">{stage?.nameVi ?? "Lớp"}</Badge>}
            />
          </div>
        </div>

        <section aria-labelledby="subjects-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="subjects-heading">Môn học của {grade.nameVi}</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Danh mục môn học lấy từ hệ thống quản trị (CMS).
            </p>
          </div>

          {subjects.isPending && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          )}
          {subjects.isError && (
            <ErrorState message="Không tải được môn học." onRetry={() => void subjects.refetch()} />
          )}
          {subjects.data && subjects.data.length === 0 && (
            <EmptyState
              title="Chưa có môn học"
              description="Quản trị viên chưa cấu hình môn học."
            />
          )}
          {subjects.data && subjects.data.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {subjects.data.map((s, i) => (
                <li key={s.id}>
                  <Card
                    tone={hue}
                    className="card-interactive rise-in flex h-full flex-col gap-3"
                    style={i < 8 ? { animationDelay: `${i * 45}ms` } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className="chalkboard chalkboard-grid flex size-14 shrink-0 items-center justify-center p-1.5">
                        <ChalkArt artKey={artKeyForSubject(s.slug)} board={false} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-[var(--text-strong)]">
                          {s.nameVi}
                        </h3>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <Construction className="size-3.5" aria-hidden="true" />
                          Nội dung đang xây dựng
                        </p>
                      </div>
                    </div>
                    {s.description && (
                      <p className="line-clamp-2 text-sm text-[var(--text-muted)]">
                        {s.description}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-[var(--text-strong)]">
                Bài học, bài tập và đề thi đang được chuẩn bị
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Module Khóa học – Bài học – Bài tập sẽ được mở ở giai đoạn tiếp theo. Hiện tại trang
                này hiển thị danh mục môn học của {grade.nameVi}.
              </p>
            </div>
          </div>
          <Link
            to="/thong-tin"
            className="shrink-0 font-semibold text-brand-600 dark:text-brand-200"
          >
            Xem lộ trình →
          </Link>
        </Card>
      </div>
    </div>
  );
}
