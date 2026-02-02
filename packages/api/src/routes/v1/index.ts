import { Hono, Context } from "hono";

export const v1Routes = new Hono();

v1Routes.get("/blueprints", (c: Context) =>
  c.json({ data: [], pagination: {} }),
);
v1Routes.get("/blueprints/:id", (c: Context) => {
  const { id } = c.req.param();
  return c.json({ data: { id } });
});

v1Routes.get("/contents", (c: Context) => c.json({ data: [], pagination: {} }));
v1Routes.get("/contents/:id", (c: Context) => {
  const { id } = c.req.param();
  return c.json({ data: { id } });
});

v1Routes.get("/media", (c: Context) => c.json({ data: [] }));
v1Routes.get("/webhooks", (c: Context) => c.json({ data: [] }));

v1Routes.get("/users/me", (c: Context) => c.json({ data: { id: "me" } }));
