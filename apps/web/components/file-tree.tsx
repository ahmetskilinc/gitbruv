"use client"

import Link from "next/link"
import { timeAgo } from "@gitbruv/lib"
import {
  RiFile3Line,
  RiFileCodeLine,
  RiFileImageLine,
  RiFileMusicLine,
  RiFileTextLine,
  RiFileVideoLine,
  RiBracesLine,
  RiFolder3Fill,
} from "@remixicon/react"
import type { FileLastCommit } from "@gitbruv/hooks"
import { Skeleton } from "@/components/ui/skeleton"

type FileEntry = {
  name: string
  type: "blob" | "tree"
  oid: string
  path: string
}

type FileTreeProps = {
  files: FileEntry[]
  username: string
  repoName: string
  branch: string
  commits?: FileLastCommit[]
  isLoadingCommits?: boolean
}

type IconComponent = React.ComponentType<{ className?: string }>

const CODE_EXTS = [
  "ts", "tsx", "js", "jsx", "py", "rb", "go", "rs", "java",
  "c", "cpp", "h", "hpp", "cs", "php", "sh",
]
const FILE_ICONS: Record<string, IconComponent> = {
  ...Object.fromEntries(CODE_EXTS.map((ext) => [ext, RiFileCodeLine])),
  md: RiFileTextLine,
  txt: RiFileTextLine,
  json: RiBracesLine,
  yaml: RiBracesLine,
  yml: RiBracesLine,
  toml: RiBracesLine,
  png: RiFileImageLine,
  jpg: RiFileImageLine,
  jpeg: RiFileImageLine,
  gif: RiFileImageLine,
  svg: RiFileImageLine,
  webp: RiFileImageLine,
  mp3: RiFileMusicLine,
  wav: RiFileMusicLine,
  mp4: RiFileVideoLine,
  mov: RiFileVideoLine,
}

function getFileIcon(name: string, type: "blob" | "tree"): IconComponent {
  if (type === "tree") return RiFolder3Fill
  const ext = name.split(".").pop()?.toLowerCase() || ""
  return FILE_ICONS[ext] || RiFile3Line
}

function truncateMessage(message: string, maxLength = 50): string {
  if (message.length <= maxLength) return message
  return message.slice(0, maxLength).trim() + "..."
}

export function FileTree({
  files,
  username,
  repoName,
  branch,
  commits,
  isLoadingCommits,
}: FileTreeProps) {
  const folders: FileEntry[] = []
  const fileItems: FileEntry[] = []
  for (const f of files) {
    if (f.type === "tree") folders.push(f)
    else fileItems.push(f)
  }
  const sortedFiles = [
    ...folders.toSorted((a, b) => a.name.localeCompare(b.name)),
    ...fileItems.toSorted((a, b) => a.name.localeCompare(b.name)),
  ]

  const commitsByPath =
    commits?.reduce(
      (acc, commit) => {
        acc[commit.path] = commit
        return acc
      },
      {} as Record<string, FileLastCommit>,
    ) ?? {}

  const encodedBranch = encodeURIComponent(branch)

  return (
    <div className="divide-y">
      {sortedFiles.map((file) => {
        const Icon = getFileIcon(file.name, file.type)
        const section = file.type === "tree" ? "tree" : "blob"
        const href = `/${username}/${repoName}/${section}/${encodedBranch}/${file.path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`
        const commit = commitsByPath[file.path]

        return (
          <Link
            key={file.oid + file.name}
            href={href}
            className="group flex items-center gap-3 px-5 py-2.5 transition-colors duration-100 hover:bg-muted/50 motion-reduce:transition-none"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="w-[180px] min-w-0 shrink-0 truncate text-sm sm:w-[200px]">
              {file.name}
            </span>

            <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
              {isLoadingCommits ? (
                <Skeleton className="h-4 w-48" />
              ) : commit?.message ? (
                <span className="truncate text-sm text-muted-foreground">
                  {truncateMessage(commit.message)}
                </span>
              ) : null}
            </div>

            <div className="hidden shrink-0 text-right sm:block">
              {isLoadingCommits ? (
                <Skeleton className="ml-auto h-4 w-16" />
              ) : commit?.timestamp ? (
                <span className="text-xs whitespace-nowrap text-muted-foreground">
                  {timeAgo(commit.timestamp)}
                </span>
              ) : null}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
