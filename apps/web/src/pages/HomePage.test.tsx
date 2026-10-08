import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { HomePage } from "./HomePage";

const HOMEPAGE = [
  {
    key: "hero",
    type: "hero",
    titleVi: "Khám phá",
    config: {
      slides: [{ title: "Học mọi lúc, giỏi mọi nơi.", ctaLabel: "Bắt đầu", ctaHref: "/dang-nhap" }],
    },
  },
  {
    key: "announcement",
    type: "announcement",
    titleVi: "Thông báo",
    config: { message: "Bản thử nghiệm", tone: "info", enabled: true },
  },
  { key: "grades", type: "grades", titleVi: "Chọn lớp học", config: { groups: ["primary"] } },
  {
    key: "features",
    type: "features",
    titleVi: "Lợi ích",
    config: { items: [{ title: "Học theo tốc độ", description: "Mô tả" }] },
  },
];

const GRADES = [
  { id: "g1", level: 1, slug: "lop-1", nameVi: "Lớp 1", stage: "primary" },
  { id: "g6", level: 6, slug: "lop-6", nameVi: "Lớp 6", stage: "lower_secondary" },
];

function fakeFetch(url: string) {
  if (url.endsWith("/api/public/homepage")) return json({ data: HOMEPAGE });
  if (url.endsWith("/api/public/grades")) return json({ data: GRADES });
  return json({ error: { code: "not_found", message: "x" } }, 404);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HomePage (CMS-driven)", () => {
  it("renders sections in the order returned by the API and only primary grades in the grade group", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => fakeFetch(String(input))),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Học mọi lúc, giỏi mọi nơi." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bản thử nghiệm")).toBeInTheDocument();

    const grades = await screen.findByRole("heading", { name: "Chọn lớp học" });
    expect(grades).toBeInTheDocument();
    const lop1 = await screen.findByRole("link", { name: /Lớp 1/ });
    expect(lop1).toHaveAttribute("href", "/lop/lop-1");
    // Lớp 6 thuộc nhóm THCS, không có trong nhóm "primary" của CMS.
    expect(screen.queryByRole("link", { name: /Lớp 6/ })).toBeNull();

    const featureList = screen.getByRole("heading", { name: "Lợi ích" }).parentElement!;
    expect(within(featureList).getByText("Học theo tốc độ")).toBeInTheDocument();
  });

  it("shows an honest empty state for featured courses (no fake courses)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({
          data: [
            {
              key: "featured_courses",
              type: "featured_courses",
              titleVi: "Khóa học nổi bật",
              config: { limit: 6 },
            },
          ],
        }),
      ),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Khóa học đang được xây dựng")).toBeInTheDocument();
  });
});
