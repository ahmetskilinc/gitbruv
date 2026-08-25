"use client"

import Link from "next/link"
import { timeAgo } from "@gitbruv/lib"
import { type RepositoryWithStars } from "@gitbruv/hooks"
import { Badge } from "@/components/ui/badge"
import { StarButton } from "@/components/star-button"

/**
 * Compact repository list row — the standard list surface for repo
 * collections (home, profile). Star action is hover/focus-revealed.
 */
export function RepoRow({
  repo,
  username,
  showOwner = false,
}: {
  repo: RepositoryWithStars
  /** Fallback owner for the link when the repo payload has no owner. */
  username?: string
  showOwner?: boolean
}) {
  const owner = repo.owner?.username ?? username ?? ""

  return (
    <div className="group/row flex items-start gap-4 px-4 py-3 transition-colors duration-100 hover:bg-muted/40 motion-reduce:transition-none">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/${owner}/${repo.name}`}
            className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
          >
            {showOwner && (
              <span className="font-normal text-muted-foreground">{owner}/</span>
            )}
            {repo.name}
          </Link>
          <Badge variant="outline" className="shrink-0 capitalize">
            {repo.visibility}
          </Badge>
        </div>
        {repo.description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {repo.description}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Updated {timeAgo(repo.updatedAt)}
        </p>
      </div>
      <div className="shrink-0">
        <StarButton repository={repo} />
      </div>
    </div>
  )
}

export function RepoRowList({ children }: { children: React.ReactNode }) {
  return <div className="divide-y overflow-hidden rounded-lg border">{children}</div>
}
