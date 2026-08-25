import type { Metadata } from "next"
import { Suspense } from "react"
import { ReleasesView } from "@/components/releases/releases-view"

export const metadata: Metadata = { title: "Releases" }

export default function ReleasesPage() {
  return (
    <Suspense>
      <ReleasesView />
    </Suspense>
  )
}
