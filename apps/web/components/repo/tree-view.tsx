"use client"

import { notFound, useParams } from "next/navigation"
import {
  useRepositoryWithStars,
  useRepoTree,
  useTreeCommits,
} from "@gitbruv/hooks"
import { FileTree } from "@/components/file-tree"
import { PathBreadcrumb } from "@/components/repo/path-breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"

function TreeSkeleton() {
  return (
    <div className="divide-y">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <Skeleton className="size-4 shrink-0" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="ml-auto hidden h-4 w-1/3 sm:block" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <PageContainer size="wide" className="pt-0">
      <div className="overflow-hidden rounded-xl border">
        <div className="h-10 border-b bg-muted/30" />
        <TreeSkeleton />
      </div>
    </PageContainer>
  )
}

export function TreeView() {
  const params = useParams<{ username: string; repo: string; path?: string[] }>()
  const username = decodeURIComponent(params.username)
  const repoName = decodeURIComponent(params.repo)
  const pathSegments = (params.path ?? []).map((segment) =>
    decodeURIComponent(segment),
  )

  const branch = pathSegments[0] || "main"
  const dirPath = pathSegments.slice(1).join("/")

  const {
    data: repo,
    isLoading: repoLoading,
    error: repoError,
  } = useRepositoryWithStars(username, repoName)
  const {
    data: treeData,
    isLoading: treeLoading,
    error: treeError,
  } = useRepoTree(username, repoName, branch, dirPath)
  const { data: treeCommitsData, isLoading: isLoadingTreeCommits } =
    useTreeCommits(username, repoName, branch, dirPath)

  if (repoLoading) {
    return <PageSkeleton />
  }

  if (repoError || !repo) {
    notFound()
  }

  const pathParts = dirPath.split("/").filter(Boolean)
  const treeCommits = treeCommitsData?.files

  return (
    <PageContainer size="wide" className="pt-0">
      <div className="overflow-hidden rounded-xl border">
        <PathBreadcrumb
          username={username}
          repoName={repoName}
          branch={branch}
          pathParts={pathParts}
        />

        {treeLoading ? (
          <TreeSkeleton />
        ) : treeError || !treeData ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Failed to load directory
          </div>
        ) : (
          <div className="overflow-hidden bg-card">
            <FileTree
              files={treeData.files}
              username={username}
              repoName={repoName}
              branch={branch}
              commits={treeCommits}
              isLoadingCommits={isLoadingTreeCommits}
            />
          </div>
        )}
      </div>
    </PageContainer>
  )
}
