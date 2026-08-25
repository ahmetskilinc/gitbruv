"use client"

import { RiArrowLeftSLine } from "@remixicon/react"
import { cn } from "@/lib/utils"

/**
 * Back-navigation control for the stacked sidebar. Pops the sidebar to the
 * main layer without changing the page. Fixed height to match the layer
 * header and avoid layout jumps during the swap.
 */
export function SidebarBackLink({
  name,
  onClick,
  className,
}: {
  name: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to main navigation"
      className={cn(
        "group/back flex h-9 w-full items-center gap-1.5 rounded-md px-2 text-sm font-medium",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "outline-hidden transition-colors duration-150 ease-out-expo focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        className,
      )}
    >
      <RiArrowLeftSLine className="size-4 shrink-0 transition-transform duration-150 ease-out-expo group-hover/back:-translate-x-0.5 motion-reduce:transition-none" />
      <span className="truncate group-data-[collapsible=icon]:hidden">{name}</span>
    </button>
  )
}
