import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <BrandMark />
      <div>
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for may have been moved, renamed, or never
          pushed in the first place.
        </p>
      </div>
      <Button render={<Link href="/" />}>Back to home</Button>
    </div>
  )
}
