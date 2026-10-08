import { describe, expect, it } from "vitest";
import { hasPermission, resolvePermissions } from "../src/index.js";

describe("resolvePermissions", () => {
  it("grants the union of system role permissions", () => {
    const p = resolvePermissions(["student", "teacher"]);
    expect(p.has("courses:create")).toBe(true);
    expect(p.has("users:manage")).toBe(false);
  });

  it("ignores unknown roles (fail closed)", () => {
    const p = resolvePermissions(["hacker", "super_admin_fake"]);
    expect(p.size).toBe(0);
  });

  it("supports custom roles through a mapping", () => {
    const p = resolvePermissions(["content_editor"], { content_editor: ["cms:view"] });
    expect(hasPermission(p, "cms:view")).toBe(true);
    expect(hasPermission(p, "cms:manage")).toBe(false);
  });

  it("admin cannot manage roles or settings, super admin can", () => {
    const admin = resolvePermissions(["admin"]);
    const superAdmin = resolvePermissions(["super_admin"]);
    expect(admin.has("roles:manage")).toBe(false);
    expect(admin.has("settings:manage")).toBe(false);
    expect(superAdmin.has("roles:manage")).toBe(true);
    expect(superAdmin.has("settings:manage")).toBe(true);
  });
});
