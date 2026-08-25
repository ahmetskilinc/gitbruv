import type { Metadata } from "next"
import { Suspense } from "react"
import { PullsView } from "@/components/pulls/pulls-view"

export const metadata: Metadata = { title: "Pull requests" }

export default function PullsPage() {
  return (
    <Suspense>
      <PullsView />
    </Suspense>
  )
}
