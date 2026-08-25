"use client"

import { usePathname, useRouter } from "next/navigation"
import { RiArrowDownSLine, RiCheckLine, RiGitBranchLine } from "@remixicon/react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type BranchSelectorProps = {
  branches: string[]
  currentBranch: string
  defaultBranch: string
  username: string
  repoName: string
}

type RouteContext = "root" | "tree" | "blob" | "commits"

function getRouteContext(pathname: string): RouteContext {
  if (pathname.includes("/tree/")) return "tree"
  if (pathname.includes("/blob/")) return "blob"
  if (pathname.includes("/commits/")) return "commits"
  return "root"
}

function getCurrentPath(pathname: string, context: RouteContext): string {
  if (context === "root" || context === "commits") return ""

  const match = pathname.match(/\/(tree|blob)\/[^/]+\/(.+)/)
  if (match) {
    return decodeURIComponent(match[2])
  }
  return ""
}

export function BranchSelector({
  branches,
  currentBranch,
  defaultBranch,
  username,
  repoName,
}: BranchSelectorProps) {
  const pathname = usePathname()
  const router = useRouter()

  const context = getRouteContext(pathname)
  const currentPath = getCurrentPath(pathname, context)
  const base = `/${username}/${repoName}`

  const handleBranchChange = (newBranch: string) => {
    if (newBranch === currentBranch) return
    const encodedBranch = encodeURIComponent(newBranch)

    switch (context) {
      case "root":
        if (newBranch === defaultBranch) {
          router.push(base)
        } else {
          router.push(`${base}/tree/${encodedBranch}`)
        }
        break
      case "tree":
        router.push(
          `${base}/tree/${encodedBranch}${currentPath ? `/${currentPath}` : ""}`,
        )
        break
      case "blob":
        router.push(
          `${base}/blob/${encodedBranch}${currentPath ? `/${currentPath}` : ""}`,
        )
        break
      case "commits":
        router.push(`${base}/commits/${encodedBranch}`)
        break
    }
  }

  if (branches.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-secondary/50 px-3 py-1.5 text-sm">
        <RiGitBranchLine className="size-4 text-primary" />
        <span className="font-mono">{currentBranch}</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "outline", size: "default" })}
      >
        <RiGitBranchLine className="size-4 text-primary" />
        <span className="max-w-[120px] truncate font-mono">{currentBranch}</span>
        <RiArrowDownSLine className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
          Switch branch
        </div>
        <div className="max-h-[280px] overflow-y-auto py-1">
          {branches.map((branch: string) => (
            <DropdownMenuItem
              key={branch}
              onClick={() => handleBranchChange(branch)}
              className={cn(
                "cursor-pointer px-3 py-2 font-mono text-sm",
                branch === currentBranch && "bg-primary/10",
              )}
            >
              <RiCheckLine
                className={cn(
                  "mr-2 size-3.5",
                  branch === currentBranch ? "text-primary opacity-100" : "opacity-0",
                )}
              />
              <span className="truncate">{branch}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
