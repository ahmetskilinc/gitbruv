"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  RiAddLine,
  RiBookOpenLine,
  RiGitBranchLine,
  RiPulseLine,
  RiSearchLine,
} from "@remixicon/react"
import { useActivityFeed, useCurrentUserSummary, useUserRepositories } from "@gitbruv/hooks"
import {
  ActivityList,
  ActivityListSkeleton,
  ActivityRow,
} from "@/components/activity/activity-row"
import { useSession } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { PageContainer } from "@/components/layout/page-container"
import { NewRepositoryModal } from "@/components/new-repository-modal"
import { RepoRow, RepoRowList } from "@/components/repo-row"

export function HomeView() {
  const { data: session, isPending: sessionLoading } = useSession()

  if (sessionLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return <LandingPage />
  }

  return <LoggedInHome username={(session.user as { username?: string }).username || ""} />
}

function LoggedInHome({ username }: { username: string }) {
  const { data: user, isLoading: userLoading } = useCurrentUserSummary(true)
  const { data, isLoading: reposLoading } = useUserRepositories(username)
  const [newRepoModalOpen, setNewRepoModalOpen] = useState(false)
  const [filter, setFilter] = useState("")

  const repos = useMemo(() => data?.repos || [], [data?.repos])

  const filteredRepos = useMemo(() => {
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

  const publicCount = repos.filter((r) => r.visibility === "public").length
  const privateCount = repos.length - publicCount

  return (
    <PageContainer>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="shrink-0 lg:w-64">
          {userLoading ? (
            <Card className="gap-0 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="mb-1.5 h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="gap-0 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
                    {user?.name.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <Link
                    href={`/${username}`}
                    className="block truncate font-semibold hover:underline"
                  >
                    {user?.name}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">@{username}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">{repos.length}</span>{" "}
                  {repos.length === 1 ? "repository" : "repositories"}
                </span>
              </div>
              {privateCount > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {publicCount} public · {privateCount} private
                </p>
              )}
            </Card>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Your repositories
            </h2>
            <Button size="sm" onClick={() => setNewRepoModalOpen(true)}>
              <RiAddLine />
              New
            </Button>
          </div>

          {repos.length > 0 && (
            <InputGroup className="mb-4">
              <InputGroupAddon>
                <RiSearchLine className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Find a repository..."
                aria-label="Find a repository"
              />
            </InputGroup>
          )}

          {userLoading || reposLoading ? (
            <div className="overflow-hidden rounded-xl border">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-b px-4 py-3 last:border-b-0">
                  <Skeleton className="mb-2 h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                </div>
              ))}
            </div>
          ) : repos.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiGitBranchLine />
                </EmptyMedia>
                <EmptyTitle>No repositories yet</EmptyTitle>
                <EmptyDescription>
                  Create your first repository to start building something awesome.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setNewRepoModalOpen(true)}>
                  <RiAddLine />
                  Create repository
                </Button>
              </EmptyContent>
            </Empty>
          ) : filteredRepos.length === 0 ? (
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
          ) : (
            <RepoRowList>
              {filteredRepos.map((repo) => (
                <RepoRow key={repo.id} repo={repo} username={username} />
              ))}
            </RepoRowList>
          )}

          <HomeActivityFeed />
        </div>
      </div>
      <NewRepositoryModal open={newRepoModalOpen} onOpenChange={setNewRepoModalOpen} />
    </PageContainer>
  )
}

const FEED_PAGE_SIZE = 15

function HomeActivityFeed() {
  const [offset, setOffset] = useState(0)
  const { data, isLoading } = useActivityFeed({ limit: FEED_PAGE_SIZE, offset })

  const items = data?.activities ?? []
  const hasMore = data?.hasMore ?? false

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em]">Recent activity</h2>
      {isLoading ? (
        <ActivityListSkeleton rows={4} />
      ) : items.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiPulseLine />
            </EmptyMedia>
            <EmptyTitle>No activity yet</EmptyTitle>
            <EmptyDescription>
              Your activity and activity from people you follow will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ActivityList>
          {items.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} showActor />
          ))}
        </ActivityList>
      )}
      {(offset > 0 || hasMore) && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - FEED_PAGE_SIZE))}
          >
            Newer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setOffset(offset + FEED_PAGE_SIZE)}
          >
            Older
          </Button>
        </div>
      )}
    </div>
  )
}

function LandingPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b bg-background py-16 sm:py-24 lg:py-28">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="max-w-2xl">
            <p className="mb-6 text-sm font-medium text-muted-foreground">
              Git hosting that stays out of your way
            </p>
            <h1 className="text-4xl/11 font-semibold tracking-[-0.045em] text-balance sm:text-5xl/14 lg:text-6xl/17">
              Ship code with your people.
            </h1>
            <p className="mt-6 max-w-xl text-base/7 text-pretty text-muted-foreground sm:text-lg/8">
              Host repositories, review pull requests, track issues, and keep
              project conversations close to the code—without the enterprise
              clutter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/register" />}>
                Create your account
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/explore" />}>
                Explore public projects
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute -inset-12 -z-10 bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_68%)]" />
            <div className="rounded-xl bg-muted/50 p-0.5 shadow-2xl">
              <div className="overflow-hidden rounded-bezel border bg-card">
                <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                  <span className="size-2.5 rounded-full bg-destructive/70" />
                  <span className="size-2.5 rounded-full bg-amber-500/70" />
                  <span className="size-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-xs font-medium text-muted-foreground">
                    acme / atlas
                  </span>
                </div>
                <div className="grid min-h-80 sm:grid-cols-[11rem_1fr]">
                  <div className="hidden border-r bg-muted/20 p-3 sm:block">
                    {["Code", "Issues  12", "Pull requests  4", "Discussions", "Releases"].map(
                      (item, index) => (
                        <div
                          key={item}
                          className={
                            index === 0
                              ? "rounded-md bg-sidebar-accent px-3 py-2 text-sm font-medium"
                              : "px-3 py-2 text-sm text-muted-foreground"
                          }
                        >
                          {item}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4 border-b pb-4">
                      <div>
                        <p className="font-semibold">atlas</p>
                        <p className="text-xs text-muted-foreground">
                          A tiny, fast deployment toolkit
                        </p>
                      </div>
                      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                        Public
                      </span>
                    </div>
                    <div className="mt-5 overflow-hidden rounded-lg border bg-background font-mono text-xs/5">
                      <div className="border-b bg-muted/40 px-4 py-2 text-muted-foreground">
                        src/deploy.ts
                      </div>
                      <pre className="overflow-x-auto p-4 text-[0.75rem]/5">
                        <code>
                          <span className="text-primary">export async function</span>{" "}
                          deploy(app) {"{\n"}{"  "}
                          <span className="text-muted-foreground">
                            {"// build once, ship confidently"}
                          </span>
                          {"\n"}{"  "}
                          <span className="text-primary">return</span> app.release();
                          {"\n}"}
                        </code>
                      </pre>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      14 checks passed
                      <span aria-hidden="true">·</span>
                      merged 8 minutes ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
