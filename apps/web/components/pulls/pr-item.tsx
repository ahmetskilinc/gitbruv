"use client"

import Link from "next/link"
import { RiChat1Line, RiGitBranchLine, RiGitMergeLine } from "@remixicon/react"

import type { PullRequest } from "@gitbruv/hooks"
import { timeAgo } from "@gitbruv/lib"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PRStateBadge } from "./pr-state-badge"
import { LabelBadge } from "./pickers"

type PRItemProps = {
  pullRequest: PullRequest
  username: string
  repo: string
}

export function PRItem({ pullRequest, username, repo }: PRItemProps) {
  const prHref = `/${username}/${repo}/pulls/${pullRequest.number}`

  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3 transition-colors duration-100 last:border-b-0 hover:bg-muted/30 motion-reduce:transition-none">
      <PRStateBadge
        state={pullRequest.state}
        merged={pullRequest.merged}
        isDraft={pullRequest.isDraft}
        className="mt-0.5 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <Link
            href={prHref}
            className="font-semibold text-foreground transition-colors duration-100 hover:text-primary motion-reduce:transition-none"
          >
            {pullRequest.title}
          </Link>
          {pullRequest.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>#{pullRequest.number}</span>
          <span>opened {timeAgo(pullRequest.createdAt)}</span>
          <span>by</span>
          <Link
            href={`/${pullRequest.author.username}`}
            className="transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
          >
            {pullRequest.author.username}
          </Link>
        </div>

        <div className="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <RiGitBranchLine className="size-3" />
          <span>{pullRequest.headBranch}</span>
          <RiGitMergeLine className="mx-1 size-3" />
          <span>{pullRequest.baseBranch}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {pullRequest.reviews.length > 0 && (
          <div className="flex items-center gap-1">
            {pullRequest.reviews.some((r) => r.state === "approved") && (
              <span className="text-xs text-emerald-500">Approved</span>
            )}
            {pullRequest.reviews.some((r) => r.state === "changes_requested") && (
              <span className="text-xs text-red-500">Changes requested</span>
            )}
          </div>
        )}

        {pullRequest.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {pullRequest.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.id} className="size-5 border-2 border-background">
                <AvatarImage src={assignee.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px]">
                  {assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {pullRequest.assignees.length > 3 && (
              <span className="flex size-5 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-medium">
                +{pullRequest.assignees.length - 3}
              </span>
            )}
          </div>
        )}

        {pullRequest.commentCount > 0 && (
          <Link
            href={prHref}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
          >
            <RiChat1Line className="size-3.5" />
            <span>{pullRequest.commentCount}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
