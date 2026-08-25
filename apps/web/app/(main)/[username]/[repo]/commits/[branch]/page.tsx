import type { Metadata } from "next"
import { Suspense } from "react"
import { CommitsView } from "@/components/repo/commits-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; repo: string }>
}): Promise<Metadata> {
  const { username, repo } = await params
  return {
    title: `Commits · ${decodeURIComponent(username)}/${decodeURIComponent(repo)}`,
  }
}

export default function CommitsPage() {
  return (
    <Suspense>
      <CommitsView />
    </Suspense>
  )
}
