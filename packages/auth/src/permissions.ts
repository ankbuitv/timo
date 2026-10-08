import { ROLE_PERMISSIONS, type Permission, type SystemRole, isSystemRole } from "@timo/shared";

/**
 * Hợp nhất quyền từ danh sách vai trò. Vai trò không xác định bị bỏ qua (fail-closed).
 * Vai trò tùy chỉnh được truyền qua `customRolePermissions`.
 */
export function resolvePermissions(
  roleKeys: readonly string[],
  customRolePermissions: Readonly<Record<string, readonly string[]>> = {},
): Set<string> {
  const out = new Set<string>();
  for (const key of roleKeys) {
    if (isSystemRole(key)) {
      for (const p of ROLE_PERMISSIONS[key as SystemRole]) out.add(p);
    } else {
      for (const p of customRolePermissions[key] ?? []) out.add(p);
    }
  }
  return out;
}

export function hasPermission(
  granted: ReadonlySet<string>,
  required: Permission | string,
): boolean {
  if (granted.has(required)) return true;
  return false;
}

export function hasRole(roleKeys: readonly string[], role: string): boolean {
  return roleKeys.includes(role);
}
