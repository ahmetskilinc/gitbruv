import { Hono } from "hono";
import { db, users, repositories, milestones, issues } from "@gitbruv/db";
import { eq, sql, and, desc } from "drizzle-orm";
import { authMiddleware, requireAuth, type AuthVariables } from "../middleware/auth";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", authMiddleware);

async function getRepoAndCheckAccess(owner: string, name: string, userId?: string) {
  const [row] = await db
    .select({
      id: repositories.id,
      ownerId: repositories.ownerId,
      visibility: repositories.visibility,
    })
    .from(repositories)
    .innerJoin(users, eq(users.id, repositories.ownerId))
    .where(and(eq(users.username, owner), eq(repositories.name, name)))
    .limit(1);

  if (!row) return null;
  if (row.visibility === "private" && userId !== row.ownerId) return null;
  return { repoId: row.id, ownerId: row.ownerId };
}

// Count open/closed issues attached to a milestone (progress bar data).
async function getMilestoneProgress(milestoneId: string) {
  const rows = await db
    .select({ state: issues.state, count: sql<number>`COUNT(*)` })
    .from(issues)
    .where(eq(issues.milestoneId, milestoneId))
    .groupBy(issues.state);

  let open = 0;
  let closed = 0;
  for (const r of rows) {
    if (r.state === "closed") closed = Number(r.count);
    else open = Number(r.count);
  }
  return { openIssues: open, closedIssues: closed };
}

app.get("/api/repositories/:owner/:name/milestones", async (c) => {
  const owner = c.req.param("owner");
  const name = c.req.param("name");
  const currentUser = c.get("user");
  const stateParam = c.req.query("state") || "open";
  const state: "open" | "closed" = stateParam === "closed" ? "closed" : "open";

  const repoAccess = await getRepoAndCheckAccess(owner, name, currentUser?.id);
  if (!repoAccess) {
    return c.json({ error: "Repository not found" }, 404);
  }

  const rows = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.repositoryId, repoAccess.repoId), eq(milestones.state, state)))
    .orderBy(desc(milestones.createdAt));

  const list = await Promise.all(
    rows.map(async (m) => ({ ...m, ...(await getMilestoneProgress(m.id)) }))
  );

  return c.json({ milestones: list });
});

app.post("/api/repositories/:owner/:name/milestones", requireAuth, async (c) => {
  const owner = c.req.param("owner");
  const name = c.req.param("name");
  const user = c.get("user")!;
  const body = await c.req.json<{ title: string; description?: string; dueOn?: string }>();

  const repoAccess = await getRepoAndCheckAccess(owner, name, user.id);
  if (!repoAccess) {
    return c.json({ error: "Repository not found" }, 404);
  }
  if (user.id !== repoAccess.ownerId) {
    return c.json({ error: "Only the repository owner can create milestones" }, 403);
  }
  if (!body.title?.trim()) {
    return c.json({ error: "Title cannot be empty" }, 400);
  }

  const [maxNumber] = await db
    .select({ max: sql<number>`COALESCE(MAX(number), 0)` })
    .from(milestones)
    .where(eq(milestones.repositoryId, repoAccess.repoId));

  const [inserted] = await db
    .insert(milestones)
    .values({
      repositoryId: repoAccess.repoId,
      number: (maxNumber?.max || 0) + 1,
      title: body.title.trim(),
      description: body.description,
      dueOn: body.dueOn ? new Date(body.dueOn) : null,
    })
    .returning();

  return c.json(inserted);
});

app.patch("/api/milestones/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const body = await c.req.json<{
    title?: string;
    description?: string;
    state?: string;
    dueOn?: string | null;
  }>();

  const milestone = await db.query.milestones.findFirst({ where: eq(milestones.id, id) });
  if (!milestone) {
    return c.json({ error: "Milestone not found" }, 404);
  }

  const repo = await db.query.repositories.findFirst({
    where: eq(repositories.id, milestone.repositoryId),
    columns: { ownerId: true },
  });
  if (user.id !== repo?.ownerId) {
    return c.json({ error: "Not authorized" }, 403);
  }

  if (body.state && body.state !== "open" && body.state !== "closed") {
    return c.json({ error: "Invalid state" }, 400);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.dueOn !== undefined) updates.dueOn = body.dueOn ? new Date(body.dueOn) : null;
  if (body.state !== undefined) {
    updates.state = body.state;
    updates.closedAt = body.state === "closed" ? new Date() : null;
  }

  await db.update(milestones).set(updates).where(eq(milestones.id, id));
  return c.json({ success: true });
});

app.delete("/api/milestones/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  const milestone = await db.query.milestones.findFirst({ where: eq(milestones.id, id) });
  if (!milestone) {
    return c.json({ error: "Milestone not found" }, 404);
  }

  const repo = await db.query.repositories.findFirst({
    where: eq(repositories.id, milestone.repositoryId),
    columns: { ownerId: true },
  });
  if (user.id !== repo?.ownerId) {
    return c.json({ error: "Not authorized" }, 403);
  }

  // Issues keep existing; their milestoneId is cleared by the FK (set null).
  await db.delete(milestones).where(eq(milestones.id, id));
  return c.json({ success: true });
});

export default app;
