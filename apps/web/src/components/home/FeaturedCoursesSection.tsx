import { Link } from "react-router";
import { Button } from "../ui";
import { ChalkArt } from "../illustrations/ChalkArt";

/**
 * Khóa học nổi bật. Module Khóa học thuộc Giai đoạn 3 và chưa có dữ liệu, nên khối này hiển thị
 * trạng thái rỗng trung thực kèm minh họa phấn – không bịa khóa học hay số liệu.
 */
export function FeaturedCoursesSection({ title, note }: { title: string; note?: string }) {
  return (
    <section aria-labelledby="featured-title" className="space-y-6">
      <div>
        <p className="text-eyebrow">Sắp ra mắt</p>
        <h2 id="featured-title" className="mt-1.5">
          {title}
        </h2>
      </div>
      <div className="surface-card grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[16rem_minmax(0,1fr)]">
        <ChalkArt artKey="book" className="mx-auto w-full max-w-[16rem]" />
        <div>
          <h3 className="text-h3">Khóa học đang được xây dựng</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            {note ?? "Các khóa học sẽ xuất hiện tại đây khi được quản trị viên xuất bản."}
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Trong lúc chờ, bạn có thể xem danh mục lớp học và môn học đã hoạt động.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/#lop-hoc">
              <Button variant="outline" size="sm">
                Xem lớp học
              </Button>
            </Link>
            <Link to="/#mon-hoc">
              <Button variant="ghost" size="sm">
                Xem môn học
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
