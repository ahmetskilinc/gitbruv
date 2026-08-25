import type { Metadata } from "next"
import { RepoLayout } from "@/components/repo/repo-layout"

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

export default function RepoLayoutRoute({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RepoLayout>{children}</RepoLayout>
}
