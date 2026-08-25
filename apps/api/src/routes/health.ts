import { Hono } from "hono";
import { getObject } from "../s3";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok", version: "1.0.0" });
});

app.get("/api/health", (c) => {
  return c.json({ status: "ok", version: "1.0.0" });
});

app.get("/api/avatar/:filename", async (c) => {
  const filename = c.req.param("filename");
  const key = `avatars/${filename}`;

  const data = await getObject(key);
  if (!data) {
    return c.json({ error: "Avatar not found" }, 404);
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "png";
  const contentType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "gif"
        ? "image/gif"
        : ext === "webp"
          ? "image/webp"
          : "image/png";

  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

export default app;
