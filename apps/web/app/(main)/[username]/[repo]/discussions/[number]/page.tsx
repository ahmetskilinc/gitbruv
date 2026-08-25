import type { Metadata } from "next"
import { Suspense } from "react"
import { DiscussionDetailView } from "@/components/discussions/discussion-detail-view"

export const metadata: Metadata = { title: "Discussion" }

export default function DiscussionDetailPage() {
  return (
    <Suspense>
      <DiscussionDetailView />
    </Suspense>
  )
}
