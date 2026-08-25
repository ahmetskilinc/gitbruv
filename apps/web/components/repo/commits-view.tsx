"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { parseAsInteger, useQueryState } from "nuqs"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiHistoryLine,
} from "@remixicon/react"
import {
  useRepositoryWithStars,
  useRepoCommits,
  useRepoBranches,
  type Commit,
} from "@gitbruv/hooks"
import { timeAgo, getCommitTitle } from "@gitbruv/lib"
import { BranchSelector } from "@/components/branch-selector"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

function CommitsSkeleton() {
  return (
    <div className="divide-y">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-4 py-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <PageContainer>
      <Skeleton className="mb-6 h-7 w-36" />
      <div className="overflow-hidden rounded-xl border">
        <CommitsSkeleton />
      </div>
    </PageContainer>
  )
}

function CommitRow({
  commit,
  username,
  repoName,
  branch,
}: {
  commit: Commit
  username: string
  repoName: string
  branch: string
}) {
  return (
    <Link
      href={`/${username}/${repoName}/commits/${encodeURIComponent(branch)}/${commit.oid}`}
      className="flex items-start gap-4 px-4 py-3 transition-colors duration-100 hover:bg-muted/30 motion-reduce:transition-none"
    >
      <Avatar className="mt-0.5 size-8">
        <AvatarImage src={commit.author.avatarUrl || undefined} />
        <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
          {commit.author.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {getCommitTitle(commit.message)}
        </p>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {commit.author.name}
          </span>
          <span>committed</span>
          <span>{timeAgo(commit.timestamp)}</span>
        </div>
      </div>
      <code className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-xs">
        {commit.oid.slice(0, 7)}
      </code>
    </Link>
  )
}

export function CommitsView() {
  const params = useParams<{ username: string; repo: string; branch: string }>()
  const username = decodeURIComponent(params.username)
  const repoName = decodeURIComponent(params.repo)
  const branch = decodeURIComponent(params.branch)

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))

  const {
    data: repo,
    isLoading: repoLoading,
    error: repoError,
  } = useRepositoryWithStars(username, repoName)

  const currentBranch = branch || repo?.defaultBranch || "main"
  const perPage = 30
  const skip = (page - 1) * perPage

  const { data: commitsData, isLoading: commitsLoading } = useRepoCommits(
    username,
    repoName,
    currentBranch,
    perPage,
    skip,
  )
  const { data: branchData } = useRepoBranches(username, repoName)

  if (repoLoading) {
    return <PageSkeleton />
  }

  if (repoError || !repo) {
    notFound()
  }

  const commits = commitsData?.commits || []
  const hasMore = commitsData?.hasMore || false

  return (
    <PageContainer>
      <PageHeader
        title="Commits"
        actions={
          <BranchSelector
            branches={branchData?.branches ?? []}
            currentBranch={currentBranch}
            defaultBranch={repo?.defaultBranch ?? "main"}
            username={username}
            repoName={repoName}
          />
        }
      />
      {commitsLoading ? (
        <div className="overflow-hidden rounded-xl border">
          <CommitsSkeleton />
        </div>
      ) : commits.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiHistoryLine />
            </EmptyMedia>
            <EmptyTitle>No commits yet</EmptyTitle>
            <EmptyDescription>
              This branch doesn&apos;t have any commits.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="divide-y">
            {commits.map((commit) => (
              <CommitRow
                key={commit.oid}
                commit={commit}
                username={username}
                repoName={repoName}
                branch={currentBranch}
              />
            ))}
          </div>

          {(page > 1 || hasMore) && (
            <div className="flex items-center justify-between border-t bg-card px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1 <= 1 ? null : page - 1)}
              >
                <RiArrowLeftSLine className="size-4" />
                Newer
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                Page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPage(page + 1)}
              >
                Older
                <RiArrowRightSLine className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
