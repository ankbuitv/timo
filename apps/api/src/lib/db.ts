import { drizzle } from "drizzle-orm/d1";
import * as schema from "@timo/database/schema";
import type { Env } from "../env.js";

export function createDb(env: Pick<Env, "DB">) {
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof createDb>;

export function newId(): string {
  return crypto.randomUUID();
}

export function now(): number {
  return Date.now();
}
