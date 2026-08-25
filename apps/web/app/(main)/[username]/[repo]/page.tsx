import type { Metadata } from "next"
import { RepoHome } from "@/components/repo/repo-home"

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

export default function RepoPage() {
  return <RepoHome />
}
