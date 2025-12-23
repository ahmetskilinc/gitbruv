import { type Env } from "./env";
import { type Database, repositories } from "@gitbruv/db";
import { type AuthenticatedUser } from "./auth";

export type RepoData = {
  owner: { id: string; username: string };
  repo: typeof repositories.$inferSelect;
  repoPrefix: string;
};

export type Variables = {
  db: Database;
  repoData: RepoData;
  user: AuthenticatedUser | null;
};

export type AppEnv = { Bindings: Env; Variables: Variables };

