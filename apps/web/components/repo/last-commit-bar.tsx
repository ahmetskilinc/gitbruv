"use client"

import type { Commit } from "@gitbruv/hooks"
import { timeAgo } from "@gitbruv/lib"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

export function LastCommitBar({ lastCommit }: { lastCommit?: Commit }) {
  if (!lastCommit) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5">
      <Avatar className="size-6 shrink-0">
        <AvatarImage src={lastCommit.author.avatarUrl || undefined} />
        <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
          {lastCommit.author.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 text-sm font-medium">
          {lastCommit.author.name}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {lastCommit.message}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
        <code className="font-mono">{lastCommit.oid.substring(0, 7)}</code>
        <span>{timeAgo(lastCommit.timestamp)}</span>
      </div>
    </div>
  )
}

export function LastCommitBarSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="h-4 w-24 shrink-0" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
  )
}
