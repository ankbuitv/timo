#!/usr/bin/env node
// Manifest SHA-256 cho migration D1. Mỗi migration đã áp dụng lên môi trường thật là bất biến:
// nếu ai sửa file cũ, CI sẽ fail. Sử dụng:
//   node infrastructure/scripts/migration-manifest.mjs --write   (tạo/cập nhật manifest, khi THÊM migration mới)
//   node infrastructure/scripts/migration-manifest.mjs --check   (CI và trước khi migrate remote)
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, "../../packages/database/migrations");
const manifestPath = join(dir, "MANIFEST.sha256");
const mode = process.argv[2];

const files = readdirSync(dir)
  .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f))
  .sort();
const current = files.map((f) => {
  const hash = createHash("sha256")
    .update(readFileSync(join(dir, f)))
    .digest("hex");
  return `${hash}  ${f}`;
});
const body = `# SHA-256 của migration D1. KHÔNG sửa migration đã áp dụng; thêm file mới và chạy --write.\n${current.join("\n")}\n`;

if (mode === "--write") {
  writeFileSync(manifestPath, body);
  console.log(`✔ Đã ghi ${files.length} migration vào MANIFEST.sha256`);
  process.exit(0);
}

if (mode !== "--check") {
  console.error("Usage: migration-manifest.mjs --write | --check");
  process.exit(2);
}
if (!existsSync(manifestPath)) {
  console.error("✖ Thiếu MANIFEST.sha256. Chạy --write và commit kết quả.");
  process.exit(1);
}
const recorded = readFileSync(manifestPath, "utf8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"));
const problems = [];
const recordedSet = new Set(recorded);
for (const line of current)
  if (!recordedSet.has(line))
    problems.push(`Không khớp hoặc chưa ghi nhận: ${line.split("  ")[1]}`);
const currentSet = new Set(current);
for (const line of recorded)
  if (!currentSet.has(line))
    problems.push(`Migration đã ghi nhận bị xóa/sửa: ${line.split("  ")[1]}`);
if (problems.length) {
  console.error("✖ Manifest migration không khớp:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✔ Manifest migration khớp (${files.length} file)`);
