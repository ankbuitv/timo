import { Link } from "react-router";
import { Card, PageHeader } from "../components/ui";
import { usePageMeta } from "../lib/seo";
import { config } from "../lib/config";
import { TIMO_BRAND, DEFAULT_CURRICULUM } from "@timo/shared";

export default function AboutPage() {
  usePageMeta({ title: "Thông tin – TIMO", description: "Giới thiệu nền tảng học tập TIMO." });
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader title="Về TIMO" description={TIMO_BRAND.sloganVi} />
      <Card className="space-y-4 text-sm leading-relaxed">
        <p>
          TIMO là nền tảng học tập dành cho học sinh K12 Việt Nam (lớp 1 đến lớp 12), giáo viên, phụ
          huynh và nhà trường. TIMO định hướng theo <strong>{DEFAULT_CURRICULUM.nameVi}</strong> với
          tinh thần <em>{DEFAULT_CURRICULUM.publisherSeriesVi}</em>.
        </p>
        <p>
          Phiên bản hiện tại là <strong>phiên bản nền tảng thử nghiệm</strong>: cấu trúc lớp học,
          môn học, trang chủ và khu vực quản trị đã hoạt động. Khóa học, bài tập, thi thử, thư viện
          số và trợ lý AI đang được phát triển theo lộ trình công khai trong tài liệu dự án.
        </p>
        <p>
          Trạng thái vận hành và sự cố sẽ được công bố tại trang trạng thái hệ thống
          {config.statusUrl ? (
            <>
              :{" "}
              <a
                className="font-semibold text-brand-600 dark:text-brand-200"
                href={config.statusUrl}
                rel="noopener noreferrer"
              >
                {config.statusUrl}
              </a>
            </>
          ) : (
            " (chưa cấu hình)."
          )}
        </p>
      </Card>
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <Link className="text-brand-600 dark:text-brand-200" to="/">
          ← Trang chủ
        </Link>
        {config.supportUrl && (
          <a
            className="text-brand-600 dark:text-brand-200"
            href={config.supportUrl}
            rel="noopener noreferrer"
          >
            Trung tâm hỗ trợ
          </a>
        )}
      </div>
    </div>
  );
}
