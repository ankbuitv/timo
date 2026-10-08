import { describe, expect, it } from "vitest";
import { redact } from "../src/lib/logger.js";

describe("log redaction", () => {
  it("redacts secrets, tokens and passwords at any depth", () => {
    const out = redact({
      userId: "u1",
      password: "p",
      nested: { accessToken: "t", deep: { SETUP_SECRET: "s", ok: 1 } },
      authorization: "Bearer x",
    }) as Record<string, unknown>;
    expect(out.userId).toBe("u1");
    expect(out.password).toBe("[redacted]");
    expect(out.authorization).toBe("[redacted]");
    expect((out.nested as { accessToken: string }).accessToken).toBe("[redacted]");
  });
});
