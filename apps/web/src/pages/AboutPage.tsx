import { Link } from "react-router";
import { BookOpenCheck, CheckCircle2, CircleDashed, Mail, Target } from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { usePageMeta } from "../lib/seo";
import { config } from "../lib/config";
import { TIMO_BRAND, DEFAULT_CURRICULUM } from "@timo/shared";
import { SubjectArt } from "../components/illustrations/SubjectArt";
import { ChalkArt } from "../components/illustrations/ChalkArt";

/** Trạng thái hiển thị trên trang giới thiệu – phản ánh đúng những gì đã hoạt động. */
const AVAILABLE = [
  "Danh mục lớp 1–12 theo ba cấp học của Chương trình GDPT 2018",
  "Danh mục môn học và môn học tùy chỉnh do quản trị viên thêm",
  "Đăng nhập, đăng ký và phân quyền theo vai trò (học sinh, giáo viên, quản trị…)",
  "Khu vực quản trị: người dùng, lớp, môn, trang chủ (CMS) và nhật ký hoạt động",
];

const IN_PROGRESS = [
  "Khóa học, bài giảng, video và tiến độ học tập (giai đoạn tiếp theo)",
  "Ngân hàng câu hỏi, bài tập và thi thử",
  "Thư viện số, blog, cộng đồng và trợ lý học tập TIMO AI",
];

export default function AboutPage() {
  usePageMeta({
    title: "Giới thiệu – TIMO",
    description: "Định hướng, phạm vi và trạng thái hiện tại của nền tảng học tập TIMO.",
  });
  return (
    <div className="section-shell section-stack">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
        <div>
          <PageHeader
            eyebrow="Giới thiệu"
            title="Về TIMO"
            description={`${TIMO_BRAND.sloganVi} ${TIMO_BRAND.sloganEn}`}
          />
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[var(--text-body)] sm:text-base">
            TIMO là nền tảng học tập dành cho học sinh K12 Việt Nam (lớp 1 đến lớp 12), giáo viên,
            phụ huynh và nhà trường. TIMO định hướng theo{" "}
            <strong>{DEFAULT_CURRICULUM.nameVi}</strong> với tinh thần{" "}
            <em>{DEFAULT_CURRICULUM.publisherSeriesVi}</em>.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-body)] sm:text-base">
            Phiên bản hiện tại là <strong>bản thử nghiệm nền tảng</strong>. TIMO không hiển thị số
            liệu hay nội dung mẫu: mục nào chưa có module sẽ ghi rõ trạng thái thay vì dựng nội dung
            giả.
          </p>
        </div>
        <div className="chalkboard chalkboard-grid mx-auto w-full max-w-xs p-4">
          <ChalkArt artKey="timo-ai" board={false} />
          <p className="mt-2 text-center text-xs font-semibold text-white/80">
            Trợ lý học tập TIMO AI – giai đoạn 6
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="size-5 text-emerald-500" aria-hidden="true" />
            Đang hoạt động
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-body)]">
            {AVAILABLE.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <BookOpenCheck
                  className="mt-0.5 size-4 shrink-0 text-brand-500"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg">
            <CircleDashed className="size-5 text-[var(--text-muted)]" aria-hidden="true" />
            Đang xây dựng
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-body)]">
            {IN_PROGRESS.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CircleDashed
                  className="mt-0.5 size-4 shrink-0 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--text-muted)]">
            Lộ trình chi tiết theo từng giai đoạn có trong tài liệu dự án (
            <code>docs/ROADMAP.md</code>
            ).
          </p>
        </Card>
      </div>

      <Card className="space-y-5">
        <h2 className="flex items-center gap-2 text-lg">
          <Target className="size-5 text-brand-500" aria-hidden="true" />
          Nguyên tắc xây dựng
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              artKey: "book" as const,
              hue: 232,
              title: "Học liệu theo chương trình",
              text: "Bám Chương trình GDPT 2018, không sao chép nội dung hay thương hiệu của nền tảng khác.",
            },
            {
              artKey: "ky-thi" as const,
              hue: 168,
              title: "Minh bạch trạng thái",
              text: "Không có nút giả, không dữ liệu mẫu. Mục chưa làm được ghi rõ là chưa làm.",
            },
            {
              artKey: "gdcd" as const,
              hue: 316,
              title: "An toàn cho trẻ em",
              text: "Tối thiểu dữ liệu cá nhân, phân quyền chặt, khóa bí mật mã hóa và không lộ ra trình duyệt.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="tone-surface rounded-2xl border p-4"
              style={{ ["--tone-hue" as string]: String(item.hue) }}
            >
              <span className="tone-soft mb-3 flex size-14 items-center justify-center rounded-2xl">
                <SubjectArt artKey={item.artKey} hue={item.hue} className="size-11" />
              </span>
              <h3 className="text-base font-bold text-[var(--text-strong)]">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-[var(--text-strong)]">Liên hệ và hỗ trợ</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {config.statusUrl ? (
              <>
                Trạng thái vận hành được công bố tại{" "}
                <a
                  className="font-semibold text-brand-600 dark:text-brand-200"
                  href={config.statusUrl}
                  rel="noopener noreferrer"
                >
                  {config.statusUrl}
                </a>
                .
              </>
            ) : (
              "Trang trạng thái hệ thống chưa được cấu hình cho môi trường này."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {config.supportUrl && (
            <a href={config.supportUrl} rel="noopener noreferrer">
              <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border-strong)] px-4 text-sm font-semibold text-[var(--text-strong)] hover:bg-[var(--surface-muted)]">
                Trung tâm hỗ trợ
              </span>
            </a>
          )}
          {config.supportEmail && (
            <a href={`mailto:${config.supportEmail}`}>
              <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border-strong)] px-4 text-sm font-semibold text-[var(--text-strong)] hover:bg-[var(--surface-muted)]">
                <Mail className="size-4" aria-hidden="true" />
                Gửi email
              </span>
            </a>
          )}
          <Link
            to="/#lop-hoc"
            className="inline-flex h-11 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Khám phá lớp học
          </Link>
        </div>
      </Card>
    </div>
  );
}
