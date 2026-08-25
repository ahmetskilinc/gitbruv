"use client"

import Link from "next/link"
import { RiChat1Line } from "@remixicon/react"
import { timeAgo } from "@gitbruv/lib"
import type { Issue } from "@gitbruv/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StateIcon } from "./state-badge"
import { LabelBadge } from "./label-badge"

interface IssueItemProps {
  issue: Issue
  username: string
  repo: string
}

export function IssueItem({ issue, username, repo }: IssueItemProps) {
  const issueHref = `/${username}/${repo}/issues/${issue.number}`

  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3 transition-colors duration-100 last:border-b-0 hover:bg-muted/30 motion-reduce:transition-none">
      <StateIcon state={issue.state} className="mt-1 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={issueHref}
            className="font-medium text-foreground transition-colors duration-100 hover:text-primary motion-reduce:transition-none"
          >
            {issue.title}
          </Link>
          {issue.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>#{issue.number}</span>
          <span>opened {timeAgo(issue.createdAt)}</span>
          <span>by</span>
          <Link
            href={`/${issue.author.username}`}
            className="transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
          >
            {issue.author.username}
          </Link>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {issue.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {issue.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.id} className="size-5 border-2 border-background">
                <AvatarImage src={assignee.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px]">{assignee.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {issue.assignees.length > 3 && (
              <span className="flex size-5 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-medium">
                +{issue.assignees.length - 3}
              </span>
            )}
          </div>
        )}

        {issue.commentCount > 0 && (
          <Link
            href={issueHref}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
          >
            <RiChat1Line className="size-3.5" />
            <span>{issue.commentCount}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
