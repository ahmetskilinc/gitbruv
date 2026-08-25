"use client"

import { RiGlobalLine, RiLockLine } from "@remixicon/react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Visibility = "public" | "private"

const OPTIONS: {
  value: Visibility
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}[] = [
  {
    value: "public",
    label: "Public",
    icon: RiGlobalLine,
    description: "Anyone on the internet can see this repository. You choose who can commit.",
  },
  {
    value: "private",
    label: "Private",
    icon: RiLockLine,
    description: "You choose who can see and commit to this repository.",
  },
]

/**
 * Shared Public/Private repository visibility picker — used by the new-repo
 * modal and repo settings so both render the same themed radio-cards.
 */
export function VisibilityRadioGroup({
  value,
  onValueChange,
  className,
}: {
  value: Visibility
  onValueChange: (value: Visibility) => void
  className?: string
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onValueChange(v as Visibility)}
      className={cn("gap-2", className)}
    >
      {OPTIONS.map((option) => (
        <Label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-3 font-normal transition-colors duration-150 ease-out-expo motion-reduce:transition-none",
            value === option.value
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50",
          )}
        >
          <RadioGroupItem value={option.value} className="mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <option.icon className="size-4 text-muted-foreground" />
              {option.label}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
          </div>
        </Label>
      ))}
    </RadioGroup>
  )
}
