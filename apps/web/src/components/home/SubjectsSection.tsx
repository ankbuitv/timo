import { Badge, EmptyState, ErrorState, Skeleton } from "../ui";
import { usePublicSubjects } from "../../lib/queries/catalog";
import { SubjectArt } from "../illustrations/SubjectArt";
import { artKeyForSubject, hueForSubject } from "../../lib/visuals";

/**
 * Môn học dạng thẻ có minh họa (flat vector gốc của TIMO) thay cho các "viên thuốc" chữ.
 *
 * Thẻ KHÔNG phải liên kết: module nội dung môn học thuộc giai đoạn sau, nên hiển thị nhãn
 * "Đang xây dựng nội dung" thay vì dẫn tới trang trống.
 */
export function SubjectsSection({ limit, title }: { limit: number; title: string }) {
  const { data, isPending, isError, refetch } = usePublicSubjects();
  return (
    <section id="mon-hoc" aria-labelledby="subjects-title" className="scroll-mt-24 space-y-6">
      <p className="text-eyebrow -mb-4">Danh mục</p>
      <h2 id="subjects-title">{title}</h2>
      <p className="max-w-2xl text-sm text-[var(--text-muted)]">
        Môn học lấy trực tiếp từ hệ thống quản trị. Nội dung bài học theo từng môn đang được xây
        dựng theo lộ trình.
      </p>

      {isPending && (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="status"
          aria-label="Đang tải môn học"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState message="Không tải được danh sách môn học." onRetry={() => void refetch()} />
      )}
      {data && data.length === 0 && <EmptyState title="Chưa có môn học" />}

      {data && data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.slice(0, limit).map((s, i) => {
            const hue = hueForSubject(s.slug);
            return (
              <li key={s.id}>
                <article
                  className="tone-surface card-interactive rise-in flex h-full flex-col gap-3 rounded-[var(--radius-card)] border p-4"
                  style={{
                    ["--tone-hue" as string]: String(hue),
                    animationDelay: `${Math.min(i, 8) * 45}ms`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="tone-soft flex size-16 shrink-0 items-center justify-center rounded-2xl">
                      <SubjectArt artKey={artKeyForSubject(s.slug)} hue={hue} className="size-12" />
                    </span>
                    <span className="tone-chip rounded-full px-2.5 py-1 text-[11px] font-bold">
                      Lớp 1–12
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[var(--text-strong)]">{s.nameVi}</h3>
                    {s.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                        {s.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Danh mục môn học theo Chương trình GDPT 2018.
                      </p>
                    )}
                  </div>
                  <div className="mt-auto">
                    <Badge>Đang xây dựng nội dung</Badge>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
