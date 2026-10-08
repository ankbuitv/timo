#!/usr/bin/env node
// Kiểm tra cấu hình trước khi deploy. Dừng với mã lỗi nếu còn giá trị placeholder.
// Sử dụng: node infrastructure/scripts/verify-deploy-config.mjs <staging|production>
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envName = process.argv[2];
if (!["staging", "production"].includes(envName)) {
  console.error("Usage: verify-deploy-config.mjs <staging|production>");
  process.exit(2);
}

const PLACEHOLDER_ID = "00000000-0000-0000-0000-000000000000";
const raw = readFileSync(resolve(here, "../../apps/api/wrangler.jsonc"), "utf8");
// wrangler.jsonc hỗ trợ comment; loại bỏ comment dòng trước khi parse.
const json = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ""));
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

if (problems.length > 0) {
  console.error(`✖ Cấu hình ${envName} chưa sẵn sàng để deploy:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✔ Cấu hình ${envName} hợp lệ (không còn placeholder).`);
