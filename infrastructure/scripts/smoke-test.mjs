#!/usr/bin/env node
// Smoke test HTTP thật (không mock) cho API và (tùy chọn) web.
// Sử dụng: API_BASE=https://<host> [WEB_BASE=https://<host>] node infrastructure/scripts/smoke-test.mjs
// Không gửi thông tin đăng nhập. Không ghi dữ liệu. Thoát mã 1 nếu có kiểm tra thất bại.
const API = (process.env.API_BASE ?? "http://localhost:8787").replace(/\/+$/, "");
const WEB = process.env.WEB_BASE?.replace(/\/+$/, "");

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✔ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err: String(err.message ?? err) });
    console.log(`✖ ${name}: ${err.message ?? err}`);
  }
}
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

await check("API health trả status ok và header bảo mật", async () => {
  const res = await fetch(`${API}/api/health`);
  expect(res.status === 200, `HTTP ${res.status}`);
  const body = await res.json();
  expect(body.status === "ok", "status không phải ok");
  expect(res.headers.get("x-content-type-options") === "nosniff", "thiếu X-Content-Type-Options");
  expect(res.headers.get("x-frame-options") === "DENY", "thiếu X-Frame-Options");
});

await check("Danh sách lớp công khai có 12 lớp", async () => {
  const res = await fetch(`${API}/api/public/grades`);
  expect(res.status === 200, `HTTP ${res.status}`);
  const body = await res.json();
  expect(Array.isArray(body.data) && body.data.length === 12, `số lớp = ${body.data?.length}`);
});

await check("Trạng thái khởi tạo công khai không lộ bí mật", async () => {
  const res = await fetch(`${API}/api/setup/status`);
  expect(res.status === 200, `HTTP ${res.status}`);
  const text = await res.text();
  expect(typeof JSON.parse(text).data.initialized === "boolean", "thiếu trường initialized");
  expect(!/SETUP_SECRET|service_role|OLLAMA/i.test(text), "phản hồi chứa từ khóa nhạy cảm");
});

await check("Endpoint quản trị từ chối khi không có token", async () => {
  const res = await fetch(`${API}/api/admin/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  expect(res.status === 401, `HTTP ${res.status} (kỳ vọng 401)`);
});

await check("Bootstrap từ chối khi không có token", async () => {
  const res = await fetch(`${API}/api/setup/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  expect(res.status === 401, `HTTP ${res.status} (kỳ vọng 401)`);
});

await check("Route không tồn tại trả JSON 404", async () => {
  const res = await fetch(`${API}/api/khong-ton-tai`);
  expect(res.status === 404, `HTTP ${res.status}`);
  expect((await res.json()).error?.code === "not_found", "thiếu error.code");
});

await check("Origin không được phép bị từ chối khi ghi dữ liệu", async () => {
  const res = await fetch(`${API}/api/admin/subjects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://evil.example",
      Authorization: "Bearer x",
    },
    body: "{}",
  });
  expect(res.status === 403 || res.status === 401, `HTTP ${res.status}`);
});

if (WEB) {
  await check("Trang web trả HTML và có tiêu đề TIMO", async () => {
    const res = await fetch(WEB, { redirect: "follow" });
    expect(res.status === 200, `HTTP ${res.status}`);
    expect((await res.text()).includes("TIMO"), "không thấy chữ TIMO");
  });
}

const failed = results.filter((r) => !r.ok).length;
console.log(
  `\nKết quả: ${results.length - failed}/${results.length} đạt (API=${API}${WEB ? `, WEB=${WEB}` : ""})`,
);
process.exit(failed ? 1 : 0);
