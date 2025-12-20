"use server";

import { db } from "@/db";
import { repositories, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import git from "isomorphic-git";
import { createR2Fs, getRepoPrefix } from "@/lib/r2-fs";

export async function createRepository(data: {
  name: string;
  description?: string;
  visibility: "public" | "private";
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const normalizedName = data.name.toLowerCase().replace(/\s+/g, "-");

  if (!/^[a-zA-Z0-9_.-]+$/.test(normalizedName)) {
    throw new Error("Invalid repository name");
  }

  const existing = await db.query.repositories.findFirst({
    where: and(
      eq(repositories.ownerId, session.user.id),
      eq(repositories.name, normalizedName)
    ),
  });

  if (existing) {
    throw new Error("Repository already exists");
  }

  const [repo] = await db
    .insert(repositories)
    .values({
      name: normalizedName,
      description: data.description || null,
      visibility: data.visibility,
      ownerId: session.user.id,
    })
    .returning();

  const repoPrefix = getRepoPrefix(session.user.id, `${normalizedName}.git`);
  const fs = createR2Fs(repoPrefix);

  await fs.writeFile("/HEAD", "ref: refs/heads/main\n");
  await fs.writeFile("/config", `[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = true
`);
  await fs.writeFile("/description", "Unnamed repository; edit this file to name the repository.\n");

  const username = (session.user as { username?: string }).username;
  revalidatePath(`/${username}`);
  revalidatePath("/");

  return repo;
}

export async function getRepository(owner: string, name: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, owner),
  });

  if (!user) {
    return null;
  }

  const repo = await db.query.repositories.findFirst({
    where: and(
      eq(repositories.ownerId, user.id),
      eq(repositories.name, name)
    ),
  });

  if (!repo) {
    return null;
  }

  const session = await getSession();
  if (repo.visibility === "private") {
    if (!session?.user || session.user.id !== repo.ownerId) {
      return null;
    }
  }

  return {
    ...repo,
    owner: {
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
    },
  };
}

export async function getUserRepositories(username: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return [];
  }

  const session = await getSession();
  const isOwner = session?.user?.id === user.id;

  const repos = await db.query.repositories.findMany({
    where: isOwner
      ? eq(repositories.ownerId, user.id)
      : and(
          eq(repositories.ownerId, user.id),
          eq(repositories.visibility, "public")
        ),
    orderBy: [desc(repositories.updatedAt)],
  });

  return repos;
}

export async function deleteRepository(repoId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const repo = await db.query.repositories.findFirst({
    where: eq(repositories.id, repoId),
  });

  if (!repo) {
    throw new Error("Repository not found");
  }

  if (repo.ownerId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const { r2DeletePrefix } = await import("@/lib/r2");
  const repoPrefix = getRepoPrefix(session.user.id, `${repo.name}.git`);

  try {
    await r2DeletePrefix(repoPrefix);
  } catch {
  }

  await db.delete(repositories).where(eq(repositories.id, repoId));

  const username = (session.user as { username?: string }).username;
  revalidatePath(`/${username}`);
  revalidatePath("/");
}

export async function getRepoFileTree(
  owner: string,
  repoName: string,
  branch: string,
  dirPath: string = ""
) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, owner),
  });

  if (!user) {
    return null;
  }

  const repoPrefix = getRepoPrefix(user.id, `${repoName}.git`);
  const fs = createR2Fs(repoPrefix);

  try {
    const commits = await git.log({
      fs,
      gitdir: "/",
      ref: branch,
      depth: 1,
    });

    if (commits.length === 0) {
      return { files: [], isEmpty: true };
    }

    const commitOid = commits[0].oid;

    const { tree } = await git.readTree({
      fs,
      gitdir: "/",
      oid: commitOid,
    });

    let targetTree = tree;

    if (dirPath) {
      const parts = dirPath.split("/").filter(Boolean);
      for (const part of parts) {
        const entry = targetTree.find((e) => e.path === part && e.type === "tree");
        if (!entry) {
          return { files: [], isEmpty: false };
        }
        const subTree = await git.readTree({
          fs,
          gitdir: "/",
          oid: entry.oid,
        });
        targetTree = subTree.tree;
      }
    }

    const entries = targetTree.map((entry) => ({
      name: entry.path,
      type: entry.type as "blob" | "tree",
      oid: entry.oid,
      path: dirPath ? `${dirPath}/${entry.path}` : entry.path,
    }));

    entries.sort((a, b) => {
      if (a.type === "tree" && b.type !== "tree") return -1;
      if (a.type !== "tree" && b.type === "tree") return 1;
      return a.name.localeCompare(b.name);
    });

    return { files: entries, isEmpty: false };
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code !== "NotFoundError") {
      console.error("getRepoFileTree error:", err);
    }
    return { files: [], isEmpty: true };
  }
}

export async function getRepoFile(
  owner: string,
  repoName: string,
  branch: string,
  filePath: string
) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, owner),
  });

  if (!user) {
    return null;
  }

  const repoPrefix = getRepoPrefix(user.id, `${repoName}.git`);
  const fs = createR2Fs(repoPrefix);

  try {
    const commits = await git.log({
      fs,
      gitdir: "/",
      ref: branch,
      depth: 1,
    });

    if (commits.length === 0) {
      return null;
    }

    const commitOid = commits[0].oid;
    const parts = filePath.split("/").filter(Boolean);
    const fileName = parts.pop()!;

    let currentTree = (await git.readTree({ fs, gitdir: "/", oid: commitOid })).tree;

    for (const part of parts) {
      const entry = currentTree.find((e) => e.path === part && e.type === "tree");
      if (!entry) return null;
      currentTree = (await git.readTree({ fs, gitdir: "/", oid: entry.oid })).tree;
    }

    const fileEntry = currentTree.find((e) => e.path === fileName && e.type === "blob");
    if (!fileEntry) return null;

    const { blob } = await git.readBlob({
      fs,
      gitdir: "/",
      oid: fileEntry.oid,
    });

    const decoder = new TextDecoder("utf-8");
    const content = decoder.decode(blob);

    return {
      content,
      oid: fileEntry.oid,
      path: filePath,
    };
  } catch (err) {
    console.error("getRepoFile error:", err);
    return null;
  }
}
