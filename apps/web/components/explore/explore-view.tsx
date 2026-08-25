"use client"

import Link from "next/link"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBookOpenLine,
  RiGitBranchLine,
  RiSparklingLine,
  RiStarLine,
  RiTimeLine,
  RiUserSearchLine,
} from "@remixicon/react"
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs"
import { usePublicRepositories, usePublicUsers } from "@gitbruv/hooks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { RepoRow, RepoRowList } from "@/components/repo-row"

const REPO_SORT_OPTIONS = [
  { value: "stars", label: "Most stars", icon: RiStarLine },
  { value: "updated", label: "Recently updated", icon: RiTimeLine },
  { value: "created", label: "Newest", icon: RiSparklingLine },
] as const

const USER_SORT_OPTIONS = [
  { value: "newest", label: "Newest", icon: RiSparklingLine },
  { value: "oldest", label: "Oldest", icon: RiTimeLine },
] as const

function Pagination({
  page,
  hasMore,
  setPage,
}: {
  page: number
  hasMore: boolean
  setPage: (page: number | null) => void
}) {
  if (page <= 1 && !hasMore) return null
  return (
    <div className="mt-6 flex items-center justify-between">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => setPage(page - 1 <= 1 ? null : page - 1)}
      >
        <RiArrowLeftSLine className="size-4" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(page + 1)}>
        Next
        <RiArrowRightSLine className="size-4" />
      </Button>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border-b px-4 py-3 last:border-b-0">
          <Skeleton className="mb-2 h-4 w-56" />
          <Skeleton className="h-3 w-80" />
        </div>
      ))}
    </div>
  )
}

function RepoList({
  sortBy,
  page,
  perPage,
  setPage,
}: {
  sortBy: "stars" | "updated" | "created"
  page: number
  perPage: number
  setPage: (page: number | null) => void
}) {
  const offset = (page - 1) * perPage
  const { data, isLoading } = usePublicRepositories(sortBy, perPage, offset)

  if (isLoading) return <ListSkeleton />

  const repos = data?.repos || []
  const hasMore = data?.hasMore || false

  if (repos.length === 0) {
    return (
      <Empty className="border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiGitBranchLine />
          </EmptyMedia>
          <EmptyTitle>No repositories yet</EmptyTitle>
          <EmptyDescription>Be the first to create a public repository!</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <RepoRowList>
        {repos.map((repo) => (
          <RepoRow key={repo.id} repo={repo} showOwner />
        ))}
      </RepoRowList>
      <Pagination page={page} hasMore={hasMore} setPage={setPage} />
    </>
  )
}

function UserList({
  sortBy,
  page,
  perPage,
  setPage,
}: {
  sortBy: "newest" | "oldest"
  page: number
  perPage: number
  setPage: (page: number | null) => void
}) {
  const offset = (page - 1) * perPage
  const { data, isLoading } = usePublicUsers(sortBy, perPage, offset)

  if (isLoading) return <ListSkeleton />

  const users = data?.users || []
  const hasMore = data?.hasMore || false

  if (users.length === 0) {
    return (
      <Empty className="border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiUserSearchLine />
          </EmptyMedia>
          <EmptyTitle>No users yet</EmptyTitle>
          <EmptyDescription>Be the first to join!</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="divide-y overflow-hidden rounded-lg border">
        {users.map((user) => (
          <div
            key={user.id}
            className="group/row flex items-start gap-3 px-4 py-3 transition-colors duration-100 hover:bg-muted/40 motion-reduce:transition-none"
          >
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${user.username}`}
                  className="truncate text-sm font-semibold hover:text-primary hover:underline"
                >
                  {user.name}
                </Link>
                <span className="shrink-0 text-sm text-muted-foreground">
                  @{user.username}
                </span>
              </div>
              {user.bio && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.bio}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 pt-0.5 text-xs text-muted-foreground">
              <RiBookOpenLine className="size-3.5" />
              <span className="tabular-nums">{user.repoCount}</span>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} hasMore={hasMore} setPage={setPage} />
    </>
  )
}

export function ExploreView() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["repositories", "users"]).withDefault("repositories"),
  )
  const [sortBy, setSortBy] = useQueryState(
    "sort",
    parseAsStringLiteral(["stars", "updated", "created"]).withDefault("stars"),
  )
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [userSortBy, setUserSortBy] = useQueryState(
    "usort",
    parseAsStringLiteral(["newest", "oldest"]).withDefault("newest"),
  )
  const [userPage, setUserPage] = useQueryState("upage", parseAsInteger.withDefault(1))
  const perPage = 20

  return (
    <PageContainer>
      <PageHeader
        title="Explore"
        description="Discover repositories and users from the community"
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "repositories" | "users")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="repositories" className="gap-2">
            <RiBookOpenLine className="size-4" />
            <span>Repositories</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <RiUserSearchLine className="size-4" />
            <span>Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="mt-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {REPO_SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={sortBy === value ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setSortBy(value === "stars" ? null : value)
                  setPage(null)
                }}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>
          <RepoList sortBy={sortBy} page={page} perPage={perPage} setPage={setPage} />
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {USER_SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={userSortBy === value ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setUserSortBy(value === "newest" ? null : value)
                  setUserPage(null)
                }}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>
          <UserList
            sortBy={userSortBy}
            page={userPage}
            perPage={perPage}
            setPage={setUserPage}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
