import { type AuthenticatedUser, type Credentials, verifyCredentials, getRepoWithOwner, getUserById } from "@gitbruv/auth";
import { type Database, repositories, sessions } from "@gitbruv/db";
import { eq, and, gt } from "drizzle-orm";

export type { AuthenticatedUser };

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...v] = c.trim().split("=");
      return [key, v.join("=")];
    })
  );
}

export function parseBasicAuth(request: Request): Credentials | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return null;
  }
  const credentials = atob(authHeader.slice(6));
  const colonIndex = credentials.indexOf(":");
  if (colonIndex === -1) {
    return null;
  }
  return {
    email: credentials.slice(0, colonIndex),
    password: credentials.slice(colonIndex + 1),
  };
}

export async function authenticateRequest(request: Request, db: Database): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (session && session.expiresAt > new Date()) {
      const user = await getUserById(db, session.userId);
      if (user) {
        return { id: user.id, username: user.username };
      }
    }
    return null;
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const sessionToken = cookies["better-auth.session_token"];

  if (sessionToken) {
    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.token, sessionToken), gt(sessions.expiresAt, new Date())),
    });

    if (session) {
      const user = await getUserById(db, session.userId);
      if (user) {
        return { id: user.id, username: user.username };
      }
    }
  }

  const creds = parseBasicAuth(request);
  if (!creds) {
    return null;
  }

  const result = await verifyCredentials(db, creds);
  return result.user;
}

export async function getRepoOwnerAndRepo(
  db: Database,
  username: string,
  repoName: string
): Promise<{ owner: { id: string; username: string }; repo: typeof repositories.$inferSelect } | null> {
  return getRepoWithOwner(db, username, repoName);
}
