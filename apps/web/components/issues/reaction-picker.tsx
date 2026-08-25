"use client"

import { RiEmotionLine } from "@remixicon/react"
import type { ReactionSummary } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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

interface ReactionPickerProps {
  reactions: ReactionSummary[]
  onToggle: (emoji: string) => void
  disabled?: boolean
}

export function ReactionPicker({ reactions, onToggle, disabled }: ReactionPickerProps) {
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
          render={<Button variant="ghost" size="icon-sm" disabled={disabled} aria-label="Add reaction" />}
        >
          <RiEmotionLine className="size-4" />
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

export function ReactionDisplay({ reactions }: { reactions: ReactionSummary[] }) {
  if (reactions.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      {reactions.map((reaction) => (
        <span
          key={reaction.emoji}
          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
        >
          <span>{getEmojiLabel(reaction.emoji)}</span>
          <span>{reaction.count}</span>
        </span>
      ))}
    </div>
  )
}
