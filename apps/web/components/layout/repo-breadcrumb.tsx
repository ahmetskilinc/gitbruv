"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import {
  RiChat3Line,
  RiCheckboxCircleLine,
  RiExpandUpDownLine,
  RiFileCopyLine,
  RiGitBranchLine,
  RiGitPullRequestLine,
  RiHistoryLine,
  RiKanbanView,
  RiPriceTag3Line,
  RiRecordCircleLine,
  RiSettings3Line,
} from "@remixicon/react"
import { useUserRepositories, useRepoBranches, useRepositoryInfo } from "@gitbruv/hooks"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/** A breadcrumb segment that opens a dropdown to switch between siblings. */
function BreadcrumbSelector({
  label,
  icon,
  options,
  onSelect,
}: {
  label: string
  icon?: React.ReactNode
  options: { value: string; label: string }[]
  onSelect: (value: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-foreground outline-hidden transition-colors duration-150 ease-out-expo hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 motion-reduce:transition-none">
        {icon}
        <span className="max-w-40 truncate">{label}</span>
        <RiExpandUpDownLine className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-56 overflow-y-auto">
        {options.length === 0 ? (
          <DropdownMenuItem disabled>No options</DropdownMenuItem>
        ) : (
          options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={cn(opt.label === label && "font-medium")}
            >
              <span className="truncate">{opt.label}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A copyable monospace chip for a resource id (commit sha, #number, path). */
function BreadcrumbIdChip({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        })
      }}
      className="flex h-7 items-center gap-2 rounded-md border bg-background px-2.5 font-mono text-xs text-muted-foreground outline-hidden transition-colors duration-150 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 motion-reduce:transition-none"
      aria-label="Copy"
    >
      <span className="max-w-64 truncate">{display ?? value}</span>
      {copied ? (
        <RiCheckboxCircleLine className="size-3.5 text-emerald-500" />
      ) : (
        <RiFileCopyLine className="size-3.5" />
      )}
    </button>
  )
}

const SECTIONS: {
  match: RegExp
  label: string
  icon?: React.ComponentType<{ className?: string }>
}[] = [
  { match: /^\/issues/, label: "Issues", icon: RiRecordCircleLine },
  { match: /^\/pulls/, label: "Pull requests", icon: RiGitPullRequestLine },
  { match: /^\/discussions/, label: "Discussions", icon: RiChat3Line },
  { match: /^\/projects/, label: "Projects", icon: RiKanbanView },
  { match: /^\/releases/, label: "Releases", icon: RiPriceTag3Line },
  { match: /^\/milestones/, label: "Milestones" },
  { match: /^\/labels/, label: "Labels", icon: RiPriceTag3Line },
  { match: /^\/settings/, label: "Settings", icon: RiSettings3Line },
  { match: /^\/commits/, label: "Commits", icon: RiHistoryLine },
]

export function RepoBreadcrumb() {
  const params = useParams<{
    username?: string
    repo?: string
    number?: string
    oid?: string
    branch?: string
    path?: string[]
  }>()
  const pathname = usePathname()
  const router = useRouter()

  const username = params.username ? decodeURIComponent(params.username) : undefined
  const repo = params.repo ? decodeURIComponent(params.repo) : undefined

  const { data: repoInfo } = useRepositoryInfo(username ?? "", repo ?? "")
  const { data: userRepos } = useUserRepositories(username ?? "")
  const { data: branchData } = useRepoBranches(username ?? "", repo ?? "")

  if (!username || !repo) return null

  const base = `/${username}/${repo}`
  const rest = pathname.slice(base.length)
  const isCodeView = rest === "" || /^\/(tree|blob|commits)/.test(rest)
  const section = SECTIONS.find((s) => s.match.test(rest))
  const defaultBranch = repoInfo?.repo?.defaultBranch ?? "main"
  const branchMatch = rest.match(/^\/(?:tree|blob|commits)\/([^/]+)/)
  const currentBranch = branchMatch ? decodeURIComponent(branchMatch[1]) : defaultBranch

  // Context-aware id chip
  const splat = params.path?.map((s) => decodeURIComponent(s)).join("/")
  let idChip: { value: string; display: string } | null = null
  if (params.oid) idChip = { value: params.oid, display: params.oid.slice(0, 7) }
  else if (
    params.number &&
    (rest.startsWith("/issues/") || rest.startsWith("/pulls/") || rest.startsWith("/discussions/"))
  )
    idChip = { value: `#${params.number}`, display: `#${params.number}` }
  else if (rest.startsWith("/blob/") && splat) {
    const filePath = splat.split("/").slice(1).join("/")
    if (filePath) idChip = { value: filePath, display: filePath }
  }

  const repoOptions = (userRepos?.repos ?? []).map((r) => ({ value: r.name, label: r.name }))
  const branchOptions = (branchData?.branches ?? []).map((b) => ({ value: b, label: b }))

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={`/${username}`} />}>{username}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbSelector
            label={repo}
            options={repoOptions}
            onSelect={(name) => router.push(`/${username}/${name}`)}
          />
        </BreadcrumbItem>

        {isCodeView && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbSelector
                label={currentBranch}
                icon={<RiGitBranchLine className="size-3.5 opacity-70" />}
                options={branchOptions}
                onSelect={(branch) =>
                  router.push(`${base}/tree/${encodeURIComponent(branch)}`)
                }
              />
            </BreadcrumbItem>
          </>
        )}

        {section && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5">
                {section.icon && (
                  <section.icon className="size-4 text-muted-foreground" />
                )}
                {section.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {idChip && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbIdChip value={idChip.value} display={idChip.display} />
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
