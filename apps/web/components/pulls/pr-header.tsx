"use client"

import { useState } from "react"
import { RiDeleteBinLine, RiGitMergeLine, RiPencilLine } from "@remixicon/react"

import type { PullRequest } from "@gitbruv/hooks"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { PRStateBadge } from "./pr-state-badge"

type PRHeaderProps = {
  pullRequest: PullRequest
  isOwner: boolean
  currentUserId?: string
  onUpdate: (data: { title?: string; body?: string; state?: "open" | "closed" }) => Promise<void>
  onDelete: () => Promise<void>
  onMerge: () => Promise<void>
  isMerging: boolean
  onMarkReady: () => Promise<void>
  isMarkingReady: boolean
}

export function PRHeader({
  pullRequest,
  isOwner,
  currentUserId,
  onUpdate,
  onDelete,
  onMerge,
  isMerging,
  onMarkReady,
  isMarkingReady,
}: PRHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(pullRequest.title)

  const canEdit = currentUserId === pullRequest.author.id || isOwner
  const canMerge =
    (currentUserId === pullRequest.author.id || isOwner) && pullRequest.state === "open"
  const canDelete = isOwner
  const isDraft = pullRequest.isDraft && pullRequest.state === "open"

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== pullRequest.title) {
      await onUpdate({ title: editedTitle })
    }
    setIsEditing(false)
  }

  const handleToggleState = async () => {
    const newState = pullRequest.state === "open" ? "closed" : "open"
    await onUpdate({ state: newState })
  }

  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-xl font-bold"
              autoFocus
            />
            <Button size="sm" onClick={handleSaveTitle}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-2xl font-bold">{pullRequest.title}</h1>
            <span className="text-2xl text-muted-foreground">#{pullRequest.number}</span>
            {canEdit && (
              <Button
                size="icon"
                variant="ghost"
                className="size-6"
                aria-label="Edit title"
                onClick={() => setIsEditing(true)}
              >
                <RiPencilLine className="size-4" />
              </Button>
            )}
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          <PRStateBadge
            state={pullRequest.state}
            merged={pullRequest.merged}
            isDraft={pullRequest.isDraft}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canEdit && isDraft && !pullRequest.merged && (
          <Button variant="outline" onClick={onMarkReady} disabled={isMarkingReady}>
            {isMarkingReady && <Spinner />}
            {isMarkingReady ? "Marking ready..." : "Ready for review"}
          </Button>
        )}

        {canMerge && !pullRequest.merged && !isDraft && (
          <Button
            onClick={onMerge}
            disabled={isMerging}
            className="bg-purple-500 text-white hover:bg-purple-500/90"
          >
            {isMerging ? (
              <>
                <Spinner />
                Merging...
              </>
            ) : (
              <>
                <RiGitMergeLine className="size-4" />
                Merge pull request
              </>
            )}
          </Button>
        )}

        {canEdit && !pullRequest.merged && (
          <Button variant="outline" onClick={handleToggleState}>
            {pullRequest.state === "open" ? "Close" : "Reopen"}
          </Button>
        )}

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Delete pull request"
                  className="text-destructive hover:text-destructive"
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete pull request</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this pull request? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
