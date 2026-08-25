"use client"

import Link from "next/link"
import {
  RiChat3Line,
  RiCheckboxCircleLine,
  RiCircleLine,
  RiEyeLine,
  RiGitBranchLine,
  RiGitCommitLine,
  RiGitForkLine,
  RiGitMergeLine,
  RiGitPullRequestLine,
  RiGitRepositoryLine,
  RiLockLine,
  RiPriceTag3Line,
  RiPulseLine,
} from "@remixicon/react"
import { timeAgo } from "@gitbruv/lib"
import type { Activity } from "@gitbruv/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type IconComponent = React.ComponentType<{ className?: string }>

const TYPE_ICONS: Record<string, { icon: IconComponent; className?: string }> = {
  push: { icon: RiGitCommitLine },
  branch_created: { icon: RiGitBranchLine },
  repo_created: { icon: RiGitRepositoryLine },
  repo_forked: { icon: RiGitForkLine },
  release_published: { icon: RiPriceTag3Line, className: "text-purple-500" },
  issue_opened: { icon: RiCircleLine, className: "text-emerald-500" },
  issue_closed: { icon: RiCheckboxCircleLine, className: "text-purple-500" },
  pr_opened: { icon: RiGitPullRequestLine, className: "text-emerald-500" },
  pr_merged: { icon: RiGitMergeLine, className: "text-purple-500" },
  pr_review: { icon: RiEyeLine },
  discussion_created: { icon: RiChat3Line },
}

function RepoLink({ activity }: { activity: Activity }) {
  const { owner, name } = activity.repo
  return (
    <Link
      href={`/${owner}/${name}`}
      className="font-medium text-foreground hover:text-primary hover:underline"
    >
      {owner}/{name}
    </Link>
  )
}

function NumberedLink({
  activity,
  section,
}: {
  activity: Activity
  section: "issues" | "pulls" | "discussions"
}) {
  const { owner, name } = activity.repo
  const number = activity.payload?.number
  return (
    <Link
      href={`/${owner}/${name}/${section}/${number}`}
      className="font-medium text-foreground hover:text-primary hover:underline"
    >
      #{number}
    </Link>
  )
}

function TitleSuffix({ activity }: { activity: Activity }) {
  if (!activity.payload?.title) return null
  return <span className="text-muted-foreground">: {activity.payload.title}</span>
}

function ActivitySentence({ activity }: { activity: Activity }) {
  const payload = activity.payload ?? {}
  const { owner, name } = activity.repo

  switch (activity.type) {
    case "push": {
      const n = payload.commitCount ?? 1
      const capped = payload.commitCountCapped
      return (
        <>
          pushed {capped && n >= 20 ? "20+" : n} commit{n === 1 && !capped ? "" : "s"} to{" "}
          <Link
            href={`/${owner}/${name}/tree/${encodeURIComponent(payload.branch ?? "")}`}
            className="rounded-md bg-muted px-1 py-0.5 font-mono text-xs text-foreground hover:text-primary"
          >
            {payload.branch}
          </Link>{" "}
          in <RepoLink activity={activity} />
        </>
      )
    }
    case "branch_created":
      return (
        <>
          created branch{" "}
          <Link
            href={`/${owner}/${name}/tree/${encodeURIComponent(payload.branch ?? "")}`}
            className="rounded-md bg-muted px-1 py-0.5 font-mono text-xs text-foreground hover:text-primary"
          >
            {payload.branch}
          </Link>{" "}
          in <RepoLink activity={activity} />
        </>
      )
    case "repo_created":
      return (
        <>
          created repository <RepoLink activity={activity} />
        </>
      )
    case "repo_forked":
      return (
        <>
          forked{" "}
          <Link
            href={`/${payload.forkedFromOwner}/${payload.forkedFromName}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {payload.forkedFromOwner}/{payload.forkedFromName}
          </Link>{" "}
          to <RepoLink activity={activity} />
        </>
      )
    case "release_published":
      return (
        <>
          published release{" "}
          <Link
            href={`/${owner}/${name}/releases`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {payload.tagName}
          </Link>{" "}
          in <RepoLink activity={activity} />
        </>
      )
    case "issue_opened":
      return (
        <>
          opened issue <NumberedLink activity={activity} section="issues" /> in{" "}
          <RepoLink activity={activity} />
          <TitleSuffix activity={activity} />
        </>
      )
    case "issue_closed":
      return (
        <>
          closed issue <NumberedLink activity={activity} section="issues" /> in{" "}
          <RepoLink activity={activity} />
          <TitleSuffix activity={activity} />
        </>
      )
    case "pr_opened":
      return (
        <>
          opened pull request <NumberedLink activity={activity} section="pulls" /> in{" "}
          <RepoLink activity={activity} />
          <TitleSuffix activity={activity} />
        </>
      )
    case "pr_merged":
      return (
        <>
          merged pull request <NumberedLink activity={activity} section="pulls" /> in{" "}
          <RepoLink activity={activity} />
          <TitleSuffix activity={activity} />
        </>
      )
    case "pr_review": {
      const verb =
        payload.state === "approved"
          ? "approved"
          : payload.state === "changes_requested"
            ? "requested changes on"
            : "reviewed"
      return (
        <>
          {verb} pull request <NumberedLink activity={activity} section="pulls" /> in{" "}
          <RepoLink activity={activity} />
        </>
      )
    }
    case "discussion_created":
      return (
        <>
          started discussion <NumberedLink activity={activity} section="discussions" /> in{" "}
          <RepoLink activity={activity} />
          <TitleSuffix activity={activity} />
        </>
      )
    default:
      return (
        <>
          did something in <RepoLink activity={activity} />
        </>
      )
  }
}

export function ActivityRow({
  activity,
  showActor = false,
}: {
  activity: Activity
  showActor?: boolean
}) {
  const meta = TYPE_ICONS[activity.type] ?? { icon: RiPulseLine }
  const reviewClassName =
    activity.type === "pr_review"
      ? activity.payload?.state === "approved"
        ? "text-emerald-500"
        : activity.payload?.state === "changes_requested"
          ? "text-red-500"
          : undefined
      : undefined
  const Icon = meta.icon

  return (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors duration-100 hover:bg-muted/40 motion-reduce:transition-none">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0 text-muted-foreground",
          meta.className,
          reviewClassName,
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">
          {showActor && (
            <>
              <Link
                href={`/${activity.actor.username}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {activity.actor.username}
              </Link>{" "}
            </>
          )}
          <ActivitySentence activity={activity} />
          {activity.repo.visibility === "private" && (
            <RiLockLine
              aria-label="Private repository"
              className="ml-1.5 inline size-3 align-[-1px] text-muted-foreground"
            />
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(activity.createdAt)}</p>
      </div>
    </div>
  )
}

export function ActivityList({ children }: { children: React.ReactNode }) {
  return <div className="divide-y overflow-hidden rounded-xl border">{children}</div>
}

export function ActivityListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
          <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-4 w-72" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
