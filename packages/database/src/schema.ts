import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** Mốc thời gian lưu dạng Unix milliseconds (UTC). */
const timestamps = {
  createdAt: integer("created_at", { mode: "number" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "number" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
};

/**
 * Hồ sơ người dùng. `id` chính là `sub` (UUID) của Supabase Auth – ID ổn định
 * dùng để liên kết tài khoản giữa TIMO Main và TIMO Support.
 */
export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    grade: integer("grade"),
    status: text("status", { enum: ["active", "suspended", "deleted"] })
      .notNull()
      .default("active"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("profiles_email_uidx").on(t.email),
    index("profiles_status_idx").on(t.status),
  ],
);

export const roles = sqliteTable(
  "roles",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    nameVi: text("name_vi").notNull(),
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex("roles_key_uidx").on(t.key)],
);

export const permissions = sqliteTable(
  "permissions",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    description: text("description").notNull(),
  },
  (t) => [uniqueIndex("permissions_key_uidx").on(t.key)],
);

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    grantedBy: text("granted_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "number" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] }), index("user_roles_role_idx").on(t.roleId)],
);

export const grades = sqliteTable(
  "grades",
  {
    id: text("id").primaryKey(),
    level: integer("level").notNull(),
    slug: text("slug").notNull(),
    nameVi: text("name_vi").notNull(),
    stage: text("stage", { enum: ["primary", "lower_secondary", "upper_secondary"] }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("grades_level_uidx").on(t.level),
    uniqueIndex("grades_slug_uidx").on(t.slug),
    index("grades_stage_idx").on(t.stage),
    index("grades_active_sort_idx").on(t.isActive, t.sortOrder),
    // Chương trình GDPT Việt Nam: lớp 1–12.
    check("grades_level_range_check", sql`${t.level} BETWEEN 1 AND 12`),
  ],
);

export const subjects = sqliteTable(
  "subjects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    nameVi: text("name_vi").notNull(),
    description: text("description"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("subjects_slug_uidx").on(t.slug),
    index("subjects_active_sort_idx").on(t.isActive, t.sortOrder),
    check("subjects_slug_format_check", sql`${t.slug} GLOB '[a-z0-9]*'`),
  ],
);

/** Khối nội dung trang chủ được quản lý qua CMS. */
export const homepageSections = sqliteTable(
  "homepage_sections",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    type: text("type", {
      enum: ["hero", "announcement", "grades", "featured_courses", "subjects", "features", "cta"],
    }).notNull(),
    titleVi: text("title_vi").notNull(),
    /** Cấu hình JSON đã được kiểm tra bằng Zod ở tầng API. */
    config: text("config", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    position: integer("position").notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("homepage_sections_key_uidx").on(t.key),
    index("homepage_sections_position_idx").on(t.position),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    /** Metadata đã được lọc – KHÔNG chứa mật khẩu, token hay khóa bí mật. */
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: integer("created_at", { mode: "number" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("audit_logs_created_idx").on(t.createdAt),
    index("audit_logs_actor_idx").on(t.actorId, t.createdAt),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
  ],
);

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
  updatedAt: integer("updated_at", { mode: "number" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});
