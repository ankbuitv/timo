import { EmptyState } from "../ui";

/**
 * Khóa học nổi bật. Hiện chưa có khóa học nào được xuất bản (module Khóa học thuộc Giai đoạn 3),
 * nên hiển thị trạng thái rỗng trung thực thay vì dữ liệu giả.
 */
export function FeaturedCoursesSection({ title, note }: { title: string; note?: string }) {
  return (
    <section aria-labelledby="featured-title" className="space-y-5">
      <h2 id="featured-title" className="text-2xl sm:text-3xl">
        {title}
      </h2>
      <EmptyState
        title="Khóa học đang được xây dựng"
        description={note ?? "Các khóa học sẽ xuất hiện tại đây khi được quản trị viên xuất bản."}
      />
    </section>
  );
}
