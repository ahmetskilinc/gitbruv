"use client"

import { useState } from "react"
import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { RiGitCommitLine } from "@remixicon/react"
import { useCommitDiff, useRepositoryWithStars } from "@gitbruv/hooks"
import { timeAgo, cn } from "@gitbruv/lib"
import {
  DiffToolbar,
  DiffViewer,
  FilePickerSidebar,
  useFileNavigation,
  type DiffViewMode,
} from "@/components/diff-viewer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

function DiffSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border">
          <Skeleton className="h-10 rounded-none" />
          <div className="flex flex-col gap-1 p-2">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-5 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CommitHeaderSkeleton() {
  return (
    <div className="flex items-start gap-4 p-6">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <div className="mb-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="rounded-xl border">
          <CommitHeaderSkeleton />
        </div>
      </div>
      <DiffSkeleton />
    </div>
  )
}

function StatCell({
  label,
  sub,
  mono,
  children,
}: {
  label: string
  sub?: React.ReactNode
  mono?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 px-4 py-3">
      <span className="text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className={cn("truncate text-sm font-medium", mono && "font-mono")}>
        {children}
      </span>
      {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

export function CommitDetail() {
  const params = useParams<{
    username: string
    repo: string
    branch: string
    oid: string
  }>()
  const username = decodeURIComponent(params.username)
  const repoName = decodeURIComponent(params.repo)
  const branch = decodeURIComponent(params.branch)
  const oid = decodeURIComponent(params.oid)

  const [viewMode, setViewMode] = useState<DiffViewMode>("unified")
  const [fullWidth, setFullWidth] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const { fileRefs, selectedFile, scrollToFile } = useFileNavigation()

  const {
    data: repo,
    isLoading: repoLoading,
    error: repoError,
  } = useRepositoryWithStars(username, repoName)
  const {
    data: diffData,
    isLoading: diffLoading,
    error: diffError,
  } = useCommitDiff(username, repoName, oid)

  if (repoLoading) {
    return <PageSkeleton />
  }

  if (repoError || !repo) {
    notFound()
  }

  const commit = diffData?.commit
  const files = diffData?.files || []
  const stats = diffData?.stats

  return (
    <div
      className={cn(
        "w-full px-4 py-6 sm:px-6",
        !fullWidth && "mx-auto max-w-7xl",
      )}
    >
      <div className="mb-6">
        <div className="overflow-hidden rounded-xl border">
          <div className="flex items-center gap-2 border-b bg-card px-4 py-3">
            <RiGitCommitLine className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Commit</span>
            <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
              {oid.slice(0, 7)}
            </code>
          </div>

          {diffLoading ? (
            <CommitHeaderSkeleton />
          ) : diffError || !commit ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Failed to load commit details
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="size-10">
                  <AvatarImage src={commit.author.avatarUrl || undefined} />
                  <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
                    {commit.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium break-words whitespace-pre-wrap">
                    {commit.message}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    {commit.author.username ? (
                      <Link
                        href={`/${commit.author.username}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {commit.author.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">
                        {commit.author.name}
                      </span>
                    )}
                    <span>committed</span>
                    <span>{timeAgo(commit.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {commit && (
        <div className="mb-6 grid grid-cols-2 divide-x divide-y overflow-hidden rounded-xl border sm:grid-cols-4 sm:divide-y-0">
          <StatCell label="Committed" sub={commit.author.name}>
            {new Date(commit.timestamp).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </StatCell>
          <StatCell label="Commit" mono>
            {oid}
          </StatCell>
          {diffData?.parent && (
            <StatCell label="Parent" mono>
              <Link
                href={`/${username}/${repoName}/commits/${encodeURIComponent(branch)}/${diffData.parent}`}
                className="text-primary hover:underline"
              >
                {diffData.parent.slice(0, 7)}
              </Link>
            </StatCell>
          )}
          {stats && (
            <StatCell
              label="Changes"
              sub={
                <>
                  <span className="text-emerald-500">+{stats.additions}</span>{" "}
                  <span className="text-red-500">−{stats.deletions}</span>
                </>
              }
            >
              {stats.filesChanged} file{stats.filesChanged !== 1 ? "s" : ""}
            </StatCell>
          )}
        </div>
      )}

      {stats && (
        <DiffToolbar
          stats={stats}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          fullWidth={fullWidth}
          onFullWidthChange={setFullWidth}
          showSidebar={showSidebar}
          onShowSidebarChange={setShowSidebar}
        />
      )}

      <div className="flex gap-4">
        {showSidebar && files.length > 0 && (
          <div className="sticky top-6 max-h-[calc(100svh-8rem)] w-72 shrink-0 self-start">
            <FilePickerSidebar
              files={files}
              selectedFile={selectedFile}
              onFileSelect={scrollToFile}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {diffLoading ? (
            <DiffSkeleton />
          ) : (
            <DiffViewer files={files} viewMode={viewMode} fileRefs={fileRefs} />
          )}
        </div>
      </div>
    </div>
  )
}
