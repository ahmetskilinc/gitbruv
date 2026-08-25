"use client"

import Link from "next/link"
import {
  RiChat1Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiGitPullRequestLine,
  RiUserLine,
} from "@remixicon/react"
import { formatRelativeTime } from "@gitbruv/lib"
import type { Notification } from "@gitbruv/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  issue_comment: RiChat1Line,
  issue_assigned: RiErrorWarningLine,
  issue_closed: RiCheckboxCircleLine,
  pr_comment: RiChat1Line,
  pr_review: RiGitPullRequestLine,
  pr_merged: RiGitPullRequestLine,
  pr_assigned: RiGitPullRequestLine,
  mention: RiUserLine,
  discussion_reply: RiChat1Line,
}

function getNotificationUrl(notification: Notification): string {
  if (
    !notification.repoOwner ||
    !notification.repoName ||
    !notification.resourceNumber
  ) {
    return "/"
  }

  const basePath = `/${notification.repoOwner}/${notification.repoName}`

  switch (notification.resourceType) {
    case "issue":
      return `${basePath}/issues/${notification.resourceNumber}`
    case "pull_request":
      return `${basePath}/pulls/${notification.resourceNumber}`
    case "discussion":
      return `${basePath}/discussions/${notification.resourceNumber}`
    default:
      return basePath
  }
}

export function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead?: () => void
}) {
  const Icon = typeIcons[notification.type] || RiChat1Line
  const url = getNotificationUrl(notification)

  function handleClick() {
    if (!notification.read && onMarkRead) {
      onMarkRead()
    }
  }

  return (
    <Link
      href={url}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-3 transition-colors duration-100 hover:bg-muted/50 motion-reduce:transition-none",
        !notification.read && "bg-primary/5",
      )}
    >
      <div className="mt-0.5">
        {notification.actor ? (
          <Avatar className="size-8">
            <AvatarImage src={notification.actor.avatarUrl || undefined} />
            <AvatarFallback>
              {notification.actor.name?.charAt(0) ||
                notification.actor.username?.charAt(0) ||
                "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm", !notification.read && "font-medium")}>
            {notification.title}
          </p>
          {!notification.read && (
            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>

        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {notification.body}
          </p>
        )}

        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {notification.repoOwner && notification.repoName && (
            <span>
              {notification.repoOwner}/{notification.repoName}
            </span>
          )}
          <span>{formatRelativeTime(notification.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
