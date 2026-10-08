import { Link } from "react-router";
import { ArrowRight, BookMarked, GraduationCap, Info, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { SubjectArt } from "../illustrations/SubjectArt";
import type { ArtKey } from "../../lib/visuals";

interface QuickLink {
  label: string;
  description: string;
  href: string;
  hue: number;
  artKey: ArtKey;
  external?: boolean;
}

/**
 * Lối vào nhanh. Mọi mục đều trỏ tới trang/khối ĐÃ tồn tại (không có liên kết chết).
 */
const LINKS: QuickLink[] = [
  {
    label: "Chọn lớp học",
    description: "Lớp 1–12 theo ba cấp học của Chương trình GDPT 2018",
    href: "/#lop-hoc",
    hue: 232,
    artKey: "thu-vien",
  },
  {
    label: "Xem môn học",
    description: "Danh mục môn học đang có trong hệ thống",
    href: "/#mon-hoc",
    hue: 168,
    artKey: "book",
  },
  {
    label: "Tạo tài khoản",
    description: "Đăng nhập hoặc đăng ký bằng email, Google, Facebook, Microsoft",
    href: "/dang-nhap",
    hue: 26,
    artKey: "ky-thi",
  },
  {
    label: "Giới thiệu TIMO",
    description: "Định hướng, phạm vi và trạng thái hiện tại của nền tảng",
    href: "/thong-tin",
    hue: 268,
    artKey: "timo-ai",
  },
];

export function QuickStartSection() {
  return (
    <section aria-labelledby="quickstart-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow">Bắt đầu</p>
          <h2 id="quickstart-title" className="mt-1.5">
            Đi tới nội dung bạn cần
          </h2>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LINKS.map((link, i) => (
          <li key={link.label}>
            <Link
              to={link.href}
              className={cn(
                "tone-surface card-interactive rise-in group flex h-full flex-col gap-4 rounded-[var(--radius-card)] border p-5",
              )}
              style={{
                ["--tone-hue" as string]: String(link.hue),
                animationDelay: `${i * 60}ms`,
              }}
            >
              <span className="tone-soft flex size-14 items-center justify-center rounded-2xl">
                <SubjectArt artKey={link.artKey} hue={link.hue} className="size-11" />
              </span>
              <span className="block">
                <span className="flex items-center gap-1.5 text-base font-bold text-[var(--text-strong)]">
                  {link.label}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 block text-sm text-[var(--text-muted)]">
                  {link.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {/* Nhắc rõ các mục chưa triển khai để không gây hiểu nhầm. */}
      <p className="text-sm text-[var(--text-muted)]">
        Khóa học, bài tập, thư viện số, kho đề thi và trợ lý AI đang được xây dựng theo lộ trình;
        các mục chưa có module sẽ hiển thị trạng thái thay vì nội dung giả.
      </p>
    </section>
  );
}

interface RoadmapItem {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "done" | "partial" | "planned";
}

/**
 * Lộ trình hiển thị trên trang chủ. Nội dung phản ánh đúng docs/ROADMAP.md tại thời điểm này:
 * nền tảng và trang chủ/CMS/lớp/môn đã hoạt động, các giai đoạn sau chưa bắt đầu.
 */
const ROADMAP: RoadmapItem[] = [
  {
    icon: GraduationCap,
    title: "Nền tảng & danh mục",
    description: "Monorepo, xác thực, phân quyền, lớp học 1–12, môn học, CMS trang chủ.",
    status: "done",
  },
  {
    icon: BookMarked,
    title: "Khóa học & bài học",
    description: "Khóa học, bài giảng, video, tiến độ học tập. Thuộc giai đoạn tiếp theo.",
    status: "planned",
  },
  {
    icon: Info,
    title: "Bài tập, thư viện, cộng đồng",
    description: "Ngân hàng câu hỏi, thi thử, thư viện số, blog và trợ lý AI.",
    status: "planned",
  },
];

const STATUS_LABEL: Record<RoadmapItem["status"], string> = {
  done: "Đã hoạt động",
  partial: "Một phần",
  planned: "Chưa bắt đầu",
};

export function RoadmapSection() {
  return (
    <section aria-labelledby="roadmap-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow">Minh bạch</p>
          <h2 id="roadmap-title" className="mt-1.5">
            TIMO đang ở đâu trên lộ trình
          </h2>
        </div>
        <Link
          to="/thong-tin"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-200"
        >
          Đọc giới thiệu chi tiết
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {ROADMAP.map((item, i) => (
          <li key={item.title} className="surface-card flex h-full flex-col gap-3 p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-brand-600 dark:text-brand-200">
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="text-base font-bold text-[var(--text-strong)]">{item.title}</h3>
            <p className="text-sm text-[var(--text-muted)]">{item.description}</p>
            <p className="mt-auto">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  item.status === "done"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100"
                    : "bg-[var(--surface-muted)] text-[var(--text-muted)]",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    item.status === "done" ? "bg-emerald-500" : "bg-slate-400",
                  )}
                  aria-hidden="true"
                />
                {STATUS_LABEL[item.status]}
              </span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
