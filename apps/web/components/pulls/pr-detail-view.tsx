"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { RiGitBranchLine, RiGitMergeLine } from "@remixicon/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  useAddPRAssignees,
  useAddPRLabels,
  useAddPRReviewers,
  useApi,
  useCreatePRComment,
  useDeletePullRequest,
  useLabels,
  useMarkPRReady,
  useMergePullRequest,
  usePullRequest,
  usePullRequestComments,
  usePullRequestDiff,
  useRemovePRAssignee,
  useRemovePRLabel,
  useRemovePRReviewer,
  useRepositoryInfo,
  useSubmitReview,
  useTogglePRReaction,
  useUpdatePullRequest,
  type InlineCommentData,
  type PRComment,
} from "@gitbruv/hooks"
import { useSession } from "@/lib/auth-client"
import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"
import { PRDetail } from "./pr-detail"
import { PRHeader } from "./pr-header"
import { PRCommentForm, PRCommentList } from "./pr-comments"

export function PRDetailView() {
  const params = useParams<{ username: string; repo: string; number: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)
  const number = decodeURIComponent(params.number)
  const router = useRouter()
  const queryClient = useQueryClient()
  const api = useApi()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const prNumber = parseInt(number, 10)

  const { data: repoInfo, isLoading: isLoadingRepo } = useRepositoryInfo(username, repo)
  const { data: pr, isLoading: isLoadingPR } = usePullRequest(username, repo, prNumber)
  const { data: labelsData, isLoading: isLoadingLabels } = useLabels(username, repo)
  const { data: commentsData, isLoading: isLoadingComments } = usePullRequestComments(
    pr?.id || "",
  )
  const { data: diffData, isLoading: isLoadingDiff } = usePullRequestDiff(pr?.id || "")

  const updatePR = useUpdatePullRequest(pr?.id || "", username, repo)
  const deletePR = useDeletePullRequest(pr?.id || "", username, repo)
  const mergePR = useMergePullRequest(pr?.id || "", username, repo, prNumber)
  const markReady = useMarkPRReady(pr?.id || "", username, repo, prNumber)
  const toggleReaction = useTogglePRReaction(pr?.id || "", username, repo, prNumber)
  const addLabels = useAddPRLabels(pr?.id || "", username, repo, prNumber)
  const removeLabel = useRemovePRLabel(pr?.id || "", username, repo, prNumber)
  const addAssignees = useAddPRAssignees(pr?.id || "", username, repo, prNumber)
  const removeAssignee = useRemovePRAssignee(pr?.id || "", username, repo, prNumber)
  const addReviewers = useAddPRReviewers(pr?.id || "", username, repo, prNumber)
  const removeReviewer = useRemovePRReviewer(pr?.id || "", username, repo, prNumber)
  const createComment = useCreatePRComment(pr?.id || "")
  const submitReview = useSubmitReview(pr?.id || "", username, repo, prNumber)

  const isLoading = isLoadingRepo || isLoadingPR || isLoadingLabels
  const labels = labelsData?.labels || []
  const allComments: PRComment[] =
    commentsData && "comments" in commentsData ? commentsData.comments : []
  const generalComments = allComments.filter((c) => !c.filePath)
  const inlineComments = allComments.filter((c) => !!c.filePath)
  const isOwner = repoInfo?.isOwner || false

  // Author + repo owner, deduped by id.
  const availableAssignees = pr
    ? [
        pr.author,
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
  }) => {
    try {
      await updatePR.mutateAsync(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update pull request")
    }
  }

  const handleDelete = async () => {
    try {
      await deletePR.mutateAsync()
      router.push(`/${username}/${repo}/pulls`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete pull request")
    }
  }

  const handleMerge = async () => {
    try {
      await mergePR.mutateAsync({})
      toast.success("Pull request merged")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to merge pull request")
    }
  }

  const handleMarkReady = async () => {
    try {
      await markReady.mutateAsync()
      toast.success("Pull request marked ready for review")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark ready")
    }
  }

  const handleToggleReaction = (emoji: string) => {
    toggleReaction.mutate(emoji)
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

  const handleAddReviewer = (userId: string) => {
    addReviewers.mutate([userId])
  }

  const handleRemoveReviewer = (userId: string) => {
    removeReviewer.mutate(userId)
  }

  // General conversation comment: the mutation takes a plain string.
  const handleCreateComment = async (body: string) => {
    try {
      await createComment.mutateAsync(body)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment")
      throw err
    }
  }

  // Inline comment (and replies): the mutation takes a full InlineCommentData
  // object — filePath/side/lineNumber are required.
  const handleCreateInlineComment = async (data: InlineCommentData) => {
    try {
      await createComment.mutateAsync(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add inline comment")
      throw err
    }
  }

  const handleSubmitReview = async (data: {
    body?: string
    state: "approved" | "changes_requested" | "commented"
  }) => {
    try {
      await submitReview.mutateAsync(data)
      toast.success("Review submitted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review")
    }
  }

  const handleUpdateComment = async (commentId: string, body: string) => {
    await api.pullRequests.updateComment(commentId, body)
    queryClient.invalidateQueries({ queryKey: ["pullRequest", pr?.id, "comments"] })
  }

  const handleDeleteComment = async (commentId: string) => {
    await api.pullRequests.deleteComment(commentId)
    queryClient.invalidateQueries({ queryKey: ["pullRequest", pr?.id, "comments"] })
    queryClient.invalidateQueries({ queryKey: ["pullRequest"] })
  }

  const handleToggleCommentReaction = async (commentId: string, emoji: string) => {
    await api.pullRequests.toggleCommentReaction(commentId, emoji)
    queryClient.invalidateQueries({ queryKey: ["pullRequest", pr?.id, "comments"] })
  }

  if (isLoading) {
    return (
      <PageContainer size="wide">
        <PRDetailSkeleton />
      </PageContainer>
    )
  }

  if (!pr) {
    return (
      <PageContainer size="wide">
        <div className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold">Pull request not found</h2>
          <Link href={`/${username}/${repo}/pulls`} className="text-primary hover:underline">
            Back to pull requests
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="wide">
      <PRHeader
        pullRequest={pr}
        isOwner={isOwner}
        currentUserId={currentUserId}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onMerge={handleMerge}
        isMerging={mergePR.isPending}
        onMarkReady={handleMarkReady}
        isMarkingReady={markReady.isPending}
      />

      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <RiGitBranchLine className="size-4" />
        <span className="font-mono">
          {pr.headRepo?.owner.username}:{pr.headBranch}
        </span>
        <RiGitMergeLine className="size-4" />
        <span className="font-mono">
          {pr.baseRepo?.owner.username}:{pr.baseBranch}
        </span>
      </div>

      <PRDetail
        pullRequest={pr}
        labels={labels}
        availableAssignees={availableAssignees}
        diffData={diffData}
        isLoadingDiff={isLoadingDiff}
        inlineComments={inlineComments}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onToggleReaction={handleToggleReaction}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
        onAddAssignee={handleAddAssignee}
        onRemoveAssignee={handleRemoveAssignee}
        onAddReviewer={handleAddReviewer}
        onRemoveReviewer={handleRemoveReviewer}
        onSubmitReview={handleSubmitReview}
        isSubmittingReview={submitReview.isPending}
        onCreateInlineComment={handleCreateInlineComment}
        isCreatingInlineComment={createComment.isPending}
        onUpdateComment={handleUpdateComment}
      />

      <div className="mt-8 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Conversation ({pr.commentCount})</h2>

        {isLoadingComments ? (
          <CommentsSkeleton />
        ) : (
          <PRCommentList
            comments={generalComments}
            currentUserId={currentUserId}
            onToggleReaction={handleToggleCommentReaction}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {currentUserId && (
          <div className="mt-6 border-t border-border pt-6">
            <PRCommentForm
              currentUserAvatar={session?.user?.image}
              currentUserName={session?.user?.name || ""}
              onSubmit={handleCreateComment}
            />
          </div>
        )}
      </div>
    </PageContainer>
  )
}

function PRDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-32 w-4/5" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function CommentsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
        >
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
