import type { Metadata } from "next"
import { Suspense } from "react"
import { IssueDetailView } from "@/components/issues/issue-detail-view"

export const metadata: Metadata = { title: "Issue" }

export default function IssueDetailPage() {
  return (
    <Suspense>
      <IssueDetailView />
    </Suspense>
  )
}
