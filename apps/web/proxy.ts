import { NextResponse, type NextRequest } from "next/server"

const GIT_PATTERN = /^\/[^/]+\/[^/]+\.git\//

// Optimistic auth guard: presence-check only (the pages still do the
// authoritative client-side session check). The better-auth cookie belongs to
// the API origin, so this guard only works when the deployment shares the
// cookie domain with the web app — enable it then with AUTH_COOKIE_GUARD=1.
// Without it the guard is off and pages fall back to client-side redirects.
const GUARD_ENABLED = process.env.AUTH_COOKIE_GUARD === "1"
const PROTECTED_PATHS = ["/settings", "/notifications", "/oauth/consent"]
const SESSION_COOKIES = ["gitbruv.session_token", "gitbruv_dev.session_token"]

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (GIT_PATTERN.test(pathname)) {
    return NextResponse.rewrite(
      new URL(`/api/git-proxy${pathname}${search}`, request.url),
    )
  }

  if (
    GUARD_ENABLED &&
    PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name))
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname + search)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
}
