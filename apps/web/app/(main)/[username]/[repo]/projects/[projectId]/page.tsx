import type { Metadata } from "next"
import { Suspense } from "react"
import { ProjectBoardView } from "@/components/projects/project-board-view"

export const metadata: Metadata = { title: "Project" }

export default function ProjectBoardPage() {
  return (
    <Suspense>
      <ProjectBoardView />
    </Suspense>
  )
}
