"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  useApi,
  useCreatePullRequest,
  useRepoBranches,
  useRepositoryInfo,
} from "@gitbruv/hooks"
import { useSession } from "@/lib/auth-client"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PRForm } from "./pr-form"

export function NewPRView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)
  const router = useRouter()
  const api = useApi()
  const { data: session, isPending: isSessionPending } = useSession()

  // Cross-repo (fork → upstream) creation goes through the api client
  // directly; track its pending state locally.
  const [isSubmittingUpstream, setIsSubmittingUpstream] = useState(false)

  const { data: repoInfo, isLoading: isLoadingRepo } = useRepositoryInfo(username, repo)
  const { data: branchesData, isLoading: isLoadingBranches } = useRepoBranches(username, repo)

  const forkedFrom = repoInfo?.repo.forkedFrom
  const { data: upstreamBranchesData } = useRepoBranches(
    forkedFrom?.owner.username || "",
    forkedFrom?.name || "",
  )

  const createPR = useCreatePullRequest(
    forkedFrom ? forkedFrom.owner.username : username,
    forkedFrom ? forkedFrom.name : repo,
  )

  const branches = branchesData?.branches || []
  const upstreamBranches = upstreamBranchesData?.branches || []
  const defaultBranch = repoInfo?.repo.defaultBranch || "main"

  const handleSubmit = async (data: {
    title: string
    body: string
    headBranch: string
    baseBranch: string
    toUpstream?: boolean
  }) => {
    try {
      if (data.toUpstream && forkedFrom) {
        setIsSubmittingUpstream(true)
        try {
          const pr = await api.pullRequests.create(
            forkedFrom.owner.username,
            forkedFrom.name,
            {
              title: data.title,
              body: data.body || undefined,
              headRepoOwner: username,
              headRepoName: repo,
              headBranch: data.headBranch,
              baseBranch: data.baseBranch,
            },
          )
          router.push(`/${forkedFrom.owner.username}/${forkedFrom.name}/pulls/${pr.number}`)
        } finally {
          setIsSubmittingUpstream(false)
        }
      } else {
        const pr = await createPR.mutateAsync({
          title: data.title,
          body: data.body || undefined,
          headBranch: data.headBranch,
          baseBranch: data.baseBranch,
        })
        router.push(`/${username}/${repo}/pulls/${pr.number}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create pull request")
    }
  }

  if (!isSessionPending && !session?.user) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold">Sign in required</h2>
          <p className="mb-4 text-muted-foreground">
            You need to be signed in to create a pull request.
          </p>
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </PageContainer>
    )
  }

  if (isSessionPending || isLoadingRepo || isLoadingBranches) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title="New pull request" />

      <Card className="p-6">
        <PRForm
          branches={branches}
          upstreamBranches={upstreamBranches}
          defaultBranch={defaultBranch}
          forkedFrom={forkedFrom}
          currentRepoOwner={username}
          currentRepoName={repo}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${username}/${repo}/pulls`)}
          submitLabel="Create pull request"
          isSubmitting={createPR.isPending || isSubmittingUpstream}
        />
      </Card>
    </PageContainer>
  )
}
