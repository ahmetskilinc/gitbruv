import { type Hono } from "hono";
import { type AppEnv } from "../types";

export function registerAvatarRoutes(app: Hono<AppEnv>) {
  app.options("/avatar/:filename", (c) => {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      },
    });
  });

  app.get("/avatar/:filename", async (c) => {
    const filename = c.req.param("filename")!;
    const key = `avatars/${filename}`;

    const obj = await c.env.REPO_BUCKET.get(key);

    if (!obj) {
      return c.text("Avatar not found", 404);
    }

    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "image/png";

    if (ext === "jpg" || ext === "jpeg") {
      contentType = "image/jpeg";
    } else if (ext === "gif") {
      contentType = "image/gif";
    } else if (ext === "webp") {
      contentType = "image/webp";
    }

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    });

    if (obj.size) {
      headers.set("Content-Length", obj.size.toString());
    }

    return new Response(obj.body, { headers });
  });
}
