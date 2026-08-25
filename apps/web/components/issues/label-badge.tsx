import type { Label } from "@gitbruv/hooks"
import { cn } from "@/lib/utils"

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

interface LabelBadgeProps {
  label: Label
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
  className?: string
}

export function LabelBadge({ label, onClick, removable, onRemove, className }: LabelBadgeProps) {
  const bgColor = `#${label.color}`
  const textColor = getContrastColor(label.color)

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium",
        onClick &&
          "cursor-pointer transition-opacity duration-100 hover:opacity-80 motion-reduce:transition-none",
        className,
      )}
      style={{ backgroundColor: bgColor, color: textColor }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
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
          className="ml-0.5 transition-opacity duration-100 hover:opacity-70 motion-reduce:transition-none"
        >
          ×
        </button>
      )}
    </span>
  )
}
