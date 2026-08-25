import { Hono } from "hono";
import { db, users, repositories, follows, activities, type ActivityPayload } from "@gitbruv/db";
import { eq, sql, and, or, desc, gt, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { authMiddleware, requireAuth, type AuthVariables } from "../middleware/auth";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// Recording (library half — imported by the other route files)
// ---------------------------------------------------------------------------

export type RecordActivityInput = {
  actorId: string;
  repositoryId: string;
  type: string;
  payload?: ActivityPayload;
  targetType?: string;
  targetId?: string;
};

/**
 * Fire-and-forget activity write. Never await this in a request handler — an
 * activity problem must never fail or slow the originating request.
 */
export function recordActivity(input: RecordActivityInput): void {
  void (async () => {
    await db.insert(activities).values({
      actorId: input.actorId,
      repositoryId: input.repositoryId,
      type: input.type,
      payload: input.payload,
      targetType: input.targetType,
      targetId: input.targetId,
    });
  })().catch((err) => {
    console.error("[activity] failed to record:", err instanceof Error ? err.message : err);
  });
}

const PUSH_COALESCE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Push events coalesce: repeated pushes by the same user to the same branch
 * within an hour (and the same UTC day, so a contribution never migrates
 * across midnight) update the existing row instead of appending feed spam.
 */
export function recordPush(input: {
  actorId: string;
  repositoryId: string;
  branch: string;
  oldOid: string;
  newOid: string;
  commitCount: number;
  commitCountCapped: boolean;
}): void {
  void (async () => {
    const windowStart = new Date(Date.now() - PUSH_COALESCE_WINDOW_MS);
    const [existing] = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.actorId, input.actorId),
          eq(activities.repositoryId, input.repositoryId),
          eq(activities.type, "push"),
          gt(activities.createdAt, windowStart),
          sql`${activities.payload}->>'branch' = ${input.branch}`,
          sql`${activities.createdAt}::date = now()::date`,
        ),
      )
      .orderBy(desc(activities.createdAt))
      .limit(1);

    if (existing) {
      const prev = (existing.payload ?? {}) as ActivityPayload;
      await db
        .update(activities)
        .set({
          payload: {
            ...prev,
            commitCount: (prev.commitCount ?? 0) + input.commitCount,
            commitCountCapped: Boolean(prev.commitCountCapped) || input.commitCountCapped,
            newOid: input.newOid,
          },
          createdAt: new Date(),
        })
        .where(eq(activities.id, existing.id));
      return;
    }

    await db.insert(activities).values({
      actorId: input.actorId,
      repositoryId: input.repositoryId,
      type: "push",
      payload: {
        branch: input.branch,
        commitCount: input.commitCount,
        commitCountCapped: input.commitCountCapped,
        oldOid: input.oldOid,
        newOid: input.newOid,
      },
    });
  })().catch((err) => {
    console.error("[activity] failed to record push:", err instanceof Error ? err.message : err);
  });
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

const ownerUsers = alias(users, "owner_users");

const activitySelect = {
  id: activities.id,
  type: activities.type,
  payload: activities.payload,
  createdAt: activities.createdAt,
  actor: {
    id: users.id,
    username: users.username,
    name: users.name,
    avatarUrl: users.avatarUrl,
  },
  repoId: repositories.id,
  repoName: repositories.name,
  repoVisibility: repositories.visibility,
  repoOwner: ownerUsers.username,
};

type ActivityRow = {
  id: string;
  type: string;
  payload: ActivityPayload | null;
  createdAt: Date;
  actor: { id: string; username: string; name: string; avatarUrl: string | null };
  repoId: string;
  repoName: string;
  repoVisibility: string;
  repoOwner: string;
};

function shapeActivity(row: ActivityRow) {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload,
    createdAt: row.createdAt,
    actor: row.actor,
    repo: {
      id: row.repoId,
      owner: row.repoOwner,
      name: row.repoName,
      visibility: row.repoVisibility,
    },
  };
}

function activityBaseQuery() {
  return db
    .select(activitySelect)
    .from(activities)
    .innerJoin(users, eq(activities.actorId, users.id))
    .innerJoin(repositories, eq(activities.repositoryId, repositories.id))
    .innerJoin(ownerUsers, eq(repositories.ownerId, ownerUsers.id));
}

app.get("/api/users/:username/activity", async (c) => {
  const username = c.req.param("username");
  const viewer = c.get("user");
  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 50);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const profileUser = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: { id: true },
  });

  if (!profileUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const rows = await activityBaseQuery()
    .where(
      and(
        eq(activities.actorId, profileUser.id),
        or(eq(repositories.visibility, "public"), eq(repositories.ownerId, viewer?.id ?? "")),
      ),
    )
    .orderBy(desc(activities.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  return c.json({
    activities: rows.slice(0, limit).map(shapeActivity),
    hasMore,
  });
});

app.get("/api/activity/feed", requireAuth, async (c) => {
  const user = c.get("user")!;
  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 50);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  // Own activity + activity by users you follow. If the OR defeats index use
  // at scale, rewrite as a UNION ALL of the two individually-indexed arms.
  const rows = await activityBaseQuery()
    .where(
      and(
        or(
          eq(activities.actorId, user.id),
          inArray(
            activities.actorId,
            db
              .select({ id: follows.followingId })
              .from(follows)
              .where(eq(follows.followerId, user.id)),
          ),
        ),
        or(eq(repositories.visibility, "public"), eq(repositories.ownerId, user.id)),
      ),
    )
    .orderBy(desc(activities.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  return c.json({
    activities: rows.slice(0, limit).map(shapeActivity),
    hasMore,
  });
});

app.get("/api/users/:username/contributions", async (c) => {
  const username = c.req.param("username");
  const viewer = c.get("user");
  const days = Math.min(parseInt(c.req.query("days") || "365", 10), 366);

  const profileUser = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: { id: true, preferences: true },
  });

  if (!profileUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const includePrivate =
    viewer?.id === profileUser.id ||
    profileUser.preferences?.includePrivateContributions === true;

  // Private contributions are only ever merged into day counts — never itemized.
  const result = await db.execute(sql`
    SELECT (a.created_at AT TIME ZONE 'UTC')::date AS day,
           SUM(CASE WHEN a.type = 'push'
                    THEN GREATEST(COALESCE((a.payload->>'commitCount')::int, 1), 1)
                    ELSE 1 END)::int AS count
    FROM activities a
    JOIN repositories r ON r.id = a.repository_id
    WHERE a.actor_id = ${profileUser.id}
      AND a.created_at > now() - (${days} || ' days')::interval
      AND (${includePrivate} OR r.visibility = 'public')
    GROUP BY 1
    ORDER BY 1
  `);

  const rows = (result as unknown as { rows?: { day: string; count: number }[] }).rows ?? (result as unknown as { day: string; count: number }[]);
  const contributions = (Array.isArray(rows) ? rows : []).map((row) => ({
    date: typeof row.day === "string" ? row.day.slice(0, 10) : new Date(row.day).toISOString().slice(0, 10),
    count: Number(row.count),
  }));
  const total = contributions.reduce((sum, day) => sum + day.count, 0);

  return c.json({ contributions, total });
});

export default app;
