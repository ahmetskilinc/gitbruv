import { cn } from "@/lib/utils"

type PageContainerProps = {
  children: React.ReactNode
  /**
   * Content max width. Two widths carry the whole app: `narrow` (800px) for
   * forms and reading, `default` (1100px) for tables/lists/boards. `wide`
   * (1280px) is reserved for code-heavy views (tree, blob, diffs).
   */
  size?: "default" | "narrow" | "wide"
  className?: string
}

const maxWidths: Record<NonNullable<PageContainerProps["size"]>, string> = {
  narrow: "max-w-[800px]",
  default: "max-w-[1100px]",
  wide: "max-w-7xl",
}

export function PageContainer({
  children,
  size = "default",
  className,
}: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6", maxWidths[size], className)}>
      {children}
    </div>
  )
}
