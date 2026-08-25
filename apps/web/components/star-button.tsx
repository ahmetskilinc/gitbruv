"use client"

import { RiStarFill, RiStarLine } from "@remixicon/react"
import { type RepositoryWithStars, useStarRepository } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function StarButton({
  repository,
  className,
}: {
  repository: RepositoryWithStars
  className?: string
}) {
  const { isStarred, isLoading, starCount, toggleStar, isMutating } =
    useStarRepository(repository.id, repository.starCount)

  if (isLoading) {
    return <Skeleton className={cn("h-8 w-24 rounded-lg", className)} />
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleStar()}
      disabled={isMutating}
      className={cn("gap-1.5", className)}
    >
      {isStarred ? (
        <RiStarFill className="size-3.5 text-amber-500" />
      ) : (
        <RiStarLine className="size-3.5 text-muted-foreground" />
      )}
      <span>{isStarred ? "Starred" : "Star"}</span>
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
        {starCount}
      </span>
    </Button>
  )
}
