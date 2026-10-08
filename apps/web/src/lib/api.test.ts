import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiRequestError } from "./api";
import { describeError } from "./admin-api";

function mockFetch(status: number, body: unknown) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
}

describe("apiRequest", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("unwraps the success envelope", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { data: [{ id: "1" }] }));
    const res = await apiRequest<{ id: string }[]>("/public/grades", { auth: false });
    expect(res.data).toEqual([{ id: "1" }]);
  });

  it("maps server error envelopes to ApiRequestError with Vietnamese message", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(403, {
        error: { code: "forbidden", message: "Bạn không có quyền thực hiện thao tác này" },
      }),
    );
    const err = await apiRequest("/admin/grades").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect((err as ApiRequestError).status).toBe(403);
    expect((err as ApiRequestError).message).toContain("quyền");
  });

  it("reports network failures without leaking internals", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(apiRequest("/public/grades", { auth: false })).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it("sends JSON body with correct content type", async () => {
    const fetchMock = mockFetch(200, { data: { ok: true } });
    vi.stubGlobal("fetch", fetchMock);
    await apiRequest("/admin/subjects", { method: "POST", body: { slug: "a-b" }, auth: false });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ slug: "a-b" }));
    expect(init.credentials).toBe("omit");
  });
});

describe("describeError", () => {
  it("shows the first field-level validation message", () => {
    const err = new ApiRequestError("Dữ liệu không hợp lệ", 422, "validation_failed", [
      { path: "stage", message: "Lớp 3 thuộc cấp Tiểu học" },
    ]);
    expect(describeError(err)).toBe("stage: Lớp 3 thuộc cấp Tiểu học");
  });
});
