import { RiCheckboxCircleLine, RiRecordCircleLine } from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StateBadgeProps {
  state: "open" | "closed"
  className?: string
}

export function StateBadge({ state, className }: StateBadgeProps) {
  const isOpen = state === "open"

  return (
    <Badge
      className={cn(
        isOpen ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
        className,
      )}
    >
      {isOpen ? <RiRecordCircleLine /> : <RiCheckboxCircleLine />}
      {isOpen ? "Open" : "Closed"}
    </Badge>
  )
}

/** Bare state glyph for dense list rows. */
export function StateIcon({ state, className }: StateBadgeProps) {
  const isOpen = state === "open"
  const Icon = isOpen ? RiRecordCircleLine : RiCheckboxCircleLine

  return (
    <Icon
      aria-label={isOpen ? "Open issue" : "Closed issue"}
      className={cn("size-4", isOpen ? "text-emerald-500" : "text-red-500", className)}
    />
  )
}
