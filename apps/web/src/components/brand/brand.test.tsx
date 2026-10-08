import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimoMark } from "./TimoMark";
import { LearningScene } from "../illustrations/LearningScene";
import { TimoLogo } from "../layout/Logo";
import { MemoryRouter } from "react-router";

describe("nhận diện TIMO", () => {
  it("biểu trưng là ảnh trang trí khi không có tiêu đề, và có nhãn khi cần", () => {
    const { container, rerender } = render(<TimoMark className="size-9" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");

    rerender(<TimoMark title="Biểu trưng TIMO" />);
    expect(screen.getByRole("img", { name: "Biểu trưng TIMO" })).toBeTruthy();
  });

  it("minh họa trang chủ ẩn khỏi trình đọc màn hình", () => {
    const { container } = render(<LearningScene className="w-full" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("logo có nhãn liên kết về trang chủ và hiển thị khẩu hiệu", () => {
    render(
      <MemoryRouter>
        <TimoLogo />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "TIMO – Trang chủ" })).toBeTruthy();
    expect(screen.getByText("Học mọi lúc, giỏi mọi nơi")).toBeTruthy();
  });
});
