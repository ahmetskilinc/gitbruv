import type { Metadata } from "next"
import { Suspense } from "react"
import { RepoSettingsView } from "@/components/repo-settings/repo-settings-view"

export const metadata: Metadata = { title: "Repository Settings" }

export default function RepoSettingsPage() {
  return (
    <Suspense>
      <RepoSettingsView />
    </Suspense>
  )
}
