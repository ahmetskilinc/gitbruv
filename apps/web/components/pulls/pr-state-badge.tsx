"use client"

import {
  RiDraftLine,
  RiGitClosePullRequestLine,
  RiGitMergeLine,
  RiGitPullRequestLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type PRStateBadgeProps = {
  state: "open" | "closed" | "merged"
  merged?: boolean
  isDraft?: boolean
  className?: string
}

// PR state colors are raw palette classes on purpose — the theme carries no
// PR/merge semantics (no --merged token exists).
export function PRStateBadge({ state, merged, isDraft, className }: PRStateBadgeProps) {
  const isMerged = merged || state === "merged"
  const isClosed = state === "closed" && !isMerged

  const config = isMerged
    ? { icon: RiGitMergeLine, label: "Merged", classes: "bg-purple-500/10 text-purple-500" }
    : isClosed
      ? {
          icon: RiGitClosePullRequestLine,
          label: "Closed",
          classes: "bg-red-500/10 text-red-500",
        }
      : isDraft
        ? { icon: RiDraftLine, label: "Draft", classes: "bg-muted text-muted-foreground" }
        : {
            icon: RiGitPullRequestLine,
            label: "Open",
            classes: "bg-emerald-500/10 text-emerald-500",
          }

  const Icon = config.icon

  return (
    <Badge className={cn(config.classes, className)}>
      <Icon />
      {config.label}
    </Badge>
  )
}
