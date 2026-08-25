"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiDiscussLine,
  RiPushpinLine,
} from "@remixicon/react"
import { useDiscussions } from "@gitbruv/hooks"
import { formatRelativeTime } from "@gitbruv/lib"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

export function DiscussionsListView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)

  const { data, isLoading } = useDiscussions(username, repo)

  const discussions = data?.discussions || []

  return (
    <PageContainer>
      <PageHeader
        title="Discussions"
        actions={
          discussions.length > 0 && (
            <Button render={<Link href={`/${username}/${repo}/discussions/new`} />}>
              <RiAddLine className="size-4" />
              New discussion
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-muted-foreground" />
        </div>
      ) : discussions.length === 0 ? (
        <Empty className="border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiDiscussLine />
            </EmptyMedia>
            <EmptyTitle>No discussions yet</EmptyTitle>
            <EmptyDescription>
              Start a discussion to engage with the community.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href={`/${username}/${repo}/discussions/new`} />}>
              <RiAddLine className="size-4" />
              New discussion
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
          {discussions.map((discussion) => (
            <Link
              key={discussion.id}
              href={`/${username}/${repo}/discussions/${discussion.number}`}
              className="flex items-start gap-4 px-4 py-3 transition-colors duration-100 hover:bg-muted/30 motion-reduce:transition-none"
            >
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={discussion.author.avatarUrl || undefined} />
                <AvatarFallback>
                  {discussion.author.name?.charAt(0) || discussion.author.username?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {discussion.isPinned && (
                    <RiPushpinLine className="size-4 text-amber-500" />
                  )}
                  {discussion.isAnswered && (
                    <RiCheckboxCircleLine className="size-4 text-emerald-500" />
                  )}
                  <span className="font-medium hover:text-primary">{discussion.title}</span>
                  {discussion.category && (
                    <Badge variant="secondary">
                      {discussion.category.emoji} {discussion.category.name}
                    </Badge>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>#{discussion.number}</span>
                  <span>by {discussion.author.username}</span>
                  <span>{formatRelativeTime(discussion.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <RiDiscussLine className="size-3.5" />
                    {discussion.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
