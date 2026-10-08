import * as s from "@timo/database/schema";
import type { Db } from "./db.js";
import { newId, now } from "./db.js";

export interface AuditEntry {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/** Ghi nhật ký kiểm toán. Metadata được lọc để không chứa bí mật. */
export async function writeAudit(db: Db, entry: AuditEntry): Promise<void> {
  await db.insert(s.auditLogs).values({
    id: newId(),
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? null,
    ip: entry.ip ?? null,
    createdAt: now(),
  });
}
