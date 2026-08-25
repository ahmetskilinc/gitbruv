import type { NextRequest } from "next/server"
import { getApiUrl } from "@/lib/env"

export const dynamic = "force-dynamic"

const GIT_PATTERN = /^\/[^/]+\/[^/]+\.git\//

async function handleGitRequest(request: NextRequest): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/git-proxy/, "")

  if (!GIT_PATTERN.test(path)) {
    return new Response(null, { status: 404, statusText: "Not Found" })
  }

  const apiUrl = getApiUrl()
  if (!apiUrl) {
    return new Response(JSON.stringify({ error: "API URL not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const backendUrl = `${apiUrl}${path}${url.search}`
  console.log(`[Git Proxy] ${request.method} ${path} -> ${backendUrl}`)

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (
      lowerKey !== "host" &&
      lowerKey !== "connection" &&
      lowerKey !== "content-length" &&
      lowerKey !== "transfer-encoding"
    ) {
      headers.set(key, value)
    }
  })

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const hasBody = request.method !== "GET" && request.method !== "HEAD"

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      // Stream the upload; undici requires half-duplex for stream bodies.
      // If streaming ever misbehaves through `next start`, fall back to
      // `await request.arrayBuffer()` here.
      body: hasBody ? request.body : undefined,
      ...(hasBody ? { duplex: "half" } : {}),
      credentials: "include",
      signal: controller.signal,
    } as RequestInit)

    clearTimeout(timeoutId)

    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (lowerKey !== "content-length" && lowerKey !== "transfer-encoding" && lowerKey !== "connection") {
        responseHeaders.set(key, value)
      }
    })
    responseHeaders.set("Cache-Control", "no-store")

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error(`[Git Proxy] Error for ${path}:`, error)
    return new Response(
      JSON.stringify({
        error: "Failed to proxy git request",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }
}

export async function GET(request: NextRequest) {
  return handleGitRequest(request)
}

export async function POST(request: NextRequest) {
  return handleGitRequest(request)
}

export async function OPTIONS(request: NextRequest) {
  return handleGitRequest(request)
}
