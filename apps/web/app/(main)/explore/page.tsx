import type { Metadata } from "next"
import { Suspense } from "react"
import { ExploreView } from "@/components/explore/explore-view"

export const metadata: Metadata = { title: "Explore" }

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreView />
    </Suspense>
  )
}
