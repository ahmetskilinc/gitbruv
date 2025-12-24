import { type MiddlewareHandler } from "hono";
import { type AppEnv } from "../types";
import { getRepoPrefix } from "../r2-fs";
import { getRepoOwnerAndRepo } from "../auth";

export const repoMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const username = c.req.param("username")!;
  let repoName = c.req.param("repo")!;

  if (repoName.endsWith(".git")) {
    repoName = repoName.slice(0, -4);
  }

  const db = c.get("db");
  const result = await getRepoOwnerAndRepo(db, username, repoName);
  if (!result) {
    return c.text("Repository not found", 404);
  }

  const repoPrefix = getRepoPrefix(result.owner.id, `${repoName}.git`);
  c.set("repoData", { ...result, repoPrefix });

  await next();
};
