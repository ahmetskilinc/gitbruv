import { Hono } from "hono";
import { db, users, repositories, stars, follows } from "@gitbruv/db";
import { eq, sql, desc, asc, and } from "drizzle-orm";
import { authMiddleware, requireAuth, type AuthVariables } from "../middleware/auth";
import { createNotification } from "./notifications";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", authMiddleware);

function cacheBustAvatarUrl(avatarUrl: string | null, updatedAt: Date): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.includes("v=")) return avatarUrl;
  const separator = avatarUrl.includes("?") ? "&" : "?";
  return `${avatarUrl}${separator}v=${updatedAt.getTime()}`;
}

app.get("/api/users/me", requireAuth, async (c) => {
  const user = c.get("user")!;
  const result = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!result) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(result);
});

app.get("/api/users/me/summary", requireAuth, async (c) => {
  const user = c.get("user")!;
  const result = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      name: true,
      avatarUrl: true,
      updatedAt: true,
    },
  });

  if (!result) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    name: result.name,
    avatarUrl: cacheBustAvatarUrl(result.avatarUrl, result.updatedAt),
  });
});

app.get("/api/users/public", async (c) => {
  const sortBy = c.req.query("sortBy") || "newest";
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const orderBy = sortBy === "oldest" ? asc(users.createdAt) : desc(users.createdAt);

  const usersResult = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      location: users.location,
      company: users.company,
      website: users.website,
      lastActiveAt: users.lastActiveAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(orderBy)
    .limit(limit + 1)
    .offset(offset);

  const result = await Promise.all(
    usersResult.map(async (user) => {
      const [repoCountResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(repositories)
        .where(and(eq(repositories.ownerId, user.id), eq(repositories.visibility, "public")));

      return {
        ...user,
        avatarUrl: cacheBustAvatarUrl(user.avatarUrl, user.updatedAt),
        repoCount: Number(repoCountResult?.count) || 0,
      };
    })
  );

  const hasMore = result.length > limit;
  const usersData = result.slice(0, limit);

  return c.json({
    users: usersData,
    hasMore,
  });
});

app.get("/api/users/:username/avatar", async (c) => {
  const username = c.req.param("username");

  const result = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      avatarUrl: true,
      updatedAt: true,
    },
  });

  return c.json({
    avatarUrl: result ? cacheBustAvatarUrl(result.avatarUrl, result.updatedAt) : null,
  });
});

app.get("/api/users/:username", async (c) => {
  const username = c.req.param("username");

  const result = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      id: true,
      username: true,
      name: true,
      bio: true,
      location: true,
      website: true,
      pronouns: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!result) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(result);
});

app.get("/api/users/:username/profile", async (c) => {
  const username = c.req.param("username");
  const currentUser = c.get("user");

  const result = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!result) {
    return c.json({ error: "User not found" }, 404);
  }

  const isOwnProfile = currentUser?.id === result.id;

  const response: Record<string, any> = {
    id: result.id,
    name: result.name,
    username: result.username,
    avatarUrl: cacheBustAvatarUrl(result.avatarUrl, result.updatedAt),
    bio: result.bio,
    location: result.location,
    website: result.website,
    pronouns: result.pronouns,
    company: result.company,
    gitEmail: result.gitEmail,
    defaultRepositoryVisibility: result.defaultRepositoryVisibility,
    preferences: result.preferences,
    socialLinks: result.socialLinks,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };

  if (result.lastActiveAt) {
    response.lastActiveAt = result.lastActiveAt;
  }

  if (isOwnProfile) {
    response.email = result.email;
    response.emailVerified = result.emailVerified;
  }

  return c.json(response);
});

app.get("/api/users/:username/starred", async (c) => {
  const username = c.req.param("username");

  const userResult = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: { id: true },
  });

  if (!userResult) {
    return c.json({ repos: [] });
  }

  const starredRepos = await db
    .select({
      id: repositories.id,
      name: repositories.name,
      description: repositories.description,
      visibility: repositories.visibility,
      defaultBranch: repositories.defaultBranch,
      createdAt: repositories.createdAt,
      updatedAt: repositories.updatedAt,
      ownerId: repositories.ownerId,
      ownerUsername: users.username,
      ownerName: users.name,
      ownerAvatarUrl: users.avatarUrl,
      starredAt: stars.createdAt,
      starCount: sql<number>`(SELECT COUNT(*) FROM stars WHERE repository_id = ${repositories.id})`.as("star_count"),
    })
    .from(stars)
    .innerJoin(repositories, eq(stars.repositoryId, repositories.id))
    .innerJoin(users, eq(repositories.ownerId, users.id))
    .where(and(eq(stars.userId, userResult.id), eq(repositories.visibility, "public")))
    .orderBy(desc(stars.createdAt));

  const repos = starredRepos.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    visibility: r.visibility,
    defaultBranch: r.defaultBranch,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    starCount: Number(r.starCount) || 0,
    starredAt: r.starredAt,
    owner: {
      id: r.ownerId,
      username: r.ownerUsername,
      name: r.ownerName,
      avatarUrl: r.ownerAvatarUrl,
    },
  }));

  return c.json({ repos });
});

async function findUserByUsername(username: string) {
  return db.query.users.findFirst({
    where: eq(users.username, username),
    columns: { id: true, username: true },
  });
}

/** Toggle following a user. Returns the new state. */
app.post("/api/users/:username/follow", requireAuth, async (c) => {
  const user = c.get("user")!;
  const target = await findUserByUsername(c.req.param("username"));

  if (!target) {
    return c.json({ error: "User not found" }, 404);
  }
  if (target.id === user.id) {
    return c.json({ error: "You cannot follow yourself" }, 400);
  }

  const [existing] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, user.id), eq(follows.followingId, target.id)));

  if (existing) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, user.id), eq(follows.followingId, target.id)));
    return c.json({ following: false });
  }

  await db.insert(follows).values({ followerId: user.id, followingId: target.id });

  // Best-effort notification; never fail the follow.
  createNotification({
    userId: target.id,
    type: "user_follow",
    title: `${user.username} followed you`,
    actorId: user.id,
  }).catch((err) => console.error("[users] follow notification failed:", err));

  return c.json({ following: true });
});

/** Follower/following counts plus whether the viewer follows this user. */
app.get("/api/users/:username/follow-info", async (c) => {
  const viewer = c.get("user");
  const target = await findUserByUsername(c.req.param("username"));

  if (!target) {
    return c.json({ error: "User not found" }, 404);
  }

  const [followerCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followingId, target.id));
  const [followingCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followerId, target.id));

  let isFollowing = false;
  if (viewer && viewer.id !== target.id) {
    const [existing] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, viewer.id), eq(follows.followingId, target.id)));
    isFollowing = Boolean(existing);
  }

  return c.json({
    followers: Number(followerCount?.count) || 0,
    following: Number(followingCount?.count) || 0,
    isFollowing,
  });
});

const followUserSelect = {
  id: users.id,
  username: users.username,
  name: users.name,
  avatarUrl: users.avatarUrl,
  bio: users.bio,
  updatedAt: users.updatedAt,
};

function shapeFollowUser(row: {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    avatarUrl: cacheBustAvatarUrl(row.avatarUrl, row.updatedAt),
    bio: row.bio,
  };
}

app.get("/api/users/:username/followers", async (c) => {
  const target = await findUserByUsername(c.req.param("username"));
  if (!target) {
    return c.json({ error: "User not found" }, 404);
  }
  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 50);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const rows = await db
    .select(followUserSelect)
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, target.id))
    .orderBy(desc(follows.createdAt))
    .limit(limit + 1)
    .offset(offset);

  return c.json({
    users: rows.slice(0, limit).map(shapeFollowUser),
    hasMore: rows.length > limit,
  });
});

app.get("/api/users/:username/following", async (c) => {
  const target = await findUserByUsername(c.req.param("username"));
  if (!target) {
    return c.json({ error: "User not found" }, 404);
  }
  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 50);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const rows = await db
    .select(followUserSelect)
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, target.id))
    .orderBy(desc(follows.createdAt))
    .limit(limit + 1)
    .offset(offset);

  return c.json({
    users: rows.slice(0, limit).map(shapeFollowUser),
    hasMore: rows.length > limit,
  });
});

export default app;
