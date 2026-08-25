import type { Metadata } from "next"
import { TreeView } from "@/components/repo/tree-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; repo: string }>
}): Promise<Metadata> {
  const { username, repo } = await params
  return {
    title: `${decodeURIComponent(username)}/${decodeURIComponent(repo)}`,
  }
}

export default function TreePage() {
  return <TreeView />
}
