import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shim tối giản của Cloudflare D1 trên node:sqlite (chỉ dùng cho kiểm thử).
 * Hành vi bám sát API D1: prepare/bind/all/first/run/raw/batch.
 * Các migration được đọc trực tiếp từ packages/database/migrations (không sao chép).
 */

type Row = Record<string, unknown>;

function toSql(v: unknown): SQLInputValue {
  if (v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v as SQLInputValue;
}

class FakeStatement {
  constructor(
    private readonly db: DatabaseSync,
    readonly sqlText: string,
    readonly params: SQLInputValue[] = [],
  ) {}

  bind(...values: unknown[]): FakeStatement {
    return new FakeStatement(this.db, this.sqlText, values.map(toSql));
  }

  private stmt() {
    return this.db.prepare(this.sqlText);
  }

  async all<T = Row>() {
    const rows = this.stmt().all(...this.params) as T[];
    return { results: rows, success: true, meta: meta(0) };
  }

  async first<T = Row>(column?: string) {
    const row = this.stmt().get(...this.params) as Row | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async run() {
    const info = this.stmt().run(...this.params);
    return {
      results: [],
      success: true,
      meta: meta(Number(info.changes), Number(info.lastInsertRowid)),
    };
  }

  async raw<T = unknown[]>(options?: { columnNames?: boolean }) {
    const st = this.stmt();
    st.setReturnArrays(true);
    const rows = st.all(...this.params) as unknown as T[];
    if (options?.columnNames) {
      const cols = st.columns().map((c) => c.name);
      return [cols, ...rows] as unknown as T[];
    }
    return rows;
  }
}

function meta(changes: number, lastRowId = 0) {
  return {
    changes,
    last_row_id: lastRowId,
    duration: 0,
    rows_read: 0,
    rows_written: changes,
    served_by: "test",
  };
}

export class FakeD1 {
  readonly sqlite: DatabaseSync;

  constructor() {
    this.sqlite = new DatabaseSync(":memory:");
    this.sqlite.exec("PRAGMA foreign_keys = ON;");
  }

  prepare(sql: string): FakeStatement {
    return new FakeStatement(this.sqlite, sql);
  }

  async batch(statements: FakeStatement[]) {
    this.sqlite.exec("BEGIN");
    try {
      const out = [];
      for (const st of statements) {
        const r = this.sqlite.prepare(st.sqlText).run(...st.params);
        out.push({ results: [], success: true, meta: meta(Number(r.changes)) });
      }
      this.sqlite.exec("COMMIT");
      return out;
    } catch (err) {
      this.sqlite.exec("ROLLBACK");
      throw err;
    }
  }

  async exec(sql: string) {
    this.sqlite.exec(sql);
    return { count: 1, duration: 0 };
  }

  /** CHỈ DÙNG TRONG KIỂM THỬ: đọc thẳng vài cột để chứng minh không lưu bản rõ. */
  rawRowsForTest(sql: string, params: SQLInputValue[] = []): Row[] {
    return this.sqlite.prepare(sql).all(...params) as Row[];
  }
}

const here = dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = resolve(here, "../../../../packages/database/migrations");

/** Áp dụng toàn bộ migration .sql theo thứ tự tên file (giống wrangler d1 migrations apply). */
export function applyMigrations(db: FakeD1, dir = MIGRATIONS_DIR): number {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) db.sqlite.exec(trimmed);
    }
  }
  return files.length;
}
