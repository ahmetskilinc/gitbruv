"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { RiAddLine, RiDeleteBinLine, RiPencilLine, RiPriceTag3Line } from "@remixicon/react"
import { toast } from "sonner"
import {
  useLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
  useRepositoryInfo,
} from "@gitbruv/hooks"
import type { Label } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { LabelBadge } from "./label-badge"

const DEFAULT_COLORS = [
  "ef4444",
  "f97316",
  "eab308",
  "22c55e",
  "06b6d4",
  "3b82f6",
  "8b5cf6",
  "ec4899",
  "6b7280",
]

function ColorSwatches({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex gap-1">
      {DEFAULT_COLORS.map((color) => (
        <button
          type="button"
          aria-label={`Use color #${color}`}
          aria-pressed={value === color}
          key={color}
          onClick={() => onChange(color)}
          className={`size-6 rounded-full border-2 transition-colors duration-100 motion-reduce:transition-none ${
            value === color ? "border-foreground" : "border-transparent"
          }`}
          style={{ backgroundColor: `#${color}` }}
        />
      ))}
    </div>
  )
}

export function LabelsView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)

  const { data: repoInfo } = useRepositoryInfo(username, repo)
  const { data: labelsData, isLoading } = useLabels(username, repo)
  const createLabel = useCreateLabel(username, repo)

  const [isCreating, setIsCreating] = useState(false)
  const [newLabel, setNewLabel] = useState({ name: "", description: "", color: "6b7280" })

  const labels = labelsData?.labels || []
  const isOwner = repoInfo?.isOwner || false

  const handleCreate = async () => {
    if (!newLabel.name.trim()) return
    try {
      await createLabel.mutateAsync({
        name: newLabel.name.trim(),
        description: newLabel.description.trim() || undefined,
        color: newLabel.color,
      })
      setNewLabel({ name: "", description: "", color: "6b7280" })
      setIsCreating(false)
      toast.success("Label created")
    } catch {
      toast.error("Failed to create label")
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Labels"
        description={`${labels.length} label${labels.length !== 1 ? "s" : ""}`}
        actions={
          isOwner &&
          !isCreating &&
          labels.length > 0 && (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <RiAddLine data-icon="inline-start" className="size-4" />
              New label
            </Button>
          )
        }
      />

      {isCreating && (
        <Card className="mb-4 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <span className="text-sm font-medium">Preview</span>
              <div className="mt-2">
                <LabelBadge
                  label={{
                    id: "preview",
                    name: newLabel.name || "Label preview",
                    description: null,
                    color: newLabel.color,
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="new-label-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="new-label-name"
                value={newLabel.name}
                onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                placeholder="Label name"
                className="mt-2"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="new-label-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="new-label-description"
                value={newLabel.description}
                onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
                placeholder="Optional description"
                className="mt-2"
              />
            </div>
            <div className="md:col-span-1">
              <span className="text-sm font-medium">Color</span>
              <div className="mt-2 flex items-center gap-2">
                <ColorSwatches
                  value={newLabel.color}
                  onChange={(color) => setNewLabel({ ...newLabel, color })}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLabel.isPending || !newLabel.name.trim()}>
              {createLabel.isPending && <Spinner />}
              Create label
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <LabelsSkeleton />
      ) : labels.length === 0 ? (
        <Empty className="border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiPriceTag3Line />
            </EmptyMedia>
            <EmptyTitle>No labels yet</EmptyTitle>
            <EmptyDescription>
              Labels help categorize and filter issues and pull requests.
            </EmptyDescription>
          </EmptyHeader>
          {isOwner && !isCreating && (
            <EmptyContent>
              <Button onClick={() => setIsCreating(true)}>
                <RiAddLine data-icon="inline-start" className="size-4" />
                New label
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {labels.map((label) => (
            <LabelRow
              key={label.id}
              label={label}
              username={username}
              repo={repo}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}

function LabelRow({
  label,
  username,
  repo,
  isOwner,
}: {
  label: Label
  username: string
  repo: string
  isOwner: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    name: label.name,
    description: label.description || "",
    color: label.color,
  })

  const updateLabel = useUpdateLabel(label.id, username, repo)
  const deleteLabel = useDeleteLabel(label.id, username, repo)

  const handleUpdate = async () => {
    try {
      await updateLabel.mutateAsync({
        name: editData.name.trim(),
        description: editData.description.trim() || undefined,
        color: editData.color,
      })
      setIsEditing(false)
      toast.success("Label updated")
    } catch {
      toast.error("Failed to update label")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteLabel.mutateAsync()
      toast.success("Label deleted")
    } catch {
      toast.error("Failed to delete label")
    }
  }

  if (isEditing) {
    return (
      <div className="border-b border-border p-4 last:border-b-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <LabelBadge
              label={{
                id: label.id,
                name: editData.name || "Label preview",
                description: null,
                color: editData.color,
              }}
            />
          </div>
          <Input
            aria-label={`Name for ${label.name}`}
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            placeholder="Label name"
          />
          <Input
            aria-label={`Description for ${label.name}`}
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            placeholder="Description"
          />
          <ColorSwatches
            value={editData.color}
            onChange={(color) => setEditData({ ...editData, color })}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={updateLabel.isPending}>
            {updateLabel.isPending && <Spinner />}
            Save changes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group/row flex items-center justify-between border-b border-border px-4 py-3 transition-colors duration-100 last:border-b-0 hover:bg-muted/30 motion-reduce:transition-none">
      <div className="flex items-center gap-3">
        <LabelBadge label={label} />
        {label.description && (
          <span className="text-sm text-muted-foreground">{label.description}</span>
        )}
      </div>
      {isOwner && (
        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-focus-within/row:opacity-100 motion-reduce:transition-none">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${label.name}`}
            onClick={() => setIsEditing(true)}
          >
            <RiPencilLine className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${label.name}`}
            className="text-destructive hover:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={deleteLabel.isPending}
          >
            <RiDeleteBinLine className="size-4" />
          </Button>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this label?</AlertDialogTitle>
            <AlertDialogDescription>
              The label &quot;{label.name}&quot; will be removed from all issues. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete label
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LabelsSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
        >
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  )
}
