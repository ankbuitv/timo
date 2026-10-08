#!/usr/bin/env node
// Kiểm tra cấu hình trước khi deploy. Dừng với mã lỗi nếu còn giá trị placeholder.
// Sử dụng: node infrastructure/scripts/verify-deploy-config.mjs <staging|production>
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envName = process.argv[2];
if (!["staging", "production"].includes(envName)) {
  console.error("Usage: verify-deploy-config.mjs <staging|production>");
  process.exit(2);
}

// Parse JSONC (bỏ comment kiểu // và kiểu block, bỏ dấu phẩy thừa) mà không phá chuỗi chứa "//" như URL.
function parseJsonc(text) {
  let out = "";
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inStr) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i++;
      } else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end < 0 ? text.length : end + 1;
      continue;
    }
    out += ch;
  }
  // Bỏ dấu phẩy thừa trước } hoặc ].
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

const PLACEHOLDER_ID = "00000000-0000-0000-0000-000000000000";
const raw = readFileSync(resolve(here, "../../apps/api/wrangler.jsonc"), "utf8");
// wrangler.jsonc hỗ trợ comment; loại bỏ comment dòng trước khi parse.
const json = parseJsonc(raw);
const envConfig = envName === "production" ? json.env.production : json.env.staging;

const problems = [];
for (const db of envConfig.d1_databases ?? []) {
  if (!db.database_id || db.database_id === PLACEHOLDER_ID) {
    problems.push(`D1 "${db.database_name}" chưa có database_id thật (đang là placeholder).`);
  }
}
if (!envConfig.vars?.SUPABASE_URL) problems.push("vars.SUPABASE_URL chưa được cấu hình.");
if (!envConfig.vars?.INITIAL_ADMIN_EMAIL && envName === "production") {
  problems.push("vars.INITIAL_ADMIN_EMAIL chưa được cấu hình (cần cho bước khởi tạo quản trị).");
}
if (envName === "production" && /localhost/.test(envConfig.vars?.ALLOWED_ORIGINS ?? "")) {
  problems.push("ALLOWED_ORIGINS của production không được chứa localhost.");
}
for (const rl of envConfig.ratelimits ?? []) {
  if (!/^\d+$/.test(String(rl.namespace_id)))
    problems.push(`Rate limit "${rl.name}" có namespace_id không hợp lệ.`);
}

// Chặn cấu hình không an toàn ở staging/production.
const vars = envConfig.vars ?? {};
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(vars.SUPABASE_URL ?? "") && vars.SUPABASE_URL) {
  problems.push("vars.SUPABASE_URL phải có dạng https://<project-ref>.supabase.co");
}
if (vars.APP_ENV !== envName)
  problems.push(`vars.APP_ENV phải là "${envName}" (đang là "${vars.APP_ENV}").`);
if (!String(vars.PUBLIC_APP_URL ?? "").startsWith("https://")) {
  problems.push("vars.PUBLIC_APP_URL phải dùng https://.");
}
const origins = String(vars.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
if (origins.length === 0) problems.push("vars.ALLOWED_ORIGINS chưa có origin nào.");
if (origins.some((o) => !o.startsWith("https://"))) {
  problems.push("vars.ALLOWED_ORIGINS của staging/production chỉ được dùng https://.");
}
if (!(envConfig.ratelimits ?? []).some((r) => r.name === "SENSITIVE_RATE_LIMITER")) {
  problems.push("Thiếu rate limit binding SENSITIVE_RATE_LIMITER (API fail-closed nếu thiếu).");
}
// Manifest migration phải khớp với file trên đĩa (migration cũ không được sửa).
const manifest = spawnSync(process.execPath, [resolve(here, "migration-manifest.mjs"), "--check"], {
  encoding: "utf8",
});
if (manifest.status !== 0)
  problems.push("Manifest migration không khớp: " + (manifest.stderr || manifest.stdout).trim());

if (problems.length > 0) {
  console.error(`✖ Cấu hình ${envName} chưa sẵn sàng để deploy:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✔ Cấu hình ${envName} hợp lệ (không còn placeholder).`);
