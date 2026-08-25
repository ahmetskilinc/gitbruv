"use client"

// Local comment list/item/form for the PR conversation. The old app reused
// components/issues/{comment-list,comment-item,comment-form} here; those are
// being rebuilt in parallel by another agent, so pulls/ carries its own copy.

import { useState } from "react"
import Link from "next/link"
import { RiDeleteBinLine, RiMoreLine, RiPencilLine } from "@remixicon/react"

import type { PRComment } from "@gitbruv/hooks"
import { timeAgo } from "@gitbruv/lib"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownBody } from "./markdown"
import { ReactionPicker } from "./pickers"

type PRCommentItemProps = {
  comment: PRComment
  currentUserId?: string
  onToggleReaction: (emoji: string) => void
  onUpdate: (body: string) => Promise<void>
  onDelete: () => Promise<void>
}

export function PRCommentItem({
  comment,
  currentUserId,
  onToggleReaction,
  onUpdate,
  onDelete,
}: PRCommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAuthor = currentUserId === comment.author.id
  const isEdited = comment.createdAt !== comment.updatedAt

  const handleUpdate = async () => {
    if (!editBody.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onUpdate(editBody)
      setIsEditing(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onDelete()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-5">
            <AvatarImage src={comment.author.avatarUrl || undefined} />
            <AvatarFallback className="text-[10px]">
              {comment.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/${comment.author.username}`}
            className="text-sm font-medium transition-colors duration-100 hover:text-primary motion-reduce:transition-none"
          >
            {comment.author.username}
          </Link>
          <span className="text-xs text-muted-foreground">
            commented {timeAgo(comment.createdAt)}
          </span>
          {isEdited && <span className="text-xs text-muted-foreground">(edited)</span>}
        </div>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Comment actions" />}
            >
              <RiMoreLine />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <RiPencilLine />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <RiDeleteBinLine />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="p-4">
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleUpdate} disabled={isSubmitting || !editBody.trim()}>
                {isSubmitting ? "Updating..." : "Update comment"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setEditBody(comment.body)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <MarkdownBody>{comment.body}</MarkdownBody>
        )}
      </div>

      <div className="px-4 pb-3">
        <ReactionPicker
          reactions={comment.reactions}
          onToggle={onToggleReaction}
          disabled={!currentUserId}
        />
      </div>
    </div>
  )
}

type PRCommentListProps = {
  comments: PRComment[]
  currentUserId?: string
  onToggleReaction: (commentId: string, emoji: string) => void
  onUpdateComment: (commentId: string, body: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
}

export function PRCommentList({
  comments,
  currentUserId,
  onToggleReaction,
  onUpdateComment,
  onDeleteComment,
}: PRCommentListProps) {
  if (comments.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment) => (
        <PRCommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onToggleReaction={(emoji) => onToggleReaction(comment.id, emoji)}
          onUpdate={(body) => onUpdateComment(comment.id, body)}
          onDelete={() => onDeleteComment(comment.id)}
        />
      ))}
    </div>
  )
}

type PRCommentFormProps = {
  currentUserAvatar?: string | null
  currentUserName?: string
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
  submitLabel?: string
}

export function PRCommentForm({
  currentUserAvatar,
  currentUserName,
  onSubmit,
  placeholder = "Leave a comment...",
  submitLabel = "Comment",
}: PRCommentFormProps) {
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!body.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(body)
      setBody("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex gap-3">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={currentUserAvatar || undefined} />
        <AvatarFallback className="text-xs">{currentUserName?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting || !body.trim()}>
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
