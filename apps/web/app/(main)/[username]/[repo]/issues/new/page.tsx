import type { Metadata } from "next"
import { Suspense } from "react"
import { NewIssueView } from "@/components/issues/new-issue-view"

export const metadata: Metadata = { title: "New issue" }

export default function NewIssuePage() {
  return (
    <Suspense>
      <NewIssueView />
    </Suspense>
  )
}
