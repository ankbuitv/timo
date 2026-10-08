import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { EDUCATION_STAGES } from "@timo/shared";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui";
import { usePublicGrades, usePublicSubjects } from "../lib/queries/catalog";
import { usePageMeta } from "../lib/seo";

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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-40" />
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
            <Link to="/" className="font-semibold text-brand-600">
              ← Về trang chủ
            </Link>
          }
        />
      </div>
    );
  }
  const stage = EDUCATION_STAGES.find((s) => s.key === grade.stage);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        to="/#lop-hoc"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Tất cả lớp học
      </Link>
      <PageHeader
        title={grade.nameVi}
        description={`${stage?.nameVi ?? ""} · Chương trình GDPT 2018 – Kết nối tri thức với cuộc sống.`}
        actions={<Badge tone="brand">Lớp {grade.level}</Badge>}
      />

      <section aria-labelledby="subjects-heading" className="space-y-4">
        <h2 id="subjects-heading" className="text-xl">
          Môn học
        </h2>
        {subjects.isPending && <Skeleton className="h-24" />}
        {subjects.isError && (
          <ErrorState message="Không tải được môn học." onRetry={() => void subjects.refetch()} />
        )}
        {subjects.data && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.data.map((s) => (
              <li key={s.id}>
                <Card className="flex items-center justify-between gap-3 p-4">
                  <span className="font-semibold text-[var(--text-strong)]">{s.nameVi}</span>
                  <Badge>Đang xây dựng nội dung</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EmptyState
        title="Bài học và bài tập đang được chuẩn bị"
        description="Module Khóa học – Bài học – Bài tập sẽ được mở ở các giai đoạn tiếp theo. Hiện tại trang này chỉ hiển thị danh mục môn học."
      />
    </div>
  );
}
