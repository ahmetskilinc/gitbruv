import { type Hono } from "hono";
import { type AppEnv } from "../types";
import { authMiddleware } from "../middleware/auth";
import { createDb } from "../db";

export function registerR2Routes(app: Hono<AppEnv>) {
  app.use("/api/r2/*", async (c, next) => {
    const db = createDb(c.env.DB.connectionString);
    c.set("db", db);
    await next();
  });
  app.all("/api/r2/:key", authMiddleware, async (c) => {
    const key = decodeURIComponent(c.req.param("key")!);
    const user = c.get("user");

    if (!user) {
      return c.text("Unauthorized", 401);
    }

    if (c.req.method === "HEAD") {
      const obj = await c.env.REPO_BUCKET.head(key);

      if (!obj) {
        return c.text("Not found", 404);
      }

      const headers = new Headers();
      if (obj.size) {
        headers.set("Content-Length", obj.size.toString());
      }
      if (obj.httpMetadata?.contentType) {
        headers.set("Content-Type", obj.httpMetadata.contentType);
      }

      return new Response(null, { headers });
    }

    if (c.req.method === "GET") {
      const obj = await c.env.REPO_BUCKET.get(key);

      if (!obj) {
        return c.text("Not found", 404);
      }

      const headers = new Headers();
      if (obj.size) {
        headers.set("Content-Length", obj.size.toString());
      }
      if (obj.httpMetadata?.contentType) {
        headers.set("Content-Type", obj.httpMetadata.contentType);
      }

      return new Response(obj.body, { headers });
    }
  });

  app.put("/api/r2/:key", authMiddleware, async (c) => {
    const key = decodeURIComponent(c.req.param("key")!);
    const user = c.get("user");

    if (!user) {
      return c.text("Unauthorized", 401);
    }

    const body = await c.req.arrayBuffer();
    const contentType = c.req.header("Content-Type") || "application/octet-stream";

    await c.env.REPO_BUCKET.put(key, body, {
      httpMetadata: {
        contentType,
      },
    });

    return c.json({ success: true });
  });

  app.delete("/api/r2/:key", authMiddleware, async (c) => {
    const key = decodeURIComponent(c.req.param("key")!);
    const user = c.get("user");

    if (!user) {
      return c.text("Unauthorized", 401);
    }

    await c.env.REPO_BUCKET.delete(key);

    return c.json({ success: true });
  });

  app.get("/api/r2/list/:prefix", authMiddleware, async (c) => {
    const prefix = decodeURIComponent(c.req.param("prefix")!);
    const user = c.get("user");

    if (!user) {
      return c.text("Unauthorized", 401);
    }

    const keys: string[] = [];
    let cursor: string | undefined;

    do {
      const result = await c.env.REPO_BUCKET.list({ prefix, cursor });
      for (const obj of result.objects) {
        keys.push(obj.key);
      }
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    return c.json({ keys });
  });

  app.post("/api/r2/batch/get", authMiddleware, async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.text("Unauthorized", 401);
    }

    const { keys } = await c.req.json<{ keys: string[] }>();

    const results: Record<string, string | null> = {};

    for (const key of keys) {
      const obj = await c.env.REPO_BUCKET.get(key);
      if (obj) {
        const arrayBuffer = await obj.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        results[key] = base64;
      } else {
        results[key] = null;
      }
    }

    return c.json({ results });
  });

  app.post("/api/r2/batch/put", authMiddleware, async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.text("Unauthorized", 401);
    }

    const { items } = await c.req.json<{ items: Array<{ key: string; data: string; contentType?: string }> }>();

    for (const item of items) {
      const data = Uint8Array.from(atob(item.data), (c) => c.charCodeAt(0));
      await c.env.REPO_BUCKET.put(item.key, data, {
        httpMetadata: {
          contentType: item.contentType || "application/octet-stream",
        },
      });
    }

    return c.json({ success: true });
  });

  app.delete("/api/r2/prefix/:prefix", authMiddleware, async (c) => {
    const prefix = decodeURIComponent(c.req.param("prefix")!);
    const user = c.get("user");

    if (!user) {
      return c.text("Unauthorized", 401);
    }

    const keys: string[] = [];
    let cursor: string | undefined;

    do {
      const result = await c.env.REPO_BUCKET.list({ prefix, cursor });
      for (const obj of result.objects) {
        keys.push(obj.key);
      }
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      if (batch.length === 0) continue;

      await Promise.all(batch.map((key) => c.env.REPO_BUCKET.delete(key)));
    }

    return c.json({ success: true, deleted: keys.length });
  });
}
