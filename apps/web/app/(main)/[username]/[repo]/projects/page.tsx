import type { Metadata } from "next"
import { Suspense } from "react"
import { ProjectsListView } from "@/components/projects/projects-list-view"

export const metadata: Metadata = { title: "Projects" }

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsListView />
    </Suspense>
  )
}
