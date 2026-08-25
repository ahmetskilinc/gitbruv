"use client"

import { useParams } from "next/navigation"
import { RiBookOpenLine, RiGitBranchLine } from "@remixicon/react"
import {
  useRepoCommits,
  useRepoReadme,
  useRepoReadmeOid,
  useRepositoryInfo,
  useRepoTree,
  useTreeCommits,
} from "@gitbruv/hooks"
import { CloneUrl } from "@/components/clone-url"
import { CodeViewer } from "@/components/code-viewer"
import { FileTree } from "@/components/file-tree"
import {
  LastCommitBar,
  LastCommitBarSkeleton,
} from "@/components/repo/last-commit-bar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageContainer } from "@/components/layout/page-container"

export function RepoHome() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repoName = decodeURIComponent(params.repo)

  const { data: repoInfo } = useRepositoryInfo(username, repoName)
  const defaultBranch = repoInfo?.repo.defaultBranch || "main"
  const currentBranch = defaultBranch

  const { data: treeData, isLoading: isLoadingTree } = useRepoTree(
    username,
    repoName,
    currentBranch,
  )
  const { data: treeCommitsData, isLoading: isLoadingTreeCommits } =
    useTreeCommits(username, repoName, currentBranch)
  const { data: readmeOidData, isLoading: isLoadingReadmeOid } = useRepoReadmeOid(
    username,
    repoName,
    currentBranch,
  )
  const { data: commitData, isLoading: isLoadingLastCommit } = useRepoCommits(
    username,
    repoName,
    currentBranch,
    1,
  )

  const repo = repoInfo?.repo
  const files = treeData?.files || []
  const isEmpty = treeData?.isEmpty ?? true
  const treeCommits = treeCommitsData?.files
  const readmeOid = readmeOidData?.readmeOid
  const lastCommit = commitData?.commits?.[0]

  return (
    <PageContainer size="wide" className="flex flex-col gap-4 pt-0">
      {isLoadingLastCommit ? (
        <LastCommitBarSkeleton />
      ) : (
        <LastCommitBar lastCommit={lastCommit} />
      )}

      {isLoadingTree ? (
        <FileTreeSkeleton />
      ) : isEmpty ? (
        <EmptyRepoState username={username} repoName={repo?.name || repoName} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <FileTree
            files={files}
            username={username}
            repoName={repo?.name || repoName}
            branch={currentBranch}
            commits={treeCommits}
            isLoadingCommits={isLoadingTreeCommits}
          />
        </div>
      )}

      {isLoadingReadmeOid ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <ReadmeSkeleton />
        </div>
      ) : readmeOid ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <RiBookOpenLine className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">README.md</span>
          </div>
          <ReadmeContent
            username={username}
            repoName={repoName}
            readmeOid={readmeOid}
          />
        </div>
      ) : null}
    </PageContainer>
  )
}

function FileTreeSkeleton() {
  const fileWidths = ["32%", "28%", "45%", "24%", "38%", "31%"]

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b px-5 py-2.5 last:border-b-0"
        >
          <Skeleton className="size-4 shrink-0" />
          <Skeleton className="h-4" style={{ width: fileWidths[i] || "35%" }} />
        </div>
      ))}
    </div>
  )
}

function ReadmeSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6 md:p-8">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

function EmptyRepoState({
  username,
  repoName,
}: {
  username: string
  repoName: string
}) {
  return (
    <Empty className="border border-dashed py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiGitBranchLine />
        </EmptyMedia>
        <EmptyTitle>This repository is empty</EmptyTitle>
        <EmptyDescription>
          Get started by cloning this repository and pushing your first commit.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CloneUrl username={username} repoName={repoName} />
      </EmptyContent>
    </Empty>
  )
}

function ReadmeContent({
  username,
  repoName,
  readmeOid,
}: {
  username: string
  repoName: string
  readmeOid: string
}) {
  const { data, isLoading } = useRepoReadme(username, repoName, readmeOid)

  if (isLoading) {
    return <ReadmeSkeleton />
  }

  if (!data?.content) return null

  return <CodeViewer content={data.content} language="markdown" />
}
