"use client"

import { useMemo, useState } from "react"
import { notFound, useParams } from "next/navigation"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import {
  RiBookOpenLine,
  RiBuilding2Line,
  RiCalendarLine,
  RiGitBranchLine,
  RiGithubLine,
  RiGlobalLine,
  RiLinkedinBoxLine,
  RiLinkM,
  RiMapPinLine,
  RiPulseLine,
  RiGroupLine,
  RiSearchLine,
  RiStarLine,
  RiUserFollowLine,
  RiUserUnfollowLine,
  RiTwitterXLine,
} from "@remixicon/react"
import {
  useFollowInfo,
  useToggleFollow,
  useUserActivity,
  useUserProfile,
  useUserRepositories,
  useUserStarredRepos,
  type RepositoryWithStars,
} from "@gitbruv/hooks"
import { useSession } from "@/lib/auth-client"
import { FollowList } from "@/components/profile/follow-list"
import { Spinner } from "@/components/ui/spinner"
import {
  ActivityList,
  ActivityListSkeleton,
  ActivityRow,
} from "@/components/activity/activity-row"
import { ContributionGraph } from "@/components/activity/contribution-graph"
import { Button } from "@/components/ui/button"
import { timeAgo, formatDate } from "@gitbruv/lib"
import { RepoRow, RepoRowList } from "@/components/repo-row"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { PageContainer } from "@/components/layout/page-container"

function useRepoFilter(repos: RepositoryWithStars[], filter: string) {
  return useMemo(() => {
    const q = filter.trim().toLowerCase()
    const sorted = [...repos].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    if (!q) return sorted
    return sorted.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    )
  }, [repos, filter])
}

function RepoFilterInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <InputGroup className="mb-4">
      <InputGroupAddon>
        <RiSearchLine className="size-4 text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Find a repository..."
        aria-label="Find a repository"
      />
    </InputGroup>
  )
}

function NoMatches({ filter }: { filter: string }) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiBookOpenLine />
        </EmptyMedia>
        <EmptyTitle>No matches</EmptyTitle>
        <EmptyDescription>
          No repository matches &ldquo;{filter.trim()}&rdquo;.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function RepositoriesTab({ username }: { username: string }) {
  const { data, isLoading } = useUserRepositories(username)
  const [filter, setFilter] = useState("")
  const repos = useMemo(() => data?.repos || [], [data?.repos])
  const filtered = useRepoFilter(repos, filter)

  if (isLoading) {
    return <TabSkeleton />
  }

  if (repos.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiGitBranchLine />
          </EmptyMedia>
          <EmptyTitle>No repositories yet</EmptyTitle>
          <EmptyDescription>
            This user hasn&apos;t created any public repositories.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <RepoFilterInput value={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <NoMatches filter={filter} />
      ) : (
        <RepoRowList>
          {filtered.map((repo) => (
            <RepoRow key={repo.id} repo={repo} username={username} />
          ))}
        </RepoRowList>
      )}
    </>
  )
}

function StarredTab({ username }: { username: string }) {
  const { data, isLoading } = useUserStarredRepos(username)
  const [filter, setFilter] = useState("")
  const repos = useMemo(() => data?.repos || [], [data?.repos])
  const filtered = useRepoFilter(repos, filter)

  if (isLoading) {
    return <TabSkeleton />
  }

  if (repos.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiStarLine />
          </EmptyMedia>
          <EmptyTitle>No starred repositories</EmptyTitle>
          <EmptyDescription>
            This user hasn&apos;t starred any repositories yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <RepoFilterInput value={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <NoMatches filter={filter} />
      ) : (
        <RepoRowList>
          {filtered.map((repo) => (
            <RepoRow key={repo.id} repo={repo} showOwner />
          ))}
        </RepoRowList>
      )}
    </>
  )
}

const ACTIVITY_PAGE_SIZE = 20

function ActivityTab({ username }: { username: string }) {
  const [offset, setOffset] = useState(0)
  const { data, isLoading } = useUserActivity(username, {
    limit: ACTIVITY_PAGE_SIZE,
    offset,
  })

  const items = data?.activities ?? []
  const hasMore = data?.hasMore ?? false

  return (
    <div className="flex flex-col gap-4">
      <ContributionGraph username={username} />
      {isLoading ? (
        <ActivityListSkeleton />
      ) : items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiPulseLine />
            </EmptyMedia>
            <EmptyTitle>No activity yet</EmptyTitle>
            <EmptyDescription>
              Pushes, issues, pull requests, and releases will show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ActivityList>
          {items.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </ActivityList>
      )}
      {(offset > 0 || hasMore) && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - ACTIVITY_PAGE_SIZE))}
          >
            Newer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setOffset(offset + ACTIVITY_PAGE_SIZE)}
          >
            Older
          </Button>
        </div>
      )}
    </div>
  )
}

function TabSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border-b px-4 py-3 last:border-b-0">
          <Skeleton className="mb-2 h-4 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
      ))}
    </div>
  )
}

export function ProfileView() {
  const params = useParams<{ username: string }>()
  const username = decodeURIComponent(params.username)

  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral([
      "repositories",
      "starred",
      "activity",
      "followers",
      "following",
    ]).withDefault("repositories"),
  )
  const { data: user, isLoading, error } = useUserProfile(username)
  const { data: reposData } = useUserRepositories(username)
  const { data: starredData } = useUserStarredRepos(username)
  const { data: session } = useSession()
  const { data: followInfo } = useFollowInfo(username)
  const toggleFollow = useToggleFollow(username)

  const viewerUsername =
    (session?.user as { username?: string } | undefined)?.username ?? null
  const isOwnProfile = viewerUsername === username
  const canFollow = !!session?.user && !isOwnProfile

  const repos = reposData?.repos || []
  const repoCount = repos.length
  const totalStars = repos.reduce((sum, repo) => sum + (repo.starCount || 0), 0)
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forkCount || 0), 0)
  const starredCount = starredData?.repos?.length || 0

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="flex shrink-0 flex-col gap-4 lg:w-64">
            <div className="flex items-center gap-3">
              <Skeleton className="size-16 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="mb-1.5 h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex w-full flex-1 flex-col gap-4">
            <Skeleton className="h-9 w-64" />
            <TabSkeleton />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error || !user) {
    notFound()
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col lg:w-64">
          <div className="flex items-center gap-3">
            <Avatar className="size-16">
              <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="bg-muted text-xl font-semibold text-muted-foreground">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-lg font-semibold tracking-[-0.02em]">
                  {user.name}
                </h1>
                {user.pronouns && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({user.pronouns})
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                @{user.username}
              </p>
            </div>
          </div>

          {canFollow && (
            <Button
              variant={followInfo?.isFollowing ? "outline" : "default"}
              size="sm"
              className="mt-4 w-full"
              disabled={toggleFollow.isPending || !followInfo}
              onClick={() => toggleFollow.mutate()}
            >
              {toggleFollow.isPending ? (
                <Spinner />
              ) : followInfo?.isFollowing ? (
                <RiUserUnfollowLine className="size-4" />
              ) : (
                <RiUserFollowLine className="size-4" />
              )}
              {followInfo?.isFollowing ? "Unfollow" : "Follow"}
            </Button>
          )}

          {user.bio && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {user.bio}
            </p>
          )}

          <Separator className="my-4" />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground tabular-nums">
                {repoCount}
              </span>{" "}
              {repoCount === 1 ? "repository" : "repositories"}
            </span>
            <span>
              <span className="font-medium text-foreground tabular-nums">
                {totalStars}
              </span>{" "}
              {totalStars === 1 ? "star" : "stars"}
            </span>
            {totalForks > 0 && (
              <span>
                <span className="font-medium text-foreground tabular-nums">
                  {totalForks}
                </span>{" "}
                {totalForks === 1 ? "fork" : "forks"}
              </span>
            )}
            {starredCount > 0 && (
              <span>
                <span className="font-medium text-foreground tabular-nums">
                  {starredCount}
                </span>{" "}
                starred
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setTab("followers")}
              className="transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
            >
              <span className="font-medium text-foreground tabular-nums">
                {followInfo?.followers ?? 0}
              </span>{" "}
              {(followInfo?.followers ?? 0) === 1 ? "follower" : "followers"}
            </button>
            <button
              type="button"
              onClick={() => setTab("following")}
              className="transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
            >
              <span className="font-medium text-foreground tabular-nums">
                {followInfo?.following ?? 0}
              </span>{" "}
              following
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {user.company && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RiBuilding2Line className="size-4 shrink-0" />
                <span className="truncate">{user.company}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RiMapPinLine className="size-4 shrink-0" />
                <span className="truncate">{user.location}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RiGlobalLine className="size-4 shrink-0" />
                <a
                  aria-label="Website"
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate transition-colors duration-100 hover:text-foreground hover:underline motion-reduce:transition-none"
                >
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            {user.lastActiveAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RiPulseLine className="size-4 shrink-0" />
                <span>Active {timeAgo(user.lastActiveAt)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RiCalendarLine className="size-4 shrink-0" />
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {user.socialLinks && (
            <div className="mt-4 flex items-center gap-3">
              {user.socialLinks.github && (
                <a
                  aria-label="GitHub profile"
                  href={user.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
                >
                  <RiGithubLine className="size-4.5" />
                </a>
              )}
              {user.socialLinks.twitter && (
                <a
                  aria-label="X profile"
                  href={user.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
                >
                  <RiTwitterXLine className="size-4.5" />
                </a>
              )}
              {user.socialLinks.linkedin && (
                <a
                  aria-label="LinkedIn profile"
                  href={user.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
                >
                  <RiLinkedinBoxLine className="size-4.5" />
                </a>
              )}
              {user.socialLinks.custom?.map((url, i) => (
                <a
                  key={i}
                  aria-label={`Social link ${i + 1}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors duration-100 hover:text-foreground motion-reduce:transition-none"
                >
                  <RiLinkM className="size-4.5" />
                </a>
              ))}
            </div>
          )}
        </aside>

        <div className="w-full min-w-0 flex-1">
          <Tabs
            value={tab}
            onValueChange={(value) =>
              setTab(value === "repositories" ? null : (value as "starred"))
            }
          >
            <TabsList className="mb-4">
              <TabsTrigger value="repositories" className="gap-2">
                <RiBookOpenLine className="size-4" />
                <span>Repositories</span>
                {repoCount > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({repoCount})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="starred" className="gap-2">
                <RiStarLine className="size-4" />
                <span>Starred</span>
                {starredCount > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({starredCount})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <RiPulseLine className="size-4" />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger value="followers" className="gap-2">
                <RiGroupLine className="size-4" />
                <span>Followers</span>
                {(followInfo?.followers ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({followInfo?.followers})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="following" className="gap-2">
                <RiUserFollowLine className="size-4" />
                <span>Following</span>
                {(followInfo?.following ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({followInfo?.following})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="repositories" className="mt-0">
              <RepositoriesTab username={username} />
            </TabsContent>

            <TabsContent value="starred" className="mt-0">
              <StarredTab username={username} />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <ActivityTab username={username} />
            </TabsContent>

            <TabsContent value="followers" className="mt-0">
              <FollowList username={username} mode="followers" />
            </TabsContent>

            <TabsContent value="following" className="mt-0">
              <FollowList username={username} mode="following" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  )
}
