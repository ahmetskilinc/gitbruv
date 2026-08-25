"use client"

import { useMemo, useState } from "react"
import { RiAddLine, RiChat1Line, RiCheckLine, RiCloseLine, RiFileListLine } from "@remixicon/react"

import type { InlineCommentData, Label, Owner, PRComment, PRDiff, PRReview, PullRequest } from "@gitbruv/hooks"
import { timeAgo } from "@gitbruv/lib"
import {
  DiffToolbar,
  DiffViewer,
  FilePickerSidebar,
  useFileNavigation,
  type DiffViewMode,
  DIFF_ADD_TEXT,
  DIFF_REMOVE_TEXT,
} from "@/components/diff-viewer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { InlineCommentForm } from "./inline-comment-form"
import { InlineCommentThread } from "./inline-comment-thread"
import { MarkdownBody } from "./markdown"
import { AssigneePicker, LabelBadge, LabelPicker, ReactionPicker } from "./pickers"

type PRDetailProps = {
  pullRequest: PullRequest
  labels: Label[]
  availableAssignees: Owner[]
  diffData?: PRDiff
  isLoadingDiff: boolean
  inlineComments: PRComment[]
  currentUserId?: string
  isOwner: boolean
  onToggleReaction: (emoji: string) => void
  onAddLabel: (labelId: string) => void
  onRemoveLabel: (labelId: string) => void
  onAddAssignee: (userId: string) => void
  onRemoveAssignee: (userId: string) => void
  onAddReviewer: (userId: string) => void
  onRemoveReviewer: (userId: string) => void
  onSubmitReview: (data: {
    body?: string
    state: "approved" | "changes_requested" | "commented"
  }) => void
  isSubmittingReview: boolean
  onCreateInlineComment: (data: InlineCommentData) => Promise<void>
  isCreatingInlineComment: boolean
  onUpdateComment: (commentId: string, body: string) => Promise<void>
}

/** Local bordered/divided stat table (the old app's StatStrip is not ported yet). */
function StatStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border sm:grid-cols-4 sm:divide-y-0">
      {children}
    </div>
  )
}

function StatCell({
  label,
  sub,
  mono,
  children,
}: {
  label: string
  sub?: React.ReactNode
  mono?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("truncate text-sm font-medium", mono && "font-mono")}>{children}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

export function PRDetail({
  pullRequest,
  labels,
  availableAssignees,
  diffData,
  isLoadingDiff,
  inlineComments,
  currentUserId,
  isOwner,
  onToggleReaction,
  onAddLabel,
  onRemoveLabel,
  onAddAssignee,
  onRemoveAssignee,
  onAddReviewer,
  onRemoveReviewer,
  onSubmitReview,
  isSubmittingReview,
  onCreateInlineComment,
  isCreatingInlineComment,
  onUpdateComment,
}: PRDetailProps) {
  const [activeTab, setActiveTab] = useState("conversation")
  const [viewMode, setViewMode] = useState<DiffViewMode>("unified")
  const [fullWidth, setFullWidth] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [reviewBody, setReviewBody] = useState("")
  const [showReviewForm, setShowReviewForm] = useState(false)

  const { fileRefs, selectedFile, scrollToFile } = useFileNavigation()

  const canEdit = currentUserId === pullRequest.author.id || isOwner
  const canReview = currentUserId && currentUserId !== pullRequest.author.id

  const handleSubmitReview = (state: "approved" | "changes_requested" | "commented") => {
    onSubmitReview({ body: reviewBody || undefined, state })
    setReviewBody("")
    setShowReviewForm(false)
  }

  // Inline comment threads grouped file → (line, side).
  const inlineThreadsByFile = useMemo(() => {
    const byFile = new Map<string, Map<string, PRComment[]>>()
    for (const comment of inlineComments) {
      if (!comment.filePath || comment.lineNumber == null) continue
      const side = comment.side || "right"
      const fileMap = byFile.get(comment.filePath) ?? new Map<string, PRComment[]>()
      const key = `${side}:${comment.lineNumber}`
      fileMap.set(key, [...(fileMap.get(key) ?? []), comment])
      byFile.set(comment.filePath, fileMap)
    }
    return byFile
  }, [inlineComments])

  const isFilesFullWidth = fullWidth && activeTab === "files"

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className={isFilesFullWidth ? "lg:col-span-4" : "lg:col-span-3"}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as string)}>
          <TabsList className="mb-4 justify-start">
            <TabsTrigger value="conversation" className="gap-2">
              <RiChat1Line className="size-4" />
              Conversation
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <RiFileListLine className="size-4" />
              Files changed
              {diffData && (
                <span className="ml-1 text-muted-foreground">
                  ({diffData.stats.filesChanged})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversation" className="flex flex-col gap-4">
            <StatStrip>
              <StatCell label="Status" sub={timeAgo(pullRequest.createdAt)}>
                <span className="capitalize">
                  {pullRequest.isDraft && pullRequest.state === "open"
                    ? "Draft"
                    : pullRequest.state}
                </span>
              </StatCell>
              <StatCell label="Branches" mono>
                {pullRequest.headBranch} → {pullRequest.baseBranch}
              </StatCell>
              <StatCell label="Head" mono>
                {pullRequest.headOid.slice(0, 7)}
              </StatCell>
              {diffData && (
                <StatCell
                  label="Changes"
                  sub={
                    <>
                      <span className={DIFF_ADD_TEXT}>+{diffData.stats.additions}</span>{" "}
                      <span className={DIFF_REMOVE_TEXT}>−{diffData.stats.deletions}</span>
                    </>
                  }
                >
                  {diffData.stats.filesChanged} file
                  {diffData.stats.filesChanged !== 1 ? "s" : ""}
                </StatCell>
              )}
            </StatStrip>

            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
                <Avatar className="size-6">
                  <AvatarImage src={pullRequest.author.avatarUrl || undefined} />
                  <AvatarFallback>{pullRequest.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{pullRequest.author.username}</span>
                <span className="text-sm text-muted-foreground">
                  opened {timeAgo(pullRequest.createdAt)}
                </span>
              </div>
              <div className="p-4">
                {pullRequest.body ? (
                  <MarkdownBody>{pullRequest.body}</MarkdownBody>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
              </div>
              <div className="px-4 pb-4">
                <ReactionPicker
                  reactions={pullRequest.reactions}
                  onToggle={onToggleReaction}
                  disabled={!currentUserId}
                />
              </div>
            </div>

            {pullRequest.reviews.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Reviews</h3>
                {pullRequest.reviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="flex flex-col gap-4">
            {isLoadingDiff ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-8 text-muted-foreground" />
              </div>
            ) : diffData ? (
              <>
                <DiffToolbar
                  stats={diffData.stats}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  fullWidth={fullWidth}
                  onFullWidthChange={setFullWidth}
                  showSidebar={showSidebar}
                  onShowSidebarChange={setShowSidebar}
                />
                <div className="flex gap-4">
                  {showSidebar && (
                    <div className="hidden w-64 shrink-0 md:block">
                      <div className="sticky top-6 max-h-[70vh]">
                        <FilePickerSidebar
                          files={diffData.files}
                          selectedFile={selectedFile}
                          onFileSelect={scrollToFile}
                        />
                      </div>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <DiffViewer files={diffData.files} viewMode={viewMode} fileRefs={fileRefs} />
                  </div>
                </div>

                <InlineCommentsSection
                  pullRequest={pullRequest}
                  diffData={diffData}
                  inlineThreadsByFile={inlineThreadsByFile}
                  currentUserId={currentUserId}
                  onCreateInlineComment={onCreateInlineComment}
                  isCreatingInlineComment={isCreatingInlineComment}
                  onUpdateComment={onUpdateComment}
                />
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">Could not load diff</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {!isFilesFullWidth && (
        <div className="flex flex-col gap-6">
          {canReview && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Review</h3>
              {showReviewForm ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                  <Textarea
                    placeholder="Leave a comment (optional)"
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    rows={3}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-emerald-500 text-white hover:bg-emerald-500/90"
                      onClick={() => handleSubmitReview("approved")}
                      disabled={isSubmittingReview}
                    >
                      <RiCheckLine className="size-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-red-500 text-red-500"
                      onClick={() => handleSubmitReview("changes_requested")}
                      disabled={isSubmittingReview}
                    >
                      <RiCloseLine className="size-4" />
                      Request changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSubmitReview("commented")}
                      disabled={isSubmittingReview}
                    >
                      Comment only
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowReviewForm(true)}
                >
                  Add your review
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Reviewers</h3>
            {pullRequest.reviewers.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pullRequest.reviewers.map((reviewer) => (
                  <div key={reviewer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarImage src={reviewer.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {reviewer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{reviewer.username}</span>
                    </div>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-muted-foreground"
                        onClick={() => onRemoveReviewer(reviewer.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviewers</p>
            )}
            {canEdit && (
              <AssigneePicker
                availableAssignees={availableAssignees}
                selectedAssignees={pullRequest.reviewers}
                onAddAssignee={onAddReviewer}
                onRemoveAssignee={onRemoveReviewer}
                label="Add reviewer"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Assignees</h3>
            {pullRequest.assignees.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pullRequest.assignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarImage src={assignee.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee.username}</span>
                    </div>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-muted-foreground"
                        onClick={() => onRemoveAssignee(assignee.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No one assigned</p>
            )}
            {canEdit && (
              <AssigneePicker
                availableAssignees={availableAssignees}
                selectedAssignees={pullRequest.assignees}
                onAddAssignee={onAddAssignee}
                onRemoveAssignee={onRemoveAssignee}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Labels</h3>
            {pullRequest.labels.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {pullRequest.labels.map((label) => (
                  <LabelBadge
                    key={label.id}
                    label={label}
                    removable={canEdit}
                    onRemove={() => onRemoveLabel(label.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None yet</p>
            )}
            {canEdit && (
              <LabelPicker
                labels={labels}
                selectedLabels={pullRequest.labels}
                onAddLabel={onAddLabel}
                onRemoveLabel={onRemoveLabel}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function InlineCommentsSection({
  pullRequest,
  diffData,
  inlineThreadsByFile,
  currentUserId,
  onCreateInlineComment,
  isCreatingInlineComment,
  onUpdateComment,
}: {
  pullRequest: PullRequest
  diffData: PRDiff
  inlineThreadsByFile: Map<string, Map<string, PRComment[]>>
  currentUserId?: string
  onCreateInlineComment: (data: InlineCommentData) => Promise<void>
  isCreatingInlineComment: boolean
  onUpdateComment: (commentId: string, body: string) => Promise<void>
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [filePath, setFilePath] = useState(diffData.files[0]?.path || "")
  const [side, setSide] = useState<"left" | "right">("right")
  const [lineNumber, setLineNumber] = useState("")

  const hasThreads = inlineThreadsByFile.size > 0
  const parsedLine = parseInt(lineNumber, 10)
  const canSubmitLocation = !!filePath && Number.isFinite(parsedLine) && parsedLine > 0

  async function handleCreate(body: string) {
    if (!canSubmitLocation) return
    await onCreateInlineComment({
      body,
      filePath,
      side,
      lineNumber: parsedLine,
      commitOid: pullRequest.headOid,
    })
    setIsAdding(false)
    setLineNumber("")
  }

  async function handleReply(thread: PRComment[], body: string, replyToId: string) {
    const root = thread[0]
    if (!root?.filePath || root.lineNumber == null) return
    await onCreateInlineComment({
      body,
      filePath: root.filePath,
      side: root.side || "right",
      lineNumber: root.lineNumber,
      commitOid: root.commitOid || pullRequest.headOid,
      replyToId,
    })
  }

  if (!hasThreads && !currentUserId) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Inline comments</h3>
        {currentUserId && !isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={diffData.files.length === 0}
          >
            <RiAddLine data-icon="inline-start" />
            Add inline comment
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filePath} onValueChange={(value) => setFilePath(value as string)}>
              <SelectTrigger aria-label="File" size="sm" className="max-w-72 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {diffData.files.map((file) => (
                  <SelectItem key={file.path} value={file.path}>
                    {file.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={side} onValueChange={(value) => setSide(value as "left" | "right")}>
              <SelectTrigger aria-label="Side" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="right">New (right)</SelectItem>
                <SelectItem value="left">Old (left)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              aria-label="Line number"
              placeholder="Line"
              value={lineNumber}
              onChange={(e) => setLineNumber(e.target.value)}
              className="h-7 w-24 font-mono text-sm"
            />
          </div>
          <InlineCommentForm
            onSubmit={handleCreate}
            onCancel={() => setIsAdding(false)}
            isLoading={isCreatingInlineComment}
            placeholder="Comment on this line..."
          />
          {!canSubmitLocation && (
            <p className="text-xs text-muted-foreground">
              Pick a file and line number to attach the comment.
            </p>
          )}
        </div>
      )}

      {hasThreads ? (
        [...inlineThreadsByFile.entries()].map(([path, threads]) => (
          <div key={path} className="flex flex-col gap-2">
            <span className="font-mono text-xs text-muted-foreground">{path}</span>
            {[...threads.entries()].map(([key, thread]) => {
              const [threadSide, line] = key.split(":")
              return (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Line {line} ({threadSide === "left" ? "old" : "new"})
                  </span>
                  <InlineCommentThread
                    comments={thread}
                    currentUserId={currentUserId}
                    onReply={(body, replyToId) => handleReply(thread, body, replyToId)}
                    onEdit={onUpdateComment}
                  />
                </div>
              )
            })}
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No inline comments yet.</p>
      )}
    </div>
  )
}

function ReviewItem({ review }: { review: PRReview }) {
  const stateColors = {
    approved: "text-emerald-500 bg-emerald-500/10",
    changes_requested: "text-red-500 bg-red-500/10",
    commented: "text-muted-foreground bg-secondary/50",
  }

  const stateLabels = {
    approved: "Approved",
    changes_requested: "Changes requested",
    commented: "Commented",
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
        <Avatar className="size-5">
          <AvatarImage src={review.author.avatarUrl || undefined} />
          <AvatarFallback className="text-[10px]">
            {review.author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{review.author.username}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs", stateColors[review.state])}>
          {stateLabels[review.state]}
        </span>
        <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
      </div>
      {review.body && (
        <div className="p-4">
          <MarkdownBody>{review.body}</MarkdownBody>
        </div>
      )}
    </div>
  )
}
