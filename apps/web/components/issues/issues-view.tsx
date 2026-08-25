"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiFlagLine,
  RiPriceTag3Line,
  RiRecordCircleLine,
} from "@remixicon/react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useIssueCount, useIssues, useLabels } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { IssueItem } from "./issue-item"
import { LabelFilterMenu } from "./pickers"

export function IssuesView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)

  const [state, setState] = useQueryState(
    "state",
    parseAsStringLiteral(["open", "closed"]).withDefault("open"),
  )
  const [labelFilter, setLabelFilter] = useQueryState("label")

  const { data: countData, isLoading: isLoadingCount } = useIssueCount(username, repo)
  const { data: labelsData } = useLabels(username, repo)
  const { data: issuesData, isLoading: isLoadingIssues } = useIssues(username, repo, {
    state,
    label: labelFilter || undefined,
    limit: 30,
  })

  const isLoading = isLoadingCount || isLoadingIssues
  const issues = issuesData?.issues || []
  const labels = labelsData?.labels || []
  const openCount = countData?.open || 0
  const closedCount = countData?.closed || 0

  return (
    <PageContainer>
      <PageHeader
        title="Issues"
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/${username}/${repo}/labels`} />}
            >
              <RiPriceTag3Line data-icon="inline-start" className="size-4" />
              Labels
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/${username}/${repo}/milestones`} />}
            >
              <RiFlagLine data-icon="inline-start" className="size-4" />
              Milestones
            </Button>
            <Button size="sm" render={<Link href={`/${username}/${repo}/issues/new`} />}>
              <RiAddLine data-icon="inline-start" className="size-4" />
              New issue
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={state} onValueChange={(value) => setState(value as "open" | "closed")}>
            <TabsList>
              <TabsTrigger value="open" className="gap-1.5 px-2.5">
                <RiRecordCircleLine className="size-4" />
                {openCount} Open
              </TabsTrigger>
              <TabsTrigger value="closed" className="gap-1.5 px-2.5">
                <RiCheckboxCircleLine className="size-4" />
                {closedCount} Closed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <LabelFilterMenu labels={labels} value={labelFilter} onValueChange={setLabelFilter} />
        </div>

        {isLoading && !issues.length ? (
          <IssueListSkeleton />
        ) : issues.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiRecordCircleLine />
              </EmptyMedia>
              <EmptyTitle>No {state} issues</EmptyTitle>
              <EmptyDescription>
                {labelFilter
                  ? "No issues match the selected label."
                  : "Issues track bugs, tasks and ideas for this repository."}
              </EmptyDescription>
            </EmptyHeader>
            {state === "open" && !labelFilter && (
              <EmptyContent>
                <Button render={<Link href={`/${username}/${repo}/issues/new`} />}>
                  <RiAddLine data-icon="inline-start" className="size-4" />
                  New issue
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            {issues.map((issue) => (
              <IssueItem key={issue.id} issue={issue} username={username} repo={repo} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}

function IssueListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
        >
          <Skeleton className="size-4 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
