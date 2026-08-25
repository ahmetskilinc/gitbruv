"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { RiLockLine } from "@remixicon/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  useApi,
  useIssue,
  useLabels,
  useIssueComments,
  useUpdateIssue,
  useDeleteIssue,
  useAddLabelsToIssue,
  useRemoveLabelFromIssue,
  useAddAssignees,
  useRemoveAssignee,
  useCreateComment,
  useToggleIssueReaction,
  useRepositoryInfo,
} from "@gitbruv/hooks"
import { useSession } from "@/lib/auth-client"
import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"
import { IssueDetail } from "./issue-detail"
import { CommentForm, CommentList } from "./comments"
import { StateBadge } from "./state-badge"

export function IssueDetailView() {
  const params = useParams<{ username: string; repo: string; number: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)
  const number = decodeURIComponent(params.number)
  const router = useRouter()
  const queryClient = useQueryClient()
  const api = useApi()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const issueNumber = parseInt(number, 10)

  const { data: repoInfo, isLoading: isLoadingRepo } = useRepositoryInfo(username, repo)
  const { data: issue, isLoading: isLoadingIssue } = useIssue(username, repo, issueNumber)
  const { data: labelsData, isLoading: isLoadingLabels } = useLabels(username, repo)
  const { data: commentsData, isLoading: isLoadingComments } = useIssueComments(issue?.id || "")

  const updateIssue = useUpdateIssue(issue?.id || "", username, repo)
  const deleteIssue = useDeleteIssue(issue?.id || "", username, repo)
  const toggleIssueReaction = useToggleIssueReaction(issue?.id || "", username, repo, issueNumber)
  const addLabels = useAddLabelsToIssue(issue?.id || "", username, repo, issueNumber)
  const removeLabel = useRemoveLabelFromIssue(issue?.id || "", username, repo, issueNumber)
  const addAssignees = useAddAssignees(issue?.id || "", username, repo, issueNumber)
  const removeAssignee = useRemoveAssignee(issue?.id || "", username, repo, issueNumber)
  const createComment = useCreateComment(issue?.id || "")

  const isLoading = isLoadingRepo || isLoadingIssue || isLoadingLabels
  const labels = labelsData?.labels || []
  const comments = commentsData?.comments || []
  const isOwner = repoInfo?.isOwner || false

  const availableAssignees = issue
    ? [
        issue.author,
        ...(repoInfo?.repo.owner
          ? [
              {
                id: repoInfo.repo.owner.id,
                username: repoInfo.repo.owner.username,
                name: repoInfo.repo.owner.name,
                avatarUrl: repoInfo.repo.owner.avatarUrl,
              },
            ]
          : []),
      ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
    : []

  const handleUpdate = async (data: {
    title?: string
    body?: string
    state?: "open" | "closed"
    locked?: boolean
  }) => {
    await updateIssue.mutateAsync(data)
  }

  const handleDelete = async () => {
    await deleteIssue.mutateAsync()
    toast.success("Issue deleted")
    router.push(`/${username}/${repo}/issues`)
  }

  const handleToggleReaction = (emoji: string) => {
    toggleIssueReaction.mutate(emoji)
  }

  const handleAddLabel = (labelId: string) => {
    addLabels.mutate([labelId])
  }

  const handleRemoveLabel = (labelId: string) => {
    removeLabel.mutate(labelId)
  }

  const handleAddAssignee = (userId: string) => {
    addAssignees.mutate([userId])
  }

  const handleRemoveAssignee = (userId: string) => {
    removeAssignee.mutate(userId)
  }

  const handleCreateComment = async (body: string) => {
    try {
      await createComment.mutateAsync(body)
    } catch {
      toast.error("Failed to post comment")
      throw new Error("Failed to post comment")
    }
  }

  const handleUpdateComment = async (commentId: string, body: string) => {
    await api.issues.updateComment(commentId, body)
    queryClient.invalidateQueries({ queryKey: ["issue", issue?.id, "comments"] })
  }

  const handleDeleteComment = async (commentId: string) => {
    await api.issues.deleteComment(commentId)
    queryClient.invalidateQueries({ queryKey: ["issue", issue?.id, "comments"] })
    queryClient.invalidateQueries({ queryKey: ["issue"] })
  }

  const handleToggleCommentReaction = async (commentId: string, emoji: string) => {
    await api.issues.toggleCommentReaction(commentId, emoji)
    queryClient.invalidateQueries({ queryKey: ["issue", issue?.id, "comments"] })
  }

  if (isLoading) {
    return (
      <PageContainer>
        <IssueDetailSkeleton />
      </PageContainer>
    )
  }

  if (!issue) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold">Issue not found</h2>
          <Link href={`/${username}/${repo}/issues`} className="text-primary hover:underline">
            Back to issues
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">{issue.title}</h1>
            <span className="text-2xl text-muted-foreground">#{issue.number}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StateBadge state={issue.state} />
            {issue.locked && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-amber-500/10 px-2 text-xs font-medium text-amber-500">
                <RiLockLine className="size-3" />
                Locked
              </span>
            )}
          </div>
        </div>
      </div>

      <IssueDetail
        issue={issue}
        labels={labels}
        availableAssignees={availableAssignees}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onToggleReaction={handleToggleReaction}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
        onAddAssignee={handleAddAssignee}
        onRemoveAssignee={handleRemoveAssignee}
      />

      <div className="mt-8 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Comments ({issue.commentCount})</h2>

        {isLoadingComments ? (
          <CommentsSkeleton />
        ) : (
          <CommentList
            comments={comments}
            currentUserId={currentUserId}
            onToggleReaction={handleToggleCommentReaction}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {currentUserId && !issue.locked && (
          <div className="mt-6 border-t border-border pt-6">
            <CommentForm
              currentUserAvatar={session?.user?.image}
              currentUserName={session?.user?.name || ""}
              onSubmit={handleCreateComment}
            />
          </div>
        )}

        {issue.locked && (
          <div className="rounded-lg border border-border bg-muted/30 py-6 text-center">
            <RiLockLine className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-muted-foreground">This conversation has been locked.</p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

function IssueDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </div>
  )
}

function CommentsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
