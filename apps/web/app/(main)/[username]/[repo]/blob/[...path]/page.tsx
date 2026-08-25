import type { Metadata } from "next"
import { BlobView } from "@/components/repo/blob-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; repo: string; path: string[] }>
}): Promise<Metadata> {
  const { username, repo, path } = await params
  const fileName = decodeURIComponent(path[path.length - 1] ?? "")
  return {
    title: `${fileName} · ${decodeURIComponent(username)}/${decodeURIComponent(repo)}`,
  }
}

export default function BlobPage() {
  return <BlobView />
}
