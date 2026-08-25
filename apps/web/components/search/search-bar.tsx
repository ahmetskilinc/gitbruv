"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  RiAddLine,
  RiBookOpenLine,
  RiCompass3Line,
  RiContrastLine,
  RiErrorWarningLine,
  RiGitPullRequestLine,
  RiLoginBoxLine,
  RiNotification3Line,
  RiSearchLine,
  RiSettings3Line,
  RiUserLine,
} from "@remixicon/react"
import { useSearch, useUserRepositories, type SearchResult } from "@gitbruv/hooks"
import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { NewRepositoryModal } from "@/components/new-repository-modal"

const TYPE_META: Record<
  SearchResult["type"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  repository: { label: "Repositories", icon: RiBookOpenLine },
  issue: { label: "Issues", icon: RiErrorWarningLine },
  pull_request: { label: "Pull requests", icon: RiGitPullRequestLine },
  user: { label: "Users", icon: RiUserLine },
}

const TYPE_ORDER: SearchResult["type"][] = [
  "repository",
  "issue",
  "pull_request",
  "user",
]

const QUICK_REPO_LIMIT = 6

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { data: session } = useSession()
  const username = (session?.user as { username?: string } | undefined)?.username ?? ""
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [newRepoOpen, setNewRepoOpen] = useState(false)
  const { data, isLoading } = useSearch(query, {
    enabled: open && query.trim().length >= 2,
  })
  const { data: myReposData } = useUserRepositories(open ? username : "")

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      if (
        (event.key === "/" && !isTyping) ||
        (event.metaKey && event.key.toLowerCase() === "k")
      ) {
        event.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const results = useMemo(() => data?.results ?? [], [data?.results])
  const hasQuery = query.trim().length >= 2

  const grouped = useMemo(() => {
    const byType = new Map<SearchResult["type"], SearchResult[]>()
    for (const result of results) {
      const list = byType.get(result.type) ?? []
      list.push(result)
      byType.set(result.type, list)
    }
    return TYPE_ORDER.filter((t) => byType.has(t)).map((t) => ({
      type: t,
      ...TYPE_META[t],
      items: byType.get(t)!,
    }))
  }, [results])

  const myRepos = useMemo(() => {
    const repos = myReposData?.repos ?? []
    return [...repos]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, QUICK_REPO_LIMIT)
  }, [myReposData?.repos])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setQuery("")
  }

  function go(url: string) {
    handleOpenChange(false)
    router.push(url)
  }

  function goToSearch() {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return
    go(`/search?q=${encodeURIComponent(trimmedQuery)}&type=all`)
  }

  function run(action: () => void) {
    handleOpenChange(false)
    action()
  }

  return (
    <div className={cn("shrink-0", className)}>
      <Button
        variant="outline"
        className="hidden w-56 justify-start text-muted-foreground shadow-none md:flex"
        onClick={() => setOpen(true)}
      >
        <RiSearchLine data-icon="inline-start" />
        <span className="flex-1 text-left font-normal">Search gitbruv</span>
        <Kbd>⌘K</Kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <RiSearchLine />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Search gitbruv"
        description="Search repositories, issues, pull requests, and users."
      >
        {/* Search results come from the server; only the idle quick
            actions/repos benefit from cmdk's own filtering. */}
        <Command shouldFilter={!hasQuery}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search repositories, issues, pull requests, and users..."
          />
          <CommandList>
            {!hasQuery && (
              <>
                <CommandEmpty>Keep typing to search everything.</CommandEmpty>
                <CommandGroup heading="Quick actions">
                  {session?.user ? (
                    <>
                      <CommandItem
                        value="new repository create"
                        onSelect={() => run(() => setNewRepoOpen(true))}
                      >
                        <RiAddLine className="size-4 shrink-0 text-muted-foreground" />
                        New repository
                      </CommandItem>
                      <CommandItem
                        value="notifications inbox"
                        onSelect={() => go("/notifications")}
                      >
                        <RiNotification3Line className="size-4 shrink-0 text-muted-foreground" />
                        Notifications
                      </CommandItem>
                      <CommandItem
                        value="your profile"
                        onSelect={() => go(`/${username}`)}
                      >
                        <RiUserLine className="size-4 shrink-0 text-muted-foreground" />
                        Your profile
                      </CommandItem>
                      <CommandItem
                        value="settings preferences account"
                        onSelect={() => go("/settings")}
                      >
                        <RiSettings3Line className="size-4 shrink-0 text-muted-foreground" />
                        Settings
                      </CommandItem>
                    </>
                  ) : (
                    <CommandItem value="sign in login" onSelect={() => go("/login")}>
                      <RiLoginBoxLine className="size-4 shrink-0 text-muted-foreground" />
                      Sign in
                    </CommandItem>
                  )}
                  <CommandItem
                    value="explore discover repositories users"
                    onSelect={() => go("/explore")}
                  >
                    <RiCompass3Line className="size-4 shrink-0 text-muted-foreground" />
                    Explore
                  </CommandItem>
                  <CommandItem
                    value="toggle theme dark light mode"
                    onSelect={() =>
                      run(() =>
                        setTheme(resolvedTheme === "dark" ? "light" : "dark"),
                      )
                    }
                  >
                    <RiContrastLine className="size-4 shrink-0 text-muted-foreground" />
                    Toggle theme
                  </CommandItem>
                </CommandGroup>
                {myRepos.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Your repositories">
                      {myRepos.map((repo) => (
                        <CommandItem
                          key={repo.id}
                          value={`repo ${repo.name} ${repo.description ?? ""}`}
                          onSelect={() => go(`/${username}/${repo.name}`)}
                        >
                          <RiBookOpenLine className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{repo.name}</div>
                            {repo.description && (
                              <div className="truncate text-xs text-muted-foreground">
                                {repo.description}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
            {hasQuery && isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Searching...
              </div>
            )}
            {hasQuery && !isLoading && results.length === 0 && (
              <CommandEmpty>No results for &ldquo;{query.trim()}&rdquo;.</CommandEmpty>
            )}
            {hasQuery &&
              grouped.map((group) => (
                <CommandGroup key={group.type} heading={group.label}>
                  {group.items.map((result) => (
                    <CommandItem
                      key={`${result.type}-${result.id}`}
                      value={`${result.type}-${result.id}`}
                      onSelect={() => go(result.url)}
                    >
                      <group.icon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate font-medium">{result.title}</span>
                          {result.number && (
                            <span className="shrink-0 text-muted-foreground">
                              #{result.number}
                            </span>
                          )}
                        </div>
                        {(result.repository || result.description) && (
                          <div className="truncate text-xs text-muted-foreground">
                            {result.repository
                              ? `${result.repository.owner}/${result.repository.name}`
                              : result.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            {hasQuery && !isLoading && results.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="see-all-results" onSelect={goToSearch}>
                    <RiSearchLine className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      See all results for &ldquo;{query.trim()}&rdquo;
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      <NewRepositoryModal open={newRepoOpen} onOpenChange={setNewRepoOpen} />
    </div>
  )
}
