"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div>
        <p className="font-mono text-sm text-muted-foreground">Something went wrong</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
          Unexpected error
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Try again."}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
