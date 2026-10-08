import { describe, expect, it } from "vitest";
import { isThemePreference, resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("returns explicit light/dark regardless of system setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
  it("follows the system preference when set to system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("isThemePreference", () => {
  it("rejects arbitrary stored values", () => {
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("<script>")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});
