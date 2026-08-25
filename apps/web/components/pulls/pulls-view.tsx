"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiGitMergeLine,
  RiGitPullRequestLine,
  RiRecordCircleLine,
} from "@remixicon/react"
import { parseAsStringLiteral, useQueryState } from "nuqs"

import { useLabels, usePullRequestCount, usePullRequests } from "@gitbruv/hooks"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PRItem } from "./pr-item"
import { LabelFilterMenu } from "./pickers"

export function PullsView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)

  const [state, setState] = useQueryState(
    "state",
    parseAsStringLiteral(["open", "closed", "merged", "all"]).withDefault("open"),
  )
  const [labelFilter, setLabelFilter] = useQueryState("label")

  const { data: countData, isLoading: isLoadingCount } = usePullRequestCount(username, repo)
  const { data: labelsData } = useLabels(username, repo)
  const { data: pullsData, isLoading: isLoadingPulls } = usePullRequests(username, repo, {
    state,
    label: labelFilter || undefined,
    limit: 30,
  })

  const isLoading = isLoadingCount || isLoadingPulls
  const pullRequests = pullsData?.pullRequests || []
  const labels = labelsData?.labels || []
  const openCount = countData?.open || 0
  const closedCount = countData?.closed || 0
  const mergedCount = countData?.merged || 0

  return (
    <PageContainer>
      <PageHeader
        title="Pull requests"
        actions={
          <Button size="sm" render={<Link href={`/${username}/${repo}/pulls/new`} />}>
            <RiAddLine data-icon="inline-start" />
            New pull request
          </Button>
        }
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={state}
            onValueChange={(value) =>
              setState(value as "open" | "closed" | "merged" | "all")
            }
          >
            <TabsList className="h-auto justify-start gap-2">
              <TabsTrigger value="open" className="gap-2 text-sm">
                <RiRecordCircleLine className="size-4" />
                <span>{openCount} Open</span>
              </TabsTrigger>
              <TabsTrigger value="merged" className="gap-2 text-sm">
                <RiGitMergeLine className="size-4" />
                <span>{mergedCount} Merged</span>
              </TabsTrigger>
              <TabsTrigger value="closed" className="gap-2 text-sm">
                <RiCheckboxCircleLine className="size-4" />
                <span>{closedCount} Closed</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <LabelFilterMenu labels={labels} value={labelFilter} onValueChange={setLabelFilter} />
        </div>

        {isLoading && !pullRequests.length ? (
          <PRListSkeleton />
        ) : pullRequests.length === 0 ? (
          <Empty className="border border-dashed py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiGitPullRequestLine />
              </EmptyMedia>
              <EmptyTitle>No {state === "all" ? "" : state} pull requests</EmptyTitle>
              <EmptyDescription>
                {labelFilter
                  ? "No pull requests match the selected label."
                  : "Pull requests propose and review changes before merging."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {pullRequests.map((pr) => (
              <PRItem key={pr.id} pullRequest={pr} username={username} repo={repo} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}

function PRListSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
        >
          <Skeleton className="h-5 w-16" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
