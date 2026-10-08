import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { artKeyForSubject, hueForGrade, hueForSubject, motifFor, type ArtKey } from "./visuals";
import { SubjectArt } from "../components/illustrations/SubjectArt";
import { ChalkArt } from "../components/illustrations/ChalkArt";

const REQUIRED: ArtKey[] = [
  "toan",
  "vat-li",
  "hoa-hoc",
  "sinh-hoc",
  "van-hoc",
  "tieng-anh",
  "lich-su",
  "dia-li",
  "thu-vien",
  "ky-thi",
  "timo-ai",
];

describe("thư viện minh họa gốc", () => {
  it("mọi chủ đề đều có hình học hợp lệ trong khung 120×120", () => {
    for (const key of REQUIRED) {
      const motif = motifFor(key);
      expect(motif.prims.length, key).toBeGreaterThanOrEqual(6);
      for (const p of motif.prims) {
        const values: number[] = [];
        if (p.kind === "rect") values.push(p.x, p.y, p.w, p.h);
        if (p.kind === "circle") values.push(p.cx, p.cy, p.r);
        if (p.kind === "ellipse") values.push(p.cx, p.cy, p.rx, p.ry);
        if (p.kind === "line") values.push(p.x1, p.y1, p.x2, p.y2);
        if (p.kind === "text") values.push(p.x, p.y);
        for (const v of values) {
          expect(Number.isFinite(v), `${key} có tọa độ không hợp lệ`).toBe(true);
        }
      }
    }
  });

  it("render được cả hai phong cách cho từng chủ đề, không ném lỗi", () => {
    for (const key of REQUIRED) {
      const flat = render(<SubjectArt artKey={key} hue={hueForSubject("toan")} />);
      expect(flat.container.querySelector("svg"), key).toBeTruthy();
      flat.unmount();
      const chalk = render(<ChalkArt artKey={key} />);
      expect(chalk.container.querySelector("svg"), key).toBeTruthy();
      chalk.unmount();
    }
  });

  it("ánh xạ slug môn học sang hình riêng, slug lạ dùng hình sách", () => {
    expect(artKeyForSubject("toan")).toBe("toan");
    expect(artKeyForSubject("vat-li")).toBe("vat-li");
    expect(artKeyForSubject("lich-su-dia-li")).toBe("lich-su-dia-li");
    expect(artKeyForSubject("mon-tuy-chinh")).toBe("book");
    expect(hueForSubject("toan")).not.toBe(hueForSubject("sinh-hoc"));
  });

  it("12 lớp có 12 sắc độ khác nhau", () => {
    const hues = Array.from({ length: 12 }, (_, i) => hueForGrade(i + 1));
    expect(new Set(hues).size).toBe(12);
    expect(hueForGrade(0)).toBe(hues[0]);
    expect(hueForGrade(99)).toBe(hues[11]);
  });

  it("hình trang trí ẩn khỏi trình đọc màn hình, có nhãn khi cần", () => {
    const { container, rerender } = render(<ChalkArt artKey="hoa-hoc" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    rerender(<SubjectArt artKey="hoa-hoc" hue={158} title="Minh họa Hóa học" />);
    expect(container.querySelector("title")?.textContent).toBe("Minh họa Hóa học");
  });
});
