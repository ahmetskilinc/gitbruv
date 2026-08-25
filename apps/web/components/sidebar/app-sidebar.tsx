"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  RiArrowRightSLine,
  RiChat3Line,
  RiCodeSSlashLine,
  RiCompass3Line,
  RiGitPullRequestLine,
  RiHistoryLine,
  RiHome5Line,
  RiKanbanView,
  RiLogoutBoxRLine,
  RiComputerLine,
  RiMoonLine,
  RiNotification3Line,
  RiPriceTag3Line,
  RiGitRepositoryLine,
  RiRecordCircleLine,
  RiSettings3Line,
  RiStarLine,
  RiSunLine,
  RiUserLine,
  RiAddLine,
} from "@remixicon/react"
import { useTheme } from "next-themes"
import {
  useCurrentUserSummary,
  useUnreadNotificationCount,
  useIssueCount,
  usePullRequestCount,
  useRepositoryInfo,
  useUserRepositories,
  useUserStarredRepos,
} from "@gitbruv/hooks"
import { signOut, useSession } from "@/lib/auth-client"
import { useHydrated } from "@/hooks/use-hydrated"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { NewRepositoryModal } from "@/components/new-repository-modal"
import { SidebarLayers } from "./sidebar-layers"
import { SidebarBackLink } from "./back-link"
import { useSidebarSection } from "./sidebar-section-context"

export function AppSidebar() {
  const { section, direction, repo, goToMain, goToRepo } = useSidebarSection()
  const { data: session } = useSession()
  const username = (session?.user as { username?: string } | undefined)?.username ?? ""
  const [newRepoOpen, setNewRepoOpen] = useState(false)

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="pt-3 pb-1">
          <Link
            href="/"
            className="px-2 text-lg font-bold tracking-tight group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-center"
          >
            <span className="group-data-[collapsible=icon]:hidden">gitbruv</span>
            <span className="hidden group-data-[collapsible=icon]:inline">g</span>
          </Link>
        </SidebarHeader>
        {/* The sidebar never scrolls — it sits on the ground plane like the
            header; only the content card scrolls. */}
        <SidebarContent className="overflow-hidden overscroll-none">
          <SidebarLayers activeKey={section} direction={direction}>
            {section === "repo" && repo ? (
              <RepoNav repo={repo} onBack={goToMain} />
            ) : (
              <>
                <MainNav
                  loggedIn={!!session?.user}
                  onNewRepo={() => setNewRepoOpen(true)}
                  currentRepo={repo}
                  onOpenRepo={goToRepo}
                />
                {username && <RepoShortcuts username={username} />}
              </>
            )}
          </SidebarLayers>
        </SidebarContent>

        <SidebarFooter>{session?.user ? <UserMenu /> : <AuthActions />}</SidebarFooter>
        {/* Clamp the rail to the inset card's edge: below the h-12 header,
            above the bottom gutter, minus the rounded corners on both ends.
            When collapsed, the sidebar container is 2px wider than the flex
            gap (preset quirk), so pull the rail back onto the card edge. */}
        <SidebarRail className="top-[calc(3rem+var(--radius))] bottom-[calc(0.5rem+var(--radius))] group-data-[collapsible=icon]:-right-[14px]!" />
      </Sidebar>

      <NewRepositoryModal open={newRepoOpen} onOpenChange={setNewRepoOpen} />
    </>
  )
}

function NavButton({
  href,
  active,
  tooltip,
  icon,
  label,
  trailing,
}: {
  href: string
  active: boolean
  tooltip: string
  icon: React.ReactNode
  label: string
  trailing?: React.ReactNode
}) {
  return (
    <SidebarMenuButton
      isActive={active}
      tooltip={tooltip}
      render={
        <Link href={href}>
          {icon}
          <span>{label}</span>
          {trailing}
        </Link>
      }
    />
  )
}

function MainNav({
  loggedIn,
  onNewRepo,
  currentRepo,
  onOpenRepo,
}: {
  loggedIn: boolean
  onNewRepo: () => void
  currentRepo: { username: string; repo: string } | null
  onOpenRepo: () => void
}) {
  const pathname = usePathname()
  const { data: unread } = useUnreadNotificationCount()
  const unreadCount = unread?.count ?? 0

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <NavButton
            href="/"
            active={pathname === "/"}
            tooltip="Home"
            icon={<RiHome5Line />}
            label="Home"
          />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <NavButton
            href="/explore"
            active={pathname.startsWith("/explore")}
            tooltip="Explore"
            icon={<RiCompass3Line />}
            label="Explore"
          />
        </SidebarMenuItem>
        {loggedIn && (
          <>
            <SidebarMenuItem>
              <NavButton
                href="/notifications"
                active={pathname.startsWith("/notifications")}
                tooltip="Notifications"
                icon={<RiNotification3Line />}
                label="Notifications"
              />
              {unreadCount > 0 && (
                <SidebarMenuBadge>{unreadCount > 9 ? "9+" : unreadCount}</SidebarMenuBadge>
              )}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="New repository" onClick={onNewRepo}>
                <RiAddLine />
                <span>New repository</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        )}
        {currentRepo && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={`${currentRepo.username}/${currentRepo.repo}`}
              onClick={onOpenRepo}
            >
              <RiCodeSSlashLine />
              <span className="truncate">{currentRepo.repo}</span>
              <RiArrowRightSLine className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const SIDEBAR_REPO_LIMIT = 5

/** Compact repo shortcut lists (own + starred) for the main sidebar layer. */
function RepoShortcuts({ username }: { username: string }) {
  const pathname = usePathname()
  const { data: ownData } = useUserRepositories(username)
  const { data: starredData } = useUserStarredRepos(username)

  const own = [...(ownData?.repos ?? [])]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, SIDEBAR_REPO_LIMIT)
  const starred = (starredData?.repos ?? [])
    .filter((repo) => repo.owner?.username !== username)
    .slice(0, SIDEBAR_REPO_LIMIT)

  if (own.length === 0 && starred.length === 0) return null

  return (
    <>
      {own.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Your repositories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {own.map((repo) => {
                const href = `/${username}/${repo.name}`
                return (
                  <SidebarMenuItem key={repo.id}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(href)}
                      render={
                        <Link href={href}>
                          <RiGitRepositoryLine />
                          <span className="truncate">{repo.name}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
      {starred.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Starred</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {starred.map((repo) => {
                const owner = repo.owner?.username ?? ""
                const href = `/${owner}/${repo.name}`
                return (
                  <SidebarMenuItem key={repo.id}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(href)}
                      tooltip={`${owner}/${repo.name}`}
                      render={
                        <Link href={href}>
                          <RiStarLine />
                          <span className="truncate">
                            <span className="text-muted-foreground">{owner}/</span>
                            {repo.name}
                          </span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}

function RepoNav({
  repo,
  onBack,
}: {
  repo: { username: string; repo: string }
  onBack: () => void
}) {
  const { username, repo: repoName } = repo
  const pathname = usePathname()
  const { data: repoInfo } = useRepositoryInfo(username, repoName)
  const { data: issueCount } = useIssueCount(username, repoName)
  const { data: prCount } = usePullRequestCount(username, repoName)

  const isOwner = repoInfo?.isOwner ?? false
  const defaultBranch = repoInfo?.repo?.defaultBranch ?? "main"
  const base = `/${username}/${repoName}`
  // Code tab is active on the repo root and tree/blob views.
  const codeActive =
    pathname === base ||
    pathname.startsWith(`${base}/tree`) ||
    pathname.startsWith(`${base}/blob`)
  const issuesActive =
    pathname.startsWith(`${base}/issues`) ||
    pathname.startsWith(`${base}/labels`) ||
    pathname.startsWith(`${base}/milestones`)

  return (
    <>
      <div className="px-2 pt-1">
        <SidebarBackLink name={`${username}/${repoName}`} onClick={onBack} />
      </div>

      <SidebarGroup>
        <SidebarGroupLabel>Code</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <NavButton
                href={base}
                active={codeActive}
                tooltip="Code"
                icon={<RiCodeSSlashLine />}
                label="Code"
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavButton
                href={`${base}/commits/${encodeURIComponent(defaultBranch)}`}
                active={pathname.startsWith(`${base}/commits`)}
                tooltip="Commits"
                icon={<RiHistoryLine />}
                label="Commits"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Plan</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <NavButton
                href={`${base}/issues`}
                active={issuesActive}
                tooltip="Issues"
                icon={<RiRecordCircleLine />}
                label="Issues"
              />
              {(issueCount?.open ?? 0) > 0 && (
                <SidebarMenuBadge>{issueCount?.open}</SidebarMenuBadge>
              )}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavButton
                href={`${base}/pulls`}
                active={pathname.startsWith(`${base}/pulls`)}
                tooltip="Pull requests"
                icon={<RiGitPullRequestLine />}
                label="Pull requests"
              />
              {(prCount?.open ?? 0) > 0 && (
                <SidebarMenuBadge>{prCount?.open}</SidebarMenuBadge>
              )}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavButton
                href={`${base}/discussions`}
                active={pathname.startsWith(`${base}/discussions`)}
                tooltip="Discussions"
                icon={<RiChat3Line />}
                label="Discussions"
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavButton
                href={`${base}/projects`}
                active={pathname.startsWith(`${base}/projects`)}
                tooltip="Projects"
                icon={<RiKanbanView />}
                label="Projects"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Ship</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <NavButton
                href={`${base}/releases`}
                active={pathname.startsWith(`${base}/releases`)}
                tooltip="Releases"
                icon={<RiPriceTag3Line />}
                label="Releases"
              />
            </SidebarMenuItem>
            {isOwner && (
              <SidebarMenuItem>
                <NavButton
                  href={`${base}/settings`}
                  active={pathname.startsWith(`${base}/settings`)}
                  tooltip="Settings"
                  icon={<RiSettings3Line />}
                  label="Settings"
                />
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()
  // theme is unknown on the server; render an unselected control until
  // hydration so the SSR and first client render match.
  const value = hydrated && theme ? [theme] : []

  return (
    <div className="flex items-center justify-between gap-3 px-2 py-1.5">
      <span className="text-xs text-muted-foreground">Theme</span>
      <ToggleGroup
        value={value}
        onValueChange={(next) => {
          const picked = (next as string[])[0]
          if (picked) setTheme(picked)
        }}
        variant="outline"
        size="sm"
        spacing={0}
        aria-label="Theme"
      >
        <ToggleGroupItem value="light" aria-label="Light">
          <RiSunLine className="size-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Dark">
          <RiMoonLine className="size-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="system" aria-label="System">
          <RiComputerLine className="size-3.5" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

function UserMenu() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: user } = useCurrentUserSummary(!!session?.user)
  const username = (session?.user as { username?: string } | undefined)?.username ?? ""

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={user?.name || session?.user?.name || "Account"}
                className="group-data-[collapsible=icon]:justify-center"
              >
                <Avatar className="size-6 shrink-0">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {(user?.name || session?.user?.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate group-data-[collapsible=icon]:hidden">
                  {user?.name || session?.user?.name}
                </span>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuItem className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">{user?.name || session?.user?.name}</span>
              <span className="text-xs text-muted-foreground">@{username}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <Link href={`/${username}`}>
                  <RiUserLine className="size-4" />
                  Your profile
                </Link>
              }
            />
            <DropdownMenuItem
              render={
                <Link href="/settings">
                  <RiSettings3Line className="size-4" />
                  Settings
                </Link>
              }
            />
            <DropdownMenuSeparator />
            <ThemeSwitcher />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              variant="destructive"
            >
              <RiLogoutBoxRLine className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AuthActions() {
  return (
    <SidebarMenu>
      <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
        <Button variant="outline" size="sm" className="w-full" render={<Link href="/login" />}>
          Sign in
        </Button>
        <Button size="sm" className="w-full" render={<Link href="/register" />}>
          Sign up
        </Button>
      </div>
    </SidebarMenu>
  )
}
