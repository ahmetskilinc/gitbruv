"use client"

import { RiAddLine, RiPriceTag3Line } from "@remixicon/react"
import type { IssueAuthor, Label, Owner } from "@gitbruv/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { LabelBadge } from "./label-badge"

interface LabelPickerProps {
  labels: Label[]
  selectedIds: string[]
  onToggle: (labelId: string) => void
  isLoading?: boolean
}

export function LabelPicker({ labels, selectedIds, onToggle, isLoading }: LabelPickerProps) {
  const selectedLabels = labels.filter((l) => selectedIds.includes(l.id))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Labels</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" disabled={isLoading} aria-label="Edit labels" />
            }
          >
            <RiAddLine className="size-4" />
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
                  onCheckedChange={() => onToggle(label.id)}
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
      </div>

      {selectedLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label) => (
            <LabelBadge key={label.id} label={label} removable onRemove={() => onToggle(label.id)} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">None yet</p>
      )}
    </div>
  )
}

interface AssigneePickerProps {
  availableUsers?: IssueAuthor[]
  selectedIds?: string[]
  onToggle?: (userId: string) => void
  availableAssignees?: Owner[]
  selectedAssignees?: Owner[]
  onAddAssignee?: (userId: string) => void
  onRemoveAssignee?: (userId: string) => void
  isLoading?: boolean
  label?: string
}

export function AssigneePicker({
  availableUsers,
  selectedIds,
  onToggle,
  availableAssignees,
  selectedAssignees,
  onAddAssignee,
  onRemoveAssignee,
  isLoading,
  label,
}: AssigneePickerProps) {
  const users = availableUsers || availableAssignees || []
  const selectedUserIds = selectedIds || (selectedAssignees?.map((a) => a.id) ?? [])

  const handleToggle = (userId: string) => {
    if (onToggle) {
      onToggle(userId)
    } else if (selectedUserIds.includes(userId)) {
      onRemoveAssignee?.(userId)
    } else {
      onAddAssignee?.(userId)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={isLoading} />
        }
      >
        <RiAddLine data-icon="inline-start" className="size-4" />
        {label || "Assign"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
        <DropdownMenuLabel>Assignees</DropdownMenuLabel>
        {users.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No users available</p>
        ) : (
          users.map((user) => (
            <DropdownMenuCheckboxItem
              key={user.id}
              checked={selectedUserIds.includes(user.id)}
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

type LabelOption = { id: string; name: string; color: string }

export function LabelFilterMenu({
  labels,
  value,
  onValueChange,
}: {
  labels: LabelOption[]
  value: string | null
  onValueChange: (value: string | null) => void
}) {
  if (labels.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className={cn(value && "border-primary")} />}
      >
        <RiPriceTag3Line data-icon="inline-start" className="size-4" />
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
