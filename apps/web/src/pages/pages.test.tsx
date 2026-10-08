import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import GradePage from "./GradePage";
import AboutPage from "./AboutPage";

const GRADES = [
  { id: "g1", level: 1, slug: "lop-1", nameVi: "Lớp 1", stage: "primary" },
  { id: "g2", level: 2, slug: "lop-2", nameVi: "Lớp 2", stage: "primary" },
];

const SUBJECTS = [
  { id: "s1", slug: "toan", nameVi: "Toán học", description: null },
  { id: "s2", slug: "mon-tuy-chinh", nameVi: "Môn tùy chỉnh", description: "Mô tả ngắn" },
];

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function renderAt(path: string, element: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/lop/:slug" element={element} />
          <Route path="/thong-tin" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("trang lớp học", () => {
  it("hiển thị tên lớp, cấp học và thẻ môn học có minh họa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/public/grades")) return json({ data: GRADES });
        if (url.endsWith("/api/public/subjects")) return json({ data: SUBJECTS });
        return json({ error: { code: "not_found", message: "x" } });
      }),
    );
    renderAt("/lop/lop-1", <GradePage />);
    expect(await screen.findByRole("heading", { level: 1, name: "Lớp 1" })).toBeInTheDocument();
    expect(await screen.findByText("Toán học")).toBeInTheDocument();
    // Môn chưa có hình riêng vẫn phải render được (dùng hình sách mặc định).
    expect(screen.getByText("Môn tùy chỉnh")).toBeInTheDocument();
    expect(screen.getAllByText("Nội dung đang xây dựng").length).toBe(2);
  });

  it("báo không tìm thấy khi slug không tồn tại và vẫn có lối quay lại", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/public/grades")) return json({ data: GRADES });
        return json({ data: [] });
      }),
    );
    renderAt("/lop/lop-99", <GradePage />);
    expect(await screen.findByText("Không tìm thấy lớp học")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Về danh mục lớp học/ })).toHaveAttribute(
      "href",
      "/#lop-hoc",
    );
  });
});

describe("trang giới thiệu", () => {
  it("nêu rõ phần đang hoạt động và phần đang xây dựng, không có số liệu giả", () => {
    renderAt("/thong-tin", <AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Về TIMO" })).toBeInTheDocument();
    expect(screen.getByText("Đang hoạt động")).toBeInTheDocument();
    expect(screen.getByText("Đang xây dựng")).toBeInTheDocument();
    // Không được có phần thống kê/testimonial bịa.
    expect(document.body.textContent).not.toMatch(/\d+\s*(học sinh|giáo viên|trường)/i);
  });
});
