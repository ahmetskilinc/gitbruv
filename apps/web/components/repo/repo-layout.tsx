"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { RiGitForkLine } from "@remixicon/react"
import { useForkRepository, useRepositoryInfo, useApi } from "@gitbruv/hooks"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CloneUrl } from "@/components/clone-url"
import { StarButton } from "@/components/star-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { queryKeys } from "@/lib/query-keys"

function getBranchFromPath(pathname: string, defaultBranch: string): string {
  const treeMatch = pathname.match(/\/tree\/([^/]+)/)
  if (treeMatch) return decodeURIComponent(treeMatch[1])

  const blobMatch = pathname.match(/\/blob\/([^/]+)/)
  if (blobMatch) return decodeURIComponent(blobMatch[1])

  const commitsMatch = pathname.match(/\/commits\/([^/]+)/)
  if (commitsMatch) return decodeURIComponent(commitsMatch[1])

  return defaultBranch
}

export function RepoLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RepoLayoutSkeleton />}>
      <RepoLayoutContent>{children}</RepoLayoutContent>
    </Suspense>
  )
}

function RepoLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repoName = decodeURIComponent(params.repo)
  const pathname = usePathname()
  const router = useRouter()

  const { data: repoInfo, isLoading: isLoadingInfo } = useRepositoryInfo(
    username,
    repoName,
  )
  const forkMutation = useForkRepository(username, repoName)

  const repo = repoInfo?.repo
  const defaultBranch = repo?.defaultBranch || "main"
  const currentBranch = getBranchFromPath(pathname, defaultBranch)

  // The repo header + clone only appear on the code browsing views.
  const repoBase = `/${username}/${repoName}`
  const rest = pathname.slice(repoBase.length)
  const isCodeView =
    rest === "" || rest === "/" || rest.startsWith("/tree") || rest.startsWith("/blob")

  const forkCount = repo?.forkCount ?? 0
  const [isForkDialogOpen, setIsForkDialogOpen] = useState(false)
  const [forkName, setForkName] = useState("")

  const queryClient = useQueryClient()
  const api = useApi()

  // Render-time adjustment: default the fork name to the repo name once known.
  const [prevRepoName, setPrevRepoName] = useState<string | undefined>(undefined)
  if (repo?.name && repo.name !== prevRepoName) {
    setPrevRepoName(repo.name)
    setForkName(repo.name)
  }

  // Prefetch all tab data so tab switches are instant.
  useEffect(() => {
    if (!repo || !currentBranch) return

    const owner = username
    const name = repoName

    queryClient.prefetchQuery({
      queryKey: queryKeys.tree(owner, name, currentBranch),
      queryFn: () => api.repositories.getTree(owner, name, currentBranch, ""),
    })
    queryClient.prefetchQuery({
      queryKey: queryKeys.treeCommits(owner, name, currentBranch),
      queryFn: () => api.repositories.getTreeCommits(owner, name, currentBranch, ""),
    })
    queryClient.prefetchQuery({
      queryKey: queryKeys.readmeOid(owner, name, currentBranch),
      queryFn: () => api.repositories.getReadmeOid(owner, name, currentBranch),
    })
    queryClient.prefetchQuery({
      queryKey: queryKeys.commits(owner, name, currentBranch, 1, 0),
      queryFn: () => api.repositories.getCommits(owner, name, currentBranch, 1, 0),
    })

    const defaultIssueFilters = { state: "open" as const, limit: 30 }
    queryClient.prefetchQuery({
      queryKey: queryKeys.issues(owner, name, defaultIssueFilters),
      queryFn: () => api.issues.list(owner, name, defaultIssueFilters),
    })
    queryClient.prefetchQuery({
      queryKey: queryKeys.labels(owner, name),
      queryFn: () => api.issues.listLabels(owner, name),
    })

    const defaultPRFilters = { state: "open" as const, limit: 30 }
    queryClient.prefetchQuery({
      queryKey: queryKeys.pullRequests(owner, name, defaultPRFilters),
      queryFn: () => api.pullRequests.list(owner, name, defaultPRFilters),
    })

    queryClient.prefetchQuery({
      queryKey: queryKeys.commits(owner, name, currentBranch, 30, 0),
      queryFn: () => api.repositories.getCommits(owner, name, currentBranch, 30, 0),
    })

    queryClient.prefetchQuery({
      queryKey: queryKeys.discussions(owner, name, undefined, 20, 0),
      queryFn: () => api.discussions.list(owner, name, { limit: 20, offset: 0 }),
    })

    queryClient.prefetchQuery({
      queryKey: queryKeys.projects(owner, name),
      queryFn: () => api.projects.list(owner, name),
    })
  }, [repo, currentBranch, username, repoName, queryClient, api])

  function handleForkSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = forkName.trim().toLowerCase().replace(/ /g, "-")
    if (!trimmed) {
      toast.error("Repository name is required")
      return
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      toast.error("Invalid repository name")
      return
    }
    forkMutation.mutate(
      { name: trimmed },
      {
        onSuccess: (result) => {
          const forkRepo = result.repo
          toast.success("Repository forked")
          setIsForkDialogOpen(false)
          router.push(`/${forkRepo.owner.username}/${forkRepo.name}`)
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to fork repository")
        },
      },
    )
  }

  return (
    <div>
      {isCodeView && (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
          {isLoadingInfo || !repo ? (
            <RepoHeaderSkeleton />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="truncate text-xl font-semibold tracking-tight">
                    {repo.name}
                  </h1>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {repo.visibility}
                  </Badge>
                  <div className="flex shrink-0 items-center gap-2">
                    <StarButton repository={repo} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setIsForkDialogOpen(true)}
                      disabled={forkMutation.isPending}
                    >
                      <RiGitForkLine className="size-3.5" />
                      <span>Fork</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
                        {forkCount}
                      </span>
                    </Button>
                  </div>
                </div>
                {repo.description && (
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                )}
                {repo.forkedFrom && (
                  <p className="text-xs text-muted-foreground">
                    Forked from{" "}
                    <Link
                      href={`/${repo.forkedFrom.owner.username}/${repo.forkedFrom.name}`}
                      className="text-primary hover:underline"
                    >
                      {repo.forkedFrom.owner.username}/{repo.forkedFrom.name}
                    </Link>
                  </p>
                )}
              </div>
              <CloneUrl username={username} repoName={repo?.name || repoName} />
            </div>
          )}
        </div>
      )}

      {children}

      <Dialog open={isForkDialogOpen} onOpenChange={setIsForkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fork repository</DialogTitle>
            <DialogDescription>Choose a name for your fork.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForkSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fork-name">Repository name</FieldLabel>
                <Input
                  id="fork-name"
                  value={forkName}
                  onChange={(e) => setForkName(e.target.value)}
                  placeholder="my-fork"
                  pattern="^[a-zA-Z0-9_.-]+$"
                  required
                />
              </Field>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={forkMutation.isPending || !forkName.trim()}>
                  {forkMutation.isPending && <Spinner />}
                  {forkMutation.isPending ? "Forking..." : "Fork"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RepoHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-14" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-48" />
    </div>
  )
}

function RepoLayoutSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
      <RepoHeaderSkeleton />
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    </div>
  )
}
