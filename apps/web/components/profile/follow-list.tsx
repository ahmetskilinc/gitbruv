"use client"

import { useState } from "react"
import Link from "next/link"
import { RiGroupLine } from "@remixicon/react"
import { useFollowers, useFollowing } from "@gitbruv/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

const PAGE_SIZE = 20

export function FollowList({
  username,
  mode,
}: {
  username: string
  mode: "followers" | "following"
}) {
  const [offset, setOffset] = useState(0)
  // Only the active mode's hook gets a username (the other stays disabled).
  const followers = useFollowers(mode === "followers" ? username : "", {
    limit: PAGE_SIZE,
    offset,
  })
  const following = useFollowing(mode === "following" ? username : "", {
    limit: PAGE_SIZE,
    offset,
  })
  const { data, isLoading } = mode === "followers" ? followers : following

  const items = data?.users ?? []
  const hasMore = data?.hasMore ?? false

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="mb-1.5 h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiGroupLine />
          </EmptyMedia>
          <EmptyTitle>
            {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
          </EmptyTitle>
          <EmptyDescription>
            {mode === "followers"
              ? "People who follow this user will appear here."
              : "Users this person follows will appear here."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="divide-y overflow-hidden rounded-xl border">
        {items.map((user) => (
          <div
            key={user.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors duration-100 hover:bg-muted/40 motion-reduce:transition-none"
          >
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${user.username}`}
                  className="truncate text-sm font-semibold hover:text-primary hover:underline"
                >
                  {user.name}
                </Link>
                <span className="shrink-0 text-sm text-muted-foreground">
                  @{user.username}
                </span>
              </div>
              {user.bio && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.bio}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {(offset > 0 || hasMore) && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            Newer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Older
          </Button>
        </div>
      )}
    </>
  )
}
