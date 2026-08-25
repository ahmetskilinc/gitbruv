"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  RiAddLine,
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiGitPullRequestLine,
  RiStickyNoteLine,
} from "@remixicon/react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  useProject,
  useReorderProjectItems,
  useAddProjectItem,
  useDeleteProjectItem,
  type ProjectItem,
  type ProjectColumn,
} from "@gitbruv/hooks"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { PageContainer } from "@/components/layout/page-container"
import { cn } from "@/lib/utils"

function SortableCard({ item, onDelete }: { item: ProjectItem; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-xl border border-border bg-card p-3 active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {item.type === "issue" && (
            <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          )}
          {item.type === "pull_request" && (
            <RiGitPullRequestLine className="mt-0.5 size-4 shrink-0 text-purple-500" />
          )}
          {item.type === "note" && (
            <RiStickyNoteLine className="mt-0.5 size-4 shrink-0 text-amber-500" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {item.issue?.title || item.pullRequest?.title || "Note"}
            </p>
            {item.type === "note" && item.noteContent && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {item.noteContent}
              </p>
            )}
            {(item.issue || item.pullRequest) && (
              <p className="mt-1 text-xs text-muted-foreground">
                #{item.issue?.number || item.pullRequest?.number}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100"
        >
          <RiDeleteBinLine className="size-3" />
        </Button>
      </div>
    </div>
  )
}

function Column({
  column,
  onAddNote,
  onDeleteItem,
}: {
  column: ProjectColumn
  onAddNote: (columnId: string, content: string) => void
  onDeleteItem: (itemId: string) => void
}) {
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [noteContent, setNoteContent] = useState("")

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteContent.trim()) return
    onAddNote(column.id, noteContent)
    setNoteContent("")
    setIsAddingNote(false)
  }

  return (
    <div className="w-72 shrink-0 rounded-xl bg-muted/30 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{column.name}</h3>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {column.items.length}
        </span>
      </div>

      <SortableContext items={column.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[100px] flex-col gap-2">
          {column.items.map((item) => (
            <div key={item.id} className="group">
              <SortableCard item={item} onDelete={() => onDeleteItem(item.id)} />
            </div>
          ))}
        </div>
      </SortableContext>

      {isAddingNote ? (
        <form onSubmit={handleAddNote} className="mt-3 flex flex-col gap-2">
          <Input
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Enter a note..."
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="xs" disabled={!noteContent.trim()}>
              Add
            </Button>
            <Button type="button" size="xs" variant="ghost" onClick={() => setIsAddingNote(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-muted-foreground"
          onClick={() => setIsAddingNote(true)}
        >
          <RiAddLine className="size-4" />
          Add a note
        </Button>
      )}
    </div>
  )
}

export function ProjectBoardView() {
  const params = useParams<{ username: string; repo: string; projectId: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)
  const projectId = decodeURIComponent(params.projectId)

  const { data: project, isLoading } = useProject(projectId)
  const reorderItems = useReorderProjectItems(projectId)
  const addItem = useAddProjectItem(projectId)
  const deleteItem = useDeleteProjectItem(projectId)
  const [activeItem, setActiveItem] = useState<ProjectItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const item = project?.columns
      .flatMap((c) => c.items)
      .find((i) => i.id === active.id)
    setActiveItem(item || null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveItem(null)

    if (!over || !project) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const sourceColumn = project.columns.find((c) =>
      c.items.some((i) => i.id === activeId),
    )
    const destColumn = project.columns.find(
      (c) => c.id === overId || c.items.some((i) => i.id === overId),
    )

    if (!sourceColumn || !destColumn) return

    const sourceItems = [...sourceColumn.items]
    const destItems = sourceColumn.id === destColumn.id ? sourceItems : [...destColumn.items]

    const activeIndex = sourceItems.findIndex((i) => i.id === activeId)
    const overIndex = destItems.findIndex((i) => i.id === overId)

    let newItems: { id: string; columnId: string; position: number }[]

    if (sourceColumn.id === destColumn.id) {
      const reordered = arrayMove(sourceItems, activeIndex, overIndex)
      newItems = reordered.map((item, index) => ({
        id: item.id,
        columnId: destColumn.id,
        position: index,
      }))
    } else {
      const [movedItem] = sourceItems.splice(activeIndex, 1)
      destItems.splice(overIndex >= 0 ? overIndex : destItems.length, 0, movedItem)

      newItems = [
        ...sourceItems.map((item, index) => ({
          id: item.id,
          columnId: sourceColumn.id,
          position: index,
        })),
        ...destItems.map((item, index) => ({
          id: item.id,
          columnId: destColumn.id,
          position: index,
        })),
      ]
    }

    try {
      await reorderItems.mutateAsync(newItems)
    } catch {
      toast.error("Failed to reorder items")
    }
  }

  async function handleAddNote(columnId: string, content: string) {
    try {
      await addItem.mutateAsync({ columnId, noteContent: content })
      toast.success("Note added")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note")
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await deleteItem.mutateAsync(itemId)
      toast.success("Item removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove item")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <PageContainer size="wide">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/${username}/${repo}/projects`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
        >
          <RiArrowLeftLine className="size-4" />
          Projects
        </Link>
        <h1 className="text-xl font-semibold">{project.name}</h1>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {project.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onAddNote={handleAddNote}
              onDeleteItem={handleDeleteItem}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <div className="scale-[1.02] rounded-xl border border-border bg-card p-3 shadow-lg ring-1 ring-border">
              <p className="text-sm font-medium">
                {activeItem.issue?.title ||
                  activeItem.pullRequest?.title ||
                  activeItem.noteContent ||
                  "Note"}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </PageContainer>
  )
}
