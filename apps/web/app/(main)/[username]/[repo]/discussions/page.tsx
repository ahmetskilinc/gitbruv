import type { Metadata } from "next"
import { Suspense } from "react"
import { DiscussionsListView } from "@/components/discussions/discussions-list-view"

export const metadata: Metadata = { title: "Discussions" }

export default function DiscussionsPage() {
  return (
    <Suspense>
      <DiscussionsListView />
    </Suspense>
  )
}
