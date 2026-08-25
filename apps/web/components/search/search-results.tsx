"use client"

import Link from "next/link"
import {
  RiBookOpenLine,
  RiErrorWarningLine,
  RiGitPullRequestLine,
  RiUserLine,
} from "@remixicon/react"
import { formatRelativeTime } from "@gitbruv/lib"
import type { SearchResult } from "@gitbruv/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const typeIcons = {
  repository: RiBookOpenLine,
  issue: RiErrorWarningLine,
  pull_request: RiGitPullRequestLine,
  user: RiUserLine,
}

const typeLabels = {
  repository: "Repository",
  issue: "Issue",
  pull_request: "Pull Request",
  user: "User",
}

export function SearchResultItem({ result }: { result: SearchResult }) {
  const Icon = typeIcons[result.type]

  return (
    <Link
      href={result.url}
      className="flex items-start gap-4 border-b p-4 transition-colors duration-100 last:border-b-0 hover:bg-muted/50 motion-reduce:transition-none"
    >
      <div className="mt-1">
        {result.type === "user" && result.owner ? (
          <Avatar className="size-8">
            <AvatarImage src={result.owner.avatarUrl || undefined} />
            <AvatarFallback>{result.title.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium hover:underline">{result.title}</span>
          {result.number && (
            <span className="text-muted-foreground">#{result.number}</span>
          )}
          {result.state && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                result.state === "open" && "border-emerald-500/50 text-emerald-500",
                result.state === "closed" && "border-destructive/50 text-destructive",
                result.state === "merged" && "border-purple-500/50 text-purple-500",
              )}
            >
              {result.state}
            </Badge>
          )}
        </div>

        {result.repository && (
          <div className="mt-0.5 text-sm text-muted-foreground">
            {result.repository.owner}/{result.repository.name}
          </div>
        )}

        {result.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {result.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{typeLabels[result.type]}</span>
          <span>{formatRelativeTime(result.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}

export function SearchResultsList({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">No results found</div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      {results.map((result) => (
        <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
      ))}
    </div>
  )
}
