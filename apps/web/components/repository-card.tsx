"use client"

import Link from "next/link"
import { RiTimeLine } from "@remixicon/react"
import { formatDate } from "@gitbruv/lib"
import { type RepositoryWithStars } from "@gitbruv/hooks"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarButton } from "@/components/star-button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function RepositoryCard({
  repository,
  showOwner = false,
}: {
  repository: RepositoryWithStars
  showOwner?: boolean
}) {
  return (
    <Card className="gap-2 py-4 transition-[background-color,box-shadow] duration-150 ease-out-expo hover:bg-muted/40 motion-reduce:transition-none">
      <CardHeader className="flex flex-row items-start gap-3 px-4">
        <Link
          href={`/${repository.owner.username}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Avatar className="size-10">
            <AvatarImage
              src={repository.owner.avatarUrl || undefined}
              alt={repository.name || "Repository owner"}
              className="transition-opacity hover:opacity-80"
            />
            <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
              {(repository.owner.name || repository.owner.username)
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-sm/5 font-semibold">
              {showOwner ? (
                <>
                  <Link
                    href={`/${repository.owner.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {repository.owner.username}
                  </Link>
                  <span className="mx-0.5 text-muted-foreground">/</span>
                  <Link
                    href={`/${repository.owner.username}/${repository.name}`}
                    className="text-foreground hover:text-primary hover:underline"
                  >
                    {repository.name}
                  </Link>
                </>
              ) : (
                <Link
                  href={`/${repository.owner.username}/${repository.name}`}
                  className="hover:text-primary hover:underline"
                >
                  {repository.name}
                </Link>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {repository.visibility === "private" && (
                <Badge variant="outline">Private</Badge>
              )}
              <StarButton repository={repository} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pl-[4.25rem]">
        <p className="line-clamp-2 text-sm/5 text-muted-foreground">
          {repository.description || "No description"}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs/4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <RiTimeLine className="size-3" />
            <span>{formatDate(repository.createdAt, "MMM d, yyyy")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
