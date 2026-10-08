import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  GraduationCap,
  Info,
  Library,
  Layers,
  MessageCircleQuestion,
  Newspaper,
  Sparkles,
  Swords,
} from "lucide-react";

export interface NavItem {
  label: string;
  /** Có đường dẫn khi tính năng đã triển khai; không có = "Sắp ra mắt" (không phải liên kết chết). */
  href?: string;
  icon: LucideIcon;
}

/** Điều hướng công khai theo yêu cầu sản phẩm. Mục chưa có trang được đánh dấu rõ ràng. */
export const PUBLIC_NAV: NavItem[] = [
  { label: "Học bài", href: "/#lop-hoc", icon: BookOpen },
  { label: "Khóa học", icon: GraduationCap },
  { label: "Kho đề", icon: Layers },
  { label: "Thi đấu", icon: Swords },
  { label: "Hỏi đáp", icon: MessageCircleQuestion },
  { label: "Blog", icon: Newspaper },
  { label: "Thư viện số", icon: Library },
  { label: "TIMO AI", icon: Sparkles },
  { label: "Thông tin", href: "/thong-tin", icon: Info },
];

/** Tab điều hướng di động (thiết kế riêng, không thu nhỏ menu desktop). */
export const MOBILE_TABS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Trang chủ", href: "/", icon: BookOpen },
  { label: "Lớp học", href: "/#lop-hoc", icon: GraduationCap },
  { label: "Thông tin", href: "/thong-tin", icon: Info },
];
