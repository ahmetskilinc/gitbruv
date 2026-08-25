"use client"

import { useState } from "react"
import Link from "next/link"
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBookOpenLine,
  RiBuilding2Line,
  RiCalendarLine,
  RiGitBranchLine,
  RiGlobalLine,
  RiMapPinLine,
  RiPulseLine,
  RiSparklingLine,
  RiStarLine,
  RiTimeLine,
  RiUserSearchLine,
} from "@remixicon/react"
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs"
import { formatDate, timeAgo } from "@gitbruv/lib"
import { usePublicRepositories, usePublicUsers } from "@gitbruv/hooks"
import { useSession } from "@/lib/auth-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { NewRepositoryModal } from "@/components/new-repository-modal"
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
    <div className="overflow-hidden rounded-xl border">
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
  const { data: session } = useSession()
  const [newRepoModalOpen, setNewRepoModalOpen] = useState(false)

  if (isLoading) return <ListSkeleton />

  const repos = data?.repos || []
  const hasMore = data?.hasMore || false

  if (repos.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiGitBranchLine />
          </EmptyMedia>
          <EmptyTitle>No repositories yet</EmptyTitle>
          <EmptyDescription>Public repositories will appear here.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {session?.user ? (
            <Button onClick={() => setNewRepoModalOpen(true)}>
              <RiAddLine />
              New repository
            </Button>
          ) : (
            <Button render={<Link href="/register" />}>Create an account</Button>
          )}
        </EmptyContent>
        <NewRepositoryModal open={newRepoModalOpen} onOpenChange={setNewRepoModalOpen} />
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
  const { data: session } = useSession()

  if (isLoading) return <ListSkeleton />

  const users = data?.users || []
  const hasMore = data?.hasMore || false

  if (users.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiUserSearchLine />
          </EmptyMedia>
          <EmptyTitle>No users yet</EmptyTitle>
          <EmptyDescription>Users will appear here.</EmptyDescription>
        </EmptyHeader>
        {!session?.user && (
          <EmptyContent>
            <Button render={<Link href="/register" />}>Create an account</Button>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <>
      <div className="divide-y overflow-hidden rounded-xl border">
        {users.map((user) => (
          <div
            key={user.id}
            className="group/row flex items-start gap-3 px-4 py-3 transition-colors duration-100 hover:bg-muted/40 motion-reduce:transition-none"
          >
            <Avatar className="size-10 shrink-0">
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
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <RiBookOpenLine className="size-3.5" />
                  <span className="tabular-nums">{user.repoCount}</span>{" "}
                  {user.repoCount === 1 ? "repository" : "repositories"}
                </span>
                {user.company && (
                  <span className="flex items-center gap-1">
                    <RiBuilding2Line className="size-3.5" />
                    <span className="max-w-40 truncate">{user.company}</span>
                  </span>
                )}
                {user.location && (
                  <span className="flex items-center gap-1">
                    <RiMapPinLine className="size-3.5" />
                    <span className="max-w-40 truncate">{user.location}</span>
                  </span>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 transition-colors duration-100 hover:text-foreground hover:underline motion-reduce:transition-none"
                  >
                    <RiGlobalLine className="size-3.5" />
                    <span className="max-w-48 truncate">
                      {user.website.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                )}
                {user.lastActiveAt && (
                  <span className="flex items-center gap-1">
                    <RiPulseLine className="size-3.5" />
                    Active {timeAgo(user.lastActiveAt)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <RiCalendarLine className="size-3.5" />
                  Joined {formatDate(user.createdAt, "MMMM yyyy")}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-focus-within/row:opacity-100 motion-reduce:transition-none"
              render={<Link href={`/${user.username}`} />}
            >
              View profile
            </Button>
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
