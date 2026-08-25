import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { getAuth, type Session } from "../auth";
import { db, users } from "@gitbruv/db";

// Throttle lastActiveAt writes: at most one update per user per interval.
const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;
const lastStamped = new Map<string, number>();

function stampActivity(userId: string) {
  const now = Date.now();
  const last = lastStamped.get(userId) ?? 0;
  if (now - last < ACTIVITY_THROTTLE_MS) return;
  lastStamped.set(userId, now);
  // Fire-and-forget; activity stamping must never slow a request down.
  db.update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, userId))
    .catch((err: unknown) => {
      console.error("[API] lastActiveAt update failed:", err instanceof Error ? err.message : err);
    });
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
};

export type AuthVariables = {
  user: AuthUser | null;
  session: Session | null;
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const auth = getAuth();

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session?.user) {
      c.set("user", {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        username: (session.user as any).username,
        avatarUrl: session.user.image,
      });
      c.set("session", session);
      stampActivity(session.user.id);
    } else {
      c.set("user", null);
      c.set("session", null);
    }
  } catch (error) {
    console.error("[API] Auth middleware error:", error instanceof Error ? error.message : "Unknown error");
    c.set("user", null);
    c.set("session", null);
  }

  await next();
});

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

export const optionalAuth = authMiddleware;
