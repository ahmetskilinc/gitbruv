import type { Metadata } from "next"
import { Suspense } from "react"
import { NewPRView } from "@/components/pulls/new-pr-view"

export const metadata: Metadata = { title: "New pull request" }

export default function NewPullRequestPage() {
  return (
    <Suspense>
      <NewPRView />
    </Suspense>
  )
}
