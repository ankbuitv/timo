import { EmptyState, ErrorState, Skeleton } from "../ui";
import { usePublicSubjects } from "../../lib/queries/catalog";

export function SubjectsSection({ limit, title }: { limit: number; title: string }) {
  const { data, isPending, isError, refetch } = usePublicSubjects();
  return (
    <section aria-labelledby="subjects-title" className="space-y-5">
      <h2 id="subjects-title" className="text-2xl sm:text-3xl">
        {title}
      </h2>
      {isPending && (
        <div className="flex flex-wrap gap-2" role="status" aria-label="Đang tải môn học">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState message="Không tải được danh sách môn học." onRetry={() => void refetch()} />
      )}
      {data && data.length === 0 && <EmptyState title="Chưa có môn học" />}
      {data && data.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {data.slice(0, limit).map((s) => (
            <li
              key={s.id}
              className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)]"
            >
              {s.nameVi}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
