import { createFileRoute } from "@tanstack/react-router";
import { getApiUrl } from "@/lib/utils";

export const Route = createFileRoute("/api/$" as any)({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return proxyRequest(request);
      },
      POST: async ({ request }) => {
        return proxyRequest(request);
      },
      PUT: async ({ request }) => {
        return proxyRequest(request);
      },
      PATCH: async ({ request }) => {
        return proxyRequest(request);
      },
      DELETE: async ({ request }) => {
        return proxyRequest(request);
      },
      OPTIONS: async ({ request }) => {
        return proxyRequest(request);
      },
    },
  },
});

async function proxyRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.startsWith("/api/auth")) {
    return new Response("Not Found", { status: 404 });
  }

  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return new Response("API URL not configured", { status: 500 });
  }

  const backendPath = path.replace(/^\/api/, "");
  const backendUrl = `${apiUrl}${backendPath}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "connection" && key.toLowerCase() !== "content-length") {
      headers.set(key, value);
    }
  });

  const body = request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined;

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    const responseBody = await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to proxy request", message: error instanceof Error ? error.message : "Unknown error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
