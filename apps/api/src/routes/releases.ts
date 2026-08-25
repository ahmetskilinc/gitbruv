import { Hono } from "hono";
import { db, users, repositories, releases } from "@gitbruv/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, requireAuth, type AuthVariables } from "../middleware/auth";
import { createGitStore, resolveRefOid } from "../git";
import { putObject, getRepoPrefix, deleteObject } from "../s3";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", authMiddleware);

async function getRepo(owner: string, name: string, userId?: string) {
  const [row] = await db
    .select({
      id: repositories.id,
      ownerId: repositories.ownerId,
      name: repositories.name,
      visibility: repositories.visibility,
      defaultBranch: repositories.defaultBranch,
    })
    .from(repositories)
    .innerJoin(users, eq(users.id, repositories.ownerId))
    .where(and(eq(users.username, owner), eq(repositories.name, name)))
    .limit(1);

  if (!row) return null;
  if (row.visibility === "private" && userId !== row.ownerId) return null;
  return row;
}

const TAG_NAME_PATTERN = /^[A-Za-z0-9._\-/]+$/;

async function enrichRelease(release: typeof releases.$inferSelect) {
  const author = await db.query.users.findFirst({
    where: eq(users.id, release.authorId),
    columns: { id: true, username: true, name: true, avatarUrl: true },
  });
  return { ...release, author };
}

app.get("/api/repositories/:owner/:name/releases", async (c) => {
  const owner = c.req.param("owner");
  const name = c.req.param("name");
  const currentUser = c.get("user");

  const repo = await getRepo(owner, name, currentUser?.id);
  if (!repo) return c.json({ error: "Repository not found" }, 404);

  const isOwner = currentUser?.id === repo.ownerId;
  const rows = await db
    .select()
    .from(releases)
    .where(eq(releases.repositoryId, repo.id))
    .orderBy(desc(releases.createdAt));

  // Drafts are only visible to the owner.
  const visible = rows.filter((r) => !r.isDraft || isOwner);
  const list = await Promise.all(visible.map(enrichRelease));
  return c.json({ releases: list });
});

app.get("/api/repositories/:owner/:name/releases/:tag", async (c) => {
  const owner = c.req.param("owner");
  const name = c.req.param("name");
  const tag = c.req.param("tag");
  const currentUser = c.get("user");

  const repo = await getRepo(owner, name, currentUser?.id);
  if (!repo) return c.json({ error: "Repository not found" }, 404);

  const release = await db.query.releases.findFirst({
    where: and(eq(releases.repositoryId, repo.id), eq(releases.tagName, tag)),
  });
  if (!release || (release.isDraft && currentUser?.id !== repo.ownerId)) {
    return c.json({ error: "Release not found" }, 404);
  }

  return c.json(await enrichRelease(release));
});

app.post("/api/repositories/:owner/:name/releases", requireAuth, async (c) => {
  const owner = c.req.param("owner");
  const name = c.req.param("name");
  const user = c.get("user")!;
  const body = await c.req.json<{
    tagName: string;
    targetCommitish?: string;
    name?: string;
    body?: string;
    isDraft?: boolean;
    isPrerelease?: boolean;
  }>();

  const repo = await getRepo(owner, name, user.id);
  if (!repo) return c.json({ error: "Repository not found" }, 404);
  if (user.id !== repo.ownerId) {
    return c.json({ error: "Only the repository owner can create releases" }, 403);
  }

  const tagName = body.tagName?.trim();
  if (!tagName || !TAG_NAME_PATTERN.test(tagName)) {
    return c.json({ error: "Invalid tag name" }, 400);
  }

  const existing = await db.query.releases.findFirst({
    where: and(eq(releases.repositoryId, repo.id), eq(releases.tagName, tagName)),
  });
  if (existing) {
    return c.json({ error: "A release with this tag already exists" }, 400);
  }

  const isDraft = body.isDraft ?? false;

  // Resolve the target (branch name or oid) to a concrete commit OID. A draft
  // may be created before the target exists (e.g. an empty repo), so only a
  // published release hard-fails when the target can't be resolved.
  const target = body.targetCommitish?.trim() || repo.defaultBranch;
  const store = createGitStore(repo.ownerId, repo.name);
  let commitOid: string | null = null;
  try {
    commitOid = /^[0-9a-f]{40}$/i.test(target) ? target : await resolveRefOid(store, target);
  } catch {
    if (!isDraft) {
      return c.json({ error: `Could not resolve target '${target}'` }, 400);
    }
  }

  // For a published release, write a lightweight tag ref so git clients see it.
  if (!isDraft && commitOid) {
    const refKey = `${getRepoPrefix(repo.ownerId, repo.name)}/refs/tags/${tagName}`;
    await putObject(refKey, Buffer.from(commitOid + "\n"));
  }

  const [inserted] = await db
    .insert(releases)
    .values({
      repositoryId: repo.id,
      tagName,
      targetCommitish: target,
      commitOid,
      name: body.name?.trim() || tagName,
      body: body.body,
      isDraft,
      isPrerelease: body.isPrerelease ?? false,
      authorId: user.id,
      publishedAt: isDraft ? null : new Date(),
    })
    .returning();

  return c.json(await enrichRelease(inserted));
});

app.patch("/api/releases/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const body = await c.req.json<{
    name?: string;
    body?: string;
    isDraft?: boolean;
    isPrerelease?: boolean;
  }>();

  const release = await db.query.releases.findFirst({ where: eq(releases.id, id) });
  if (!release) return c.json({ error: "Release not found" }, 404);

  const repo = await db.query.repositories.findFirst({
    where: eq(repositories.id, release.repositoryId),
    columns: { ownerId: true, name: true },
  });
  if (user.id !== repo?.ownerId) {
    return c.json({ error: "Not authorized" }, 403);
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.body !== undefined) updates.body = body.body;
  if (body.isPrerelease !== undefined) updates.isPrerelease = body.isPrerelease;

  // Publishing a previously-draft release writes its tag ref and stamps publishedAt.
  if (body.isDraft !== undefined && body.isDraft !== release.isDraft) {
    updates.isDraft = body.isDraft;
    if (!body.isDraft) {
      updates.publishedAt = new Date();
      if (release.commitOid) {
        const refKey = `${getRepoPrefix(repo.ownerId, repo.name)}/refs/tags/${release.tagName}`;
        await putObject(refKey, Buffer.from(release.commitOid + "\n"));
      }
    }
  }

  await db.update(releases).set(updates).where(eq(releases.id, id));
  return c.json({ success: true });
});

app.delete("/api/releases/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  const release = await db.query.releases.findFirst({ where: eq(releases.id, id) });
  if (!release) return c.json({ error: "Release not found" }, 404);

  const repo = await db.query.repositories.findFirst({
    where: eq(repositories.id, release.repositoryId),
    columns: { ownerId: true, name: true },
  });
  if (user.id !== repo?.ownerId) {
    return c.json({ error: "Not authorized" }, 403);
  }

  // Remove the tag ref alongside the release row (best-effort).
  const refKey = `${getRepoPrefix(repo.ownerId, repo.name)}/refs/tags/${release.tagName}`;
  await deleteObject(refKey).catch(() => { /* ref may not exist for drafts */ });

  await db.delete(releases).where(eq(releases.id, id));
  return c.json({ success: true });
});

export default app;
