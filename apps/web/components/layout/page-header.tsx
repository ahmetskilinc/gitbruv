import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: React.ReactNode
  /** Optional one-line description under the title. */
  description?: React.ReactNode
  /** Right-aligned action slot (buttons, filters). */
  actions?: React.ReactNode
  className?: string
}

/**
 * Single page-heading idiom: title stack left, actions right. Section icons
 * live in the sidebar only — no icon beside page titles.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl/7 font-semibold tracking-[-0.02em]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  )
}
