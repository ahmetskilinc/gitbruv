import Link from "next/link"
import { cn } from "@/lib/utils"

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="w-full rounded-xl bg-muted/50 p-0.5 shadow-xl">
      <div className={cn("rounded-[calc(var(--radius)*1.4-2px)] border bg-card p-8", className)}>
        {children}
      </div>
    </div>
  )
}

export function AuthCardHeader({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
}) {
  return (
    <div className="mb-8 text-center">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h1 className="text-xl font-semibold">{title}</h1>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

export function AuthIconBadge({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "success" | "destructive"
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 [&_svg]:size-7",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "success" && "bg-emerald-500/10 text-emerald-500",
        tone === "destructive" && "bg-destructive/10 text-destructive",
      )}
    >
      {children}
    </div>
  )
}

export function AuthFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 w-full rounded-xl border p-4 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

export function AuthLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className="font-medium text-foreground hover:underline">
      {children}
    </Link>
  )
}
