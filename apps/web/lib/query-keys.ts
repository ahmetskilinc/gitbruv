/**
 * Query keys duplicated from `@gitbruv/hooks` for prefetching.
 *
 * The hooks package does not export its key builders, so the repo-layout
 * prefetch block must construct the same keys by hand. Every entry here maps
 * to the hook named in its comment — if a hook's key shape changes, update it
 * HERE too or the prefetch silently stops matching.
 */
export const queryKeys = {
  /** useRepoTree(owner, name, branch, path) — packages/hooks/src/repositories.ts */
  tree: (owner: string, name: string, branch: string, path = "") =>
    ["repository", owner, name, "tree", branch, path] as const,
  /** useRepoTreeCommits(owner, name, branch, path) */
  treeCommits: (owner: string, name: string, branch: string, path = "") =>
    ["repository", owner, name, "tree-commits", branch, path] as const,
  /** useReadmeOid(owner, name, branch) */
  readmeOid: (owner: string, name: string, branch: string) =>
    ["repository", owner, name, "readmeOid", branch] as const,
  /** useRepoCommits(owner, name, branch, limit, offset) */
  commits: (owner: string, name: string, branch: string, limit: number, offset: number) =>
    ["repository", owner, name, "commits", branch, limit, offset] as const,
  /** useIssues(owner, name, filters) — packages/hooks/src/issues.ts */
  issues: (owner: string, name: string, filters: unknown) =>
    ["issues", owner, name, filters] as const,
  /** useLabels(owner, name) */
  labels: (owner: string, name: string) => ["labels", owner, name] as const,
  /** usePullRequests(owner, name, filters) — packages/hooks/src/pull-requests.ts */
  pullRequests: (owner: string, name: string, filters: unknown) =>
    ["pullRequests", owner, name, filters] as const,
  /** useDiscussions(owner, name, category, limit, offset) — packages/hooks/src/discussions.ts */
  discussions: (owner: string, name: string, category: undefined, limit: number, offset: number) =>
    ["discussions", owner, name, category, limit, offset] as const,
  /** useProjects(owner, name) — packages/hooks/src/projects.ts */
  projects: (owner: string, name: string) => ["projects", owner, name] as const,
}
