import { describe, expect, it } from "vitest";
import {
  gradeCreateSchema,
  homepageReorderSchema,
  homepageSectionUpdateSchema,
  safeHrefSchema,
  sectionConfigSchemas,
  slugSchema,
  subjectCreateSchema,
} from "../src/index.js";

describe("gradeCreateSchema", () => {
  it("accepts a valid lower-secondary grade", () => {
    const r = gradeCreateSchema.safeParse({
      level: 7,
      slug: "lop-7",
      nameVi: "Lớp 7",
      stage: "lower_secondary",
    });
    expect(r.success).toBe(true);
  });

  it("rejects grades outside 1–12", () => {
    const r = gradeCreateSchema.safeParse({
      level: 13,
      slug: "lop-13",
      nameVi: "Lớp 13",
      stage: "upper_secondary",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a stage that does not match the grade level", () => {
    const r = gradeCreateSchema.safeParse({
      level: 3,
      slug: "lop-3",
      nameVi: "Lớp 3",
      stage: "upper_secondary",
    });
    expect(r.success).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    const r = gradeCreateSchema.safeParse({
      level: 1,
      slug: "lop-1",
      nameVi: "Lớp 1",
      stage: "primary",
      role: "admin",
    });
    expect(r.success).toBe(false);
  });
});

describe("slugSchema", () => {
  it("accepts ascii slugs", () => {
    expect(slugSchema.safeParse("toan-hoc-10").success).toBe(true);
  });
  it("rejects uppercase, spaces and Vietnamese diacritics", () => {
    expect(slugSchema.safeParse("Toán Học").success).toBe(false);
    expect(slugSchema.safeParse("toán-học").success).toBe(false);
    expect(slugSchema.safeParse("a--b").success).toBe(false);
  });
});

describe("subjectCreateSchema", () => {
  it("keeps Vietnamese names intact", () => {
    const r = subjectCreateSchema.parse({ slug: "tin-hoc", nameVi: "  Tin học  " });
    expect(r.nameVi).toBe("Tin học");
  });
  it("rejects control characters", () => {
    expect(subjectCreateSchema.safeParse({ slug: "x1", nameVi: "Toán\u0007" }).success).toBe(false);
  });
});

describe("safeHrefSchema", () => {
  it.each(["/hoc-bai", "https://timovn.dpdns.org/x"])("accepts %s", (href) => {
    expect(safeHrefSchema.safeParse(href).success).toBe(true);
  });
  it.each([
    "javascript:alert(1)",
    "//evil.example",
    "data:text/html,hi",
    "http://insecure.example",
    "ftp://x",
  ])("rejects %s", (href) => {
    expect(safeHrefSchema.safeParse(href).success).toBe(false);
  });
});

describe("section configs", () => {
  it("rejects unsafe hero CTA links", () => {
    const r = sectionConfigSchemas.hero.safeParse({
      slides: [{ title: "x", ctaHref: "javascript:alert(1)" }],
    });
    expect(r.success).toBe(false);
  });
  it("rejects extra keys (e.g. injected scripts)", () => {
    const r = sectionConfigSchemas.announcement.safeParse({
      message: "hi",
      script: "<script>alert(1)</script>",
    });
    expect(r.success).toBe(false);
  });
});

describe("homepage update schemas", () => {
  it("requires at least one field", () => {
    expect(homepageSectionUpdateSchema.safeParse({}).success).toBe(false);
  });
  it("rejects duplicate ids on reorder", () => {
    expect(homepageReorderSchema.safeParse({ order: ["a", "a"] }).success).toBe(false);
    expect(homepageReorderSchema.safeParse({ order: ["a", "b"] }).success).toBe(true);
  });
});
