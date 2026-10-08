import { Hono } from "hono";
import type { AppBindings } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const meRoutes = new Hono<AppBindings>();

meRoutes.use("*", requireAuth);

meRoutes.get("/", (c) => {
  const auth = c.var.auth!;
  return c.json({
    data: {
      id: auth.userId,
      email: auth.email,
      displayName: auth.displayName,
      roles: auth.roles,
      permissions: [...auth.permissions].sort(),
    },
  });
});
