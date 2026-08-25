"use client"

import { useState } from "react"
import Link from "next/link"
import {
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiLockLine,
  RiLockUnlockLine,
  RiPencilLine,
  RiRecordCircleLine,
} from "@remixicon/react"
import { timeAgo } from "@gitbruv/lib"
import type { Issue, IssueAuthor, Label } from "@gitbruv/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MarkdownBody } from "./markdown-body"
import { ReactionPicker } from "./reaction-picker"
import { LabelPicker, AssigneePicker } from "./pickers"
import { IssueForm } from "./issue-form"

interface IssueDetailProps {
  issue: Issue
  labels: Label[]
  availableAssignees: IssueAuthor[]
  currentUserId?: string
  isOwner: boolean
  onToggleReaction: (emoji: string) => void
  onUpdate: (data: {
    title?: string
    body?: string
    state?: "open" | "closed"
    locked?: boolean
  }) => Promise<void>
  onDelete: () => Promise<void>
  onAddLabel: (labelId: string) => void
  onRemoveLabel: (labelId: string) => void
  onAddAssignee: (userId: string) => void
  onRemoveAssignee: (userId: string) => void
}

export function IssueDetail({
  issue,
  labels,
  availableAssignees,
  currentUserId,
  isOwner,
  onToggleReaction,
  onUpdate,
  onDelete,
  onAddLabel,
  onRemoveLabel,
  onAddAssignee,
  onRemoveAssignee,
}: IssueDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const canEdit = currentUserId === issue.author.id || isOwner
  const canDelete = isOwner

  const handleUpdate = async (data: { title: string; body: string }) => {
    setIsSubmitting(true)
    try {
      await onUpdate({ title: data.title, body: data.body })
      setIsEditing(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleState = async () => {
    setIsSubmitting(true)
    try {
      await onUpdate({ state: issue.state === "open" ? "closed" : "open" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLock = async () => {
    setIsSubmitting(true)
    try {
      await onUpdate({ locked: !issue.locked })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      await onDelete()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLabel = (labelId: string) => {
    const isSelected = issue.labels.some((l) => l.id === labelId)
    if (isSelected) {
      onRemoveLabel(labelId)
    } else {
      onAddLabel(labelId)
    }
  }

  const handleToggleAssignee = (userId: string) => {
    const isSelected = issue.assignees.some((a) => a.id === userId)
    if (isSelected) {
      onRemoveAssignee(userId)
    } else {
      onAddAssignee(userId)
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-border p-6">
        <IssueForm
          initialTitle={issue.title}
          initialBody={issue.body || ""}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          submitLabel="Update issue"
          isSubmitting={isSubmitting}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="flex flex-col gap-4 lg:col-span-3">
        <div className="rounded-lg border border-border">
          <div className="flex items-start justify-between border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={issue.author.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">{issue.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Link
                href={`/${issue.author.username}`}
                className="text-sm font-medium transition-colors duration-100 hover:text-primary motion-reduce:transition-none"
              >
                {issue.author.username}
              </Link>
              <span className="text-xs text-muted-foreground">
                opened this issue {timeAgo(issue.createdAt)}
              </span>
            </div>

            {canEdit && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit issue"
                  onClick={() => setIsEditing(true)}
                >
                  <RiPencilLine className="size-4" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete issue"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isSubmitting}
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="p-4">
            {issue.body ? (
              <MarkdownBody>{issue.body}</MarkdownBody>
            ) : (
              <p className="text-muted-foreground italic">No description provided.</p>
            )}
          </div>

          <div className="px-4 pb-3">
            <ReactionPicker
              reactions={issue.reactions}
              onToggle={onToggleReaction}
              disabled={!currentUserId}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {canEdit && (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleToggleState}
              disabled={isSubmitting}
            >
              {issue.state === "open" ? (
                <RiCheckboxCircleLine className="size-4" />
              ) : (
                <RiRecordCircleLine className="size-4" />
              )}
              {issue.state === "open" ? "Close issue" : "Reopen issue"}
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleToggleLock}
                disabled={isSubmitting}
              >
                {issue.locked ? (
                  <RiLockUnlockLine className="size-4" />
                ) : (
                  <RiLockLine className="size-4" />
                )}
                {issue.locked ? "Unlock conversation" : "Lock conversation"}
              </Button>
            )}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <LabelPicker
            labels={labels}
            selectedIds={issue.labels.map((l) => l.id)}
            onToggle={handleToggleLabel}
            isLoading={!canEdit}
          />
        </div>

        <div className="border-t border-border pt-4">
          <AssigneePicker
            availableUsers={availableAssignees}
            selectedIds={issue.assignees.map((a) => a.id)}
            onToggle={handleToggleAssignee}
            isLoading={!canEdit}
          />
        </div>

        {issue.state === "closed" && issue.closedBy && (
          <div className="border-t border-border pt-4">
            <span className="text-sm font-medium text-muted-foreground">Closed by</span>
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage src={issue.closedBy.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px]">
                  {issue.closedBy.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/${issue.closedBy.username}`}
                className="text-sm transition-colors duration-100 hover:text-primary motion-reduce:transition-none"
              >
                {issue.closedBy.username}
              </Link>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this issue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the issue and all of its comments. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
