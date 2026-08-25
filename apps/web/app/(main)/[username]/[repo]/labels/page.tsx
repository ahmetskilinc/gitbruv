import type { Metadata } from "next"
import { Suspense } from "react"
import { LabelsView } from "@/components/issues/labels-view"

export const metadata: Metadata = { title: "Labels" }

export default function LabelsPage() {
  return (
    <Suspense>
      <LabelsView />
    </Suspense>
  )
}
