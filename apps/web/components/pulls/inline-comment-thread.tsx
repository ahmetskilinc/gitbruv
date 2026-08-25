"use client"

import { useState } from "react"
import Link from "next/link"
import { RiChat1Line, RiMore2Line } from "@remixicon/react"

import type { PRComment } from "@gitbruv/hooks"
import { formatRelativeTime } from "@gitbruv/lib"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { InlineCommentForm } from "./inline-comment-form"

export type InlineCommentThreadProps = {
  comments: PRComment[]
  onReply: (body: string, replyToId: string) => Promise<void>
  onEdit?: (commentId: string, body: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  currentUserId?: string
  isReplying?: boolean
}

function CommentItem({
  comment,
  onEdit,
  currentUserId,
}: {
  comment: PRComment
  onEdit?: (body: string) => Promise<void>
  currentUserId?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const isAuthor = currentUserId === comment.author.id

  async function handleSaveEdit() {
    if (!editBody.trim() || !onEdit) return
    await onEdit(editBody)
    setIsEditing(false)
  }

  return (
    <div className="flex gap-3 p-3">
      <Avatar className="size-6 shrink-0">
        <AvatarImage src={comment.author.avatarUrl || undefined} alt={comment.author.name} />
        <AvatarFallback className="text-xs">
          {comment.author.name?.charAt(0) || comment.author.username?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/${comment.author.username}`} className="font-medium hover:underline">
            {comment.author.username}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.createdAt !== comment.updatedAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        {isEditing ? (
          <div className="mt-2 flex flex-col gap-2">
            <Textarea
              aria-label="Edit comment"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="resize-none text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="xs" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-1 text-sm whitespace-pre-wrap text-foreground/90">
            {comment.body}
          </div>
        )}
      </div>
      {isAuthor && !isEditing && (
        <div className="flex items-start">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsEditing(true)}
            title="Edit"
            aria-label="Edit comment"
          >
            <RiMore2Line className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function InlineCommentThread({
  comments,
  onReply,
  onEdit,
  currentUserId,
  isReplying: externalIsReplying = false,
}: InlineCommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyLoading, setReplyLoading] = useState(false)

  const rootComments = comments.filter((c) => !c.replyToId)
  const replies = comments.filter((c) => c.replyToId)

  function getReplies(commentId: string): PRComment[] {
    return replies.filter((r) => r.replyToId === commentId)
  }

  async function handleReply(body: string) {
    if (comments.length === 0) return
    setReplyLoading(true)
    try {
      await onReply(body, comments[0].id)
      setIsReplying(false)
    } finally {
      setReplyLoading(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card/50">
      {rootComments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            onEdit={onEdit ? (body) => onEdit(comment.id, body) : undefined}
            currentUserId={currentUserId}
          />
          {getReplies(comment.id).map((reply) => (
            <div key={reply.id} className="ml-6 border-l-2 border-border">
              <CommentItem
                comment={reply}
                onEdit={onEdit ? (body) => onEdit(reply.id, body) : undefined}
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </div>
      ))}

      {isReplying || externalIsReplying ? (
        <div className="border-t border-border">
          <InlineCommentForm
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            isLoading={replyLoading}
            placeholder="Reply..."
            submitLabel="Reply"
          />
        </div>
      ) : (
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReplying(true)}
            className="text-muted-foreground"
          >
            <RiChat1Line className="size-4" />
            Reply
          </Button>
        </div>
      )}
    </div>
  )
}
