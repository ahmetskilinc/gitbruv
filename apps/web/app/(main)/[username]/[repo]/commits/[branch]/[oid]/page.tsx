import type { Metadata } from "next"
import { CommitDetail } from "@/components/repo/commit-detail"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; repo: string; oid: string }>
}): Promise<Metadata> {
  const { username, repo, oid } = await params
  return {
    title: `${decodeURIComponent(oid).slice(0, 7)} · ${decodeURIComponent(username)}/${decodeURIComponent(repo)}`,
  }
}

export default function CommitPage() {
  return <CommitDetail />
}
