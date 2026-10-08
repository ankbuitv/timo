/**
 * Cấu trúc giáo dục K12 Việt Nam.
 * Cấp học: Tiểu học (1–5), THCS (6–9), THPT (10–12).
 */
export const EDUCATION_STAGES = [
  { key: "primary", nameVi: "Tiểu học", minGrade: 1, maxGrade: 5 },
  { key: "lower_secondary", nameVi: "Trung học cơ sở", minGrade: 6, maxGrade: 9 },
  { key: "upper_secondary", nameVi: "Trung học phổ thông", minGrade: 10, maxGrade: 12 },
] as const;

export type EducationStageKey = (typeof EDUCATION_STAGES)[number]["key"];

export function stageForGrade(grade: number): EducationStageKey | null {
  const stage = EDUCATION_STAGES.find((s) => grade >= s.minGrade && grade <= s.maxGrade);
  return stage ? stage.key : null;
}

/** Môn học mặc định (có thể thêm/sửa bởi quản trị viên). */
export const DEFAULT_SUBJECTS = [
  { slug: "toan", nameVi: "Toán học" },
  { slug: "tieng-viet", nameVi: "Tiếng Việt" },
  { slug: "van-hoc", nameVi: "Ngữ văn" },
  { slug: "tieng-anh", nameVi: "Tiếng Anh" },
  { slug: "vat-li", nameVi: "Vật lí" },
  { slug: "hoa-hoc", nameVi: "Hóa học" },
  { slug: "sinh-hoc", nameVi: "Sinh học" },
  { slug: "lich-su", nameVi: "Lịch sử" },
  { slug: "dia-li", nameVi: "Địa lí" },
  { slug: "tin-hoc", nameVi: "Tin học" },
  { slug: "cong-nghe", nameVi: "Công nghệ" },
  { slug: "gdcd", nameVi: "Giáo dục công dân" },
  { slug: "khtn", nameVi: "Khoa học tự nhiên" },
  { slug: "lich-su-dia-li", nameVi: "Lịch sử và Địa lí" },
] as const;

/** Chương trình giáo dục phổ thông 2018 – định danh mặc định. */
export const DEFAULT_CURRICULUM = {
  key: "gdpt-2018",
  nameVi: "Chương trình GDPT 2018",
  publisherSeriesVi: "Kết nối tri thức với cuộc sống",
} as const;
