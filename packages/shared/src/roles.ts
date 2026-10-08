/** Vai trò mặc định của hệ thống. Vai trò tùy chỉnh được lưu trong cơ sở dữ liệu. */
export const SYSTEM_ROLES = [
  "super_admin",
  "admin",
  "moderator",
  "teacher",
  "student",
  "parent",
  "support_agent",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

/** Quyền chi tiết. Định dạng: <tài nguyên>:<hành động>. */
export const PERMISSIONS = [
  "users:view",
  "users:manage",
  "roles:manage",
  "grades:view",
  "grades:manage",
  "subjects:view",
  "subjects:manage",
  "cms:view",
  "cms:manage",
  "audit:view",
  "settings:manage",
  "courses:view",
  "courses:create",
  "courses:update",
  "courses:delete",
  "courses:publish",
  "courses:approve",
  "content:moderate",
  "support:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<SystemRole, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  admin: PERMISSIONS.filter((p) => p !== "roles:manage" && p !== "settings:manage"),
  moderator: ["courses:view", "content:moderate", "users:view", "grades:view", "subjects:view"],
  teacher: [
    "grades:view",
    "subjects:view",
    "courses:view",
    "courses:create",
    "courses:update",
    "courses:delete",
  ],
  student: ["grades:view", "subjects:view", "courses:view"],
  parent: ["grades:view", "subjects:view", "courses:view"],
  support_agent: ["support:manage", "users:view"],
};

export function isSystemRole(value: string): value is SystemRole {
  return (SYSTEM_ROLES as readonly string[]).includes(value);
}
