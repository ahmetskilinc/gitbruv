"use client"

// Local variants of the issue pickers (reaction/label/assignee/label-filter).
// components/issues/* is being built in parallel by another agent — these are
// deliberate duplicates so pulls/ has no dependency on it.

import { RiAddLine, RiPriceTag3Line } from "@remixicon/react"

import type { Label, Owner, ReactionSummary } from "@gitbruv/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const REACTIONS = [
  { emoji: "+1", label: "👍" },
  { emoji: "-1", label: "👎" },
  { emoji: "laugh", label: "😄" },
  { emoji: "hooray", label: "🎉" },
  { emoji: "confused", label: "😕" },
  { emoji: "heart", label: "❤️" },
  { emoji: "rocket", label: "🚀" },
  { emoji: "eyes", label: "👀" },
]

function getEmojiLabel(emoji: string): string {
  return REACTIONS.find((r) => r.emoji === emoji)?.label || emoji
}

export function ReactionPicker({
  reactions,
  onToggle,
  disabled,
}: {
  reactions: ReactionSummary[]
  onToggle: (emoji: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => onToggle(reaction.emoji)}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors duration-100 motion-reduce:transition-none",
            reaction.reacted
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-secondary/50 hover:bg-secondary",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span>{getEmojiLabel(reaction.emoji)}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" disabled={disabled} aria-label="Add reaction" />
          }
        >
          <span aria-hidden="true" className="text-sm">
            😀
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuGroup>
          <DropdownMenuLabel>Add a reaction</DropdownMenuLabel>
          <div className="grid grid-cols-4 gap-1">
            {REACTIONS.map((reaction) => (
              <DropdownMenuItem
                key={reaction.emoji}
                aria-label={reaction.emoji}
                className="justify-center px-2 text-base"
                onClick={() => onToggle(reaction.emoji)}
              >
                <span aria-hidden="true">{reaction.label}</span>
              </DropdownMenuItem>
            ))}
          </div>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

export function LabelBadge({
  label,
  removable,
  onRemove,
  className,
}: {
  label: Label
  removable?: boolean
  onRemove?: () => void
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{ backgroundColor: `#${label.color}`, color: getContrastColor(label.color) }}
    >
      {label.name}
      {removable && onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:opacity-70"
        >
          ×
        </button>
      )}
    </span>
  )
}

export function LabelPicker({
  labels,
  selectedLabels,
  onAddLabel,
  onRemoveLabel,
}: {
  labels: Label[]
  selectedLabels: Label[]
  onAddLabel: (labelId: string) => void
  onRemoveLabel: (labelId: string) => void
}) {
  const selectedIds = selectedLabels.map((l) => l.id)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="w-fit text-muted-foreground" />}
      >
        <RiAddLine data-icon="inline-start" />
        Add label
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
        <DropdownMenuLabel>Labels</DropdownMenuLabel>
        {labels.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No labels</p>
        ) : (
          labels.map((label) => (
            <DropdownMenuCheckboxItem
              key={label.id}
              checked={selectedIds.includes(label.id)}
              onCheckedChange={() =>
                selectedIds.includes(label.id) ? onRemoveLabel(label.id) : onAddLabel(label.id)
              }
            >
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: `#${label.color}` }}
              />
              <span className="truncate">{label.name}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AssigneePicker({
  availableAssignees,
  selectedAssignees,
  onAddAssignee,
  onRemoveAssignee,
  label,
}: {
  availableAssignees: Owner[]
  selectedAssignees: Owner[]
  onAddAssignee: (userId: string) => void
  onRemoveAssignee: (userId: string) => void
  label?: string
}) {
  const selectedIds = selectedAssignees.map((a) => a.id)

  const handleToggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onRemoveAssignee(userId)
    } else {
      onAddAssignee(userId)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="w-fit text-muted-foreground" />}
      >
        <RiAddLine data-icon="inline-start" />
        {label || "Assign"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
        <DropdownMenuLabel>{label || "Assignees"}</DropdownMenuLabel>
        {availableAssignees.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No users available</p>
        ) : (
          availableAssignees.map((user) => (
            <DropdownMenuCheckboxItem
              key={user.id}
              checked={selectedIds.includes(user.id)}
              onCheckedChange={() => handleToggle(user.id)}
            >
              <Avatar className="size-5">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px]">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{user.username}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LabelFilterMenu({
  labels,
  value,
  onValueChange,
}: {
  labels: Label[]
  value: string | null
  onValueChange: (value: string | null) => void
}) {
  if (labels.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className={cn(value && "border-primary")} />}
      >
        <RiPriceTag3Line data-icon="inline-start" />
        <span className="max-w-36 truncate">{value || "Filter by label"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filter by label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={value ?? ""}
            onValueChange={(nextValue) => onValueChange(nextValue || null)}
          >
            <DropdownMenuRadioItem value="">All labels</DropdownMenuRadioItem>
            {labels.map((label) => (
              <DropdownMenuRadioItem key={label.id} value={label.name}>
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: `#${label.color}` }}
                />
                <span className="truncate">{label.name}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
