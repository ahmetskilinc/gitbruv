import type { Metadata } from "next"
import { Suspense } from "react"
import { MilestonesView } from "@/components/issues/milestones-view"

export const metadata: Metadata = { title: "Milestones" }

export default function MilestonesPage() {
  return (
    <Suspense>
      <MilestonesView />
    </Suspense>
  )
}
