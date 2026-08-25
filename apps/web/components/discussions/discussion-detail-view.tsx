"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiLockLine,
  RiPushpinLine,
} from "@remixicon/react"
import {
  useDiscussion,
  useDiscussionComments,
  useCreateDiscussionComment,
  useMarkDiscussionAnswer,
} from "@gitbruv/hooks"
import { formatRelativeTime } from "@gitbruv/lib"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { PageContainer } from "@/components/layout/page-container"
import { cn } from "@/lib/utils"

export function DiscussionDetailView() {
  const params = useParams<{ username: string; repo: string; number: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)
  const discussionNumber = parseInt(params.number, 10)

  const { data: session } = useSession()
  const [commentBody, setCommentBody] = useState("")

  const { data: discussion, isLoading: discussionLoading } = useDiscussion(
    username,
    repo,
    discussionNumber,
  )
  const { data: commentsData } = useDiscussionComments(discussion?.id || "")
  const createComment = useCreateDiscussionComment(
    discussion?.id || "",
    username,
    repo,
    discussionNumber,
  )
  const markAnswer = useMarkDiscussionAnswer(
    discussion?.id || "",
    username,
    repo,
    discussionNumber,
  )

  const comments = commentsData?.comments || []
  const isAuthor = session?.user?.id === discussion?.author.id

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()

    if (!commentBody.trim()) return

    try {
      await createComment.mutateAsync({ body: commentBody })
      setCommentBody("")
      toast.success("Comment added")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment")
    }
  }

  async function handleMarkAnswer(commentId: string) {
    try {
      await markAnswer.mutateAsync(commentId)
      toast.success("Answer updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update answer")
    }
  }

  if (discussionLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Discussion not found</p>
      </div>
    )
  }

  return (
    <PageContainer size="narrow">
      <Link
        href={`/${username}/${repo}/discussions`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
      >
        <RiArrowLeftLine className="size-4" />
        Back to discussions
      </Link>

      <div className="mb-6 rounded-xl border border-border">
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {discussion.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">
                <RiPushpinLine className="size-3" />
                Pinned
              </span>
            )}
            {discussion.isAnswered && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-500">
                <RiCheckboxCircleLine className="size-3" />
                Answered
              </span>
            )}
            {discussion.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                <RiLockLine className="size-3" />
                Locked
              </span>
            )}
            {discussion.category && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                {discussion.category.emoji} {discussion.category.name}
              </span>
            )}
          </div>

          <h1 className="mb-4 text-2xl font-semibold">{discussion.title}</h1>

          <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Avatar className="size-6">
              <AvatarImage src={discussion.author.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {discussion.author.name?.charAt(0) || discussion.author.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Link href={`/${discussion.author.username}`} className="hover:underline">
              {discussion.author.username}
            </Link>
            <span>started this discussion {formatRelativeTime(discussion.createdAt)}</span>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{discussion.body}</ReactMarkdown>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">
        {comments.length} comment{comments.length !== 1 ? "s" : ""}
      </h2>

      <div className="mb-6 flex flex-col gap-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={cn(
              "rounded-xl border border-border p-4",
              comment.isAnswer && "border-emerald-500 bg-emerald-500/5",
            )}
          >
            {comment.isAnswer && (
              <div className="mb-2 flex items-center gap-1 text-xs text-emerald-500">
                <RiCheckboxCircleLine className="size-3" />
                Accepted answer
              </div>
            )}

            <div className="flex items-start gap-3">
              <Avatar className="size-8">
                <AvatarImage src={comment.author.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {comment.author.name?.charAt(0) || comment.author.username?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Link
                      href={`/${comment.author.username}`}
                      className="font-medium hover:underline"
                    >
                      {comment.author.username}
                    </Link>
                    <span className="text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>

                  {isAuthor && !comment.isAnswer && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleMarkAnswer(comment.id)}
                      disabled={markAnswer.isPending}
                    >
                      <RiCheckboxCircleLine className="size-3" />
                      Mark as answer
                    </Button>
                  )}
                </div>

                <div className="prose prose-neutral dark:prose-invert mt-2 max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!discussion.isLocked && session?.user && (
        <form onSubmit={handleSubmitComment} className="rounded-xl border border-border p-4">
          <Textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Add a comment..."
            rows={4}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!commentBody.trim() || createComment.isPending}>
              {createComment.isPending && <Spinner />}
              {createComment.isPending ? "Posting..." : "Comment"}
            </Button>
          </div>
        </form>
      )}

      {discussion.isLocked && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          <RiLockLine className="mx-auto mb-2 size-6" />
          This discussion is locked. You cannot add new comments.
        </div>
      )}
    </PageContainer>
  )
}
