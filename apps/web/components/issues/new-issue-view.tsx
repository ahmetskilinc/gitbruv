"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCreateIssue } from "@gitbruv/hooks"
import { useSession } from "@/lib/auth-client"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { IssueForm } from "./issue-form"

export function NewIssueView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)
  const router = useRouter()
  const { data: session } = useSession()

  const createIssue = useCreateIssue(username, repo)

  const handleSubmit = async (data: { title: string; body: string }) => {
    try {
      const issue = await createIssue.mutateAsync({
        title: data.title,
        body: data.body || undefined,
      })
      router.push(`/${username}/${repo}/issues/${issue.number}`)
    } catch {
      toast.error("Failed to create issue")
    }
  }

  if (!session?.user) {
    return (
      <PageContainer size="narrow">
        <div className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold">Sign in required</h2>
          <p className="mb-4 text-muted-foreground">
            You need to be signed in to create an issue.
          </p>
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="narrow">
      <PageHeader title="New issue" />
      <div className="rounded-lg border border-border p-6">
        <IssueForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${username}/${repo}/issues`)}
          submitLabel="Submit new issue"
          isSubmitting={createIssue.isPending}
        />
      </div>
    </PageContainer>
  )
}
