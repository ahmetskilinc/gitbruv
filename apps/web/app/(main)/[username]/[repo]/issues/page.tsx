import type { Metadata } from "next"
import { Suspense } from "react"
import { IssuesView } from "@/components/issues/issues-view"

export const metadata: Metadata = { title: "Issues" }

export default function IssuesPage() {
  return (
    <Suspense>
      <IssuesView />
    </Suspense>
  )
}
