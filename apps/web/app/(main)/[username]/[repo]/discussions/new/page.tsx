import type { Metadata } from "next"
import { Suspense } from "react"
import { NewDiscussionView } from "@/components/discussions/new-discussion-view"

export const metadata: Metadata = { title: "New discussion" }

export default function NewDiscussionPage() {
  return (
    <Suspense>
      <NewDiscussionView />
    </Suspense>
  )
}
