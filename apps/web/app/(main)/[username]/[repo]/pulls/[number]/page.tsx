import type { Metadata } from "next"
import { Suspense } from "react"
import { PRDetailView } from "@/components/pulls/pr-detail-view"

export const metadata: Metadata = { title: "Pull request" }

export default function PullRequestDetailPage() {
  return (
    <Suspense>
      <PRDetailView />
    </Suspense>
  )
}
