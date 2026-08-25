import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <span className="text-lg font-bold tracking-tight">gitbruv</span>
    </Link>
  )
}
