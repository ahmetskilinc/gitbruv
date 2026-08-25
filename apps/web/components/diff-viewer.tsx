"use client"

import { useCallback, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { PatchDiff } from "@pierre/diffs/react"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCollapseDiagonalLine,
  RiExpandDiagonalLine,
  RiFileAddLine,
  RiFileEditLine,
  RiFileLine,
  RiFileReduceLine,
  RiFileTransferLine,
  RiSubtractLine,
} from "@remixicon/react"

import type { FileDiff } from "@gitbruv/hooks"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Domain colors for git states — raw palette on purpose; the preset theme
// carries no diff semantics.
export const DIFF_ADD_TEXT = "text-emerald-500"
export const DIFF_REMOVE_TEXT = "text-red-500"
const statusColors: Record<string, string> = {
  added: DIFF_ADD_TEXT,
  modified: "text-amber-500",
  deleted: DIFF_REMOVE_TEXT,
  renamed: "text-primary",
}

function fileDiffToUnifiedDiff(file: FileDiff): string {
  const lines: string[] = []

  const isNewFile = file.status === "added"
  const isDeletedFile = file.status === "deleted"
  const oldPath = file.oldPath || file.path
  const newPath = file.path

  lines.push(isNewFile ? "--- /dev/null" : `--- a/${oldPath}`)
  lines.push(isDeletedFile ? "+++ /dev/null" : `+++ b/${newPath}`)

  for (const hunk of file.hunks) {
    const oldStart = isNewFile ? 0 : hunk.oldStart
    const newStart = isDeletedFile ? 0 : hunk.newStart
    lines.push(`@@ -${oldStart},${hunk.oldLines} +${newStart},${hunk.newLines} @@`)

    for (const line of hunk.lines) {
      const prefix = line.type === "addition" ? "+" : line.type === "deletion" ? "-" : " "
      lines.push(prefix + line.content)
    }
  }

  return lines.join("\n")
}

export type DiffViewMode = "unified" | "split"

export function DiffToolbar({
  stats,
  viewMode,
  onViewModeChange,
  fullWidth,
  onFullWidthChange,
  showSidebar,
  onShowSidebarChange,
}: {
  stats: { additions: number; deletions: number; filesChanged: number }
  viewMode: DiffViewMode
  onViewModeChange: (mode: DiffViewMode) => void
  fullWidth: boolean
  onFullWidthChange: (fullWidth: boolean) => void
  showSidebar?: boolean
  onShowSidebarChange?: (show: boolean) => void
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onShowSidebarChange && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onShowSidebarChange(!showSidebar)}
            title={showSidebar ? "Hide file tree" : "Show file tree"}
          >
            <RiFileLine className={cn("size-4", showSidebar && "text-primary")} />
          </Button>
        )}
        <DiffStats stats={stats} />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border">
          <Button
            variant={viewMode === "unified" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("unified")}
            className="rounded-none border-0"
          >
            Unified
          </Button>
          <Button
            variant={viewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("split")}
            className="rounded-none border-0 border-l"
          >
            Split
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onFullWidthChange(!fullWidth)}
          title={fullWidth ? "Exit full width" : "Full width"}
        >
          {fullWidth ? (
            <RiCollapseDiagonalLine className="size-4" />
          ) : (
            <RiExpandDiagonalLine className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function FileHeader({
  file,
  isExpanded,
  onToggle,
}: {
  file: FileDiff
  isExpanded: boolean
  onToggle: () => void
}) {
  const statusLabels: Record<string, string> = {
    added: "Added",
    modified: "Modified",
    deleted: "Deleted",
    renamed: "Renamed",
  }

  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between bg-muted/50 px-4 py-2 text-left transition-colors duration-100 hover:bg-muted/80 motion-reduce:transition-none"
    >
      <div className="flex min-w-0 items-center gap-3">
        {isExpanded ? (
          <RiArrowDownSLine className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
        )}
        <RiFileLine className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-mono text-sm">{file.path}</span>
        <span className={cn("shrink-0 text-xs font-medium", statusColors[file.status])}>
          {statusLabels[file.status]}
        </span>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        {file.additions > 0 && (
          <span className={cn("flex items-center gap-1 font-mono text-sm", DIFF_ADD_TEXT)}>
            <RiAddLine className="size-3" />
            {file.additions}
          </span>
        )}
        {file.deletions > 0 && (
          <span className={cn("flex items-center gap-1 font-mono text-sm", DIFF_REMOVE_TEXT)}>
            <RiSubtractLine className="size-3" />
            {file.deletions}
          </span>
        )}
      </div>
    </button>
  )
}

function FileDiffView({ file, viewMode }: { file: FileDiff; viewMode: DiffViewMode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { resolvedTheme } = useTheme()

  const patchContent = fileDiffToUnifiedDiff(file)

  return (
    <div className="overflow-hidden rounded-lg border">
      <FileHeader
        file={file}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
      />
      {isExpanded &&
        (file.hunks.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No changes to display (binary file or empty diff)
          </div>
        ) : (
          <PatchDiff
            patch={patchContent}
            options={{
              disableFileHeader: true,
              diffStyle: viewMode === "unified" ? "unified" : "split",
              themeType: resolvedTheme === "light" ? "light" : "dark",
            }}
          />
        ))}
    </div>
  )
}

export function DiffViewer({
  files,
  viewMode,
  fileRefs,
}: {
  files: FileDiff[]
  viewMode: DiffViewMode
  fileRefs?: React.RefObject<Map<string, HTMLDivElement>>
}) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No files changed in this commit
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {files.map((file, idx) => (
        <div
          key={file.path + idx}
          className="scroll-mt-4"
          ref={(el) => {
            if (el && fileRefs) {
              fileRefs.current.set(file.path, el)
            }
          }}
        >
          <FileDiffView file={file} viewMode={viewMode} />
        </div>
      ))}
    </div>
  )
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  added: RiFileAddLine,
  modified: RiFileEditLine,
  deleted: RiFileReduceLine,
  renamed: RiFileTransferLine,
}

export function FilePickerSidebar({
  files,
  selectedFile,
  onFileSelect,
}: {
  files: FileDiff[]
  selectedFile: string | null
  onFileSelect: (path: string) => void
}) {
  const getFileName = (path: string) => path.split("/").pop() || path
  const getDirectory = (path: string) => {
    const parts = path.split("/")
    return parts.length > 1 ? parts.slice(0, -1).join("/") : ""
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/50 px-3 py-2">
        <span className="text-sm font-medium">{files.length} files</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {files.map((file) => {
          const Icon = statusIcons[file.status]
          const directory = getDirectory(file.path)
          const fileName = getFileName(file.path)
          const isSelected = selectedFile === file.path

          return (
            <button
              key={file.path}
              onClick={() => onFileSelect(file.path)}
              className={cn(
                "w-full border-b border-border/50 px-3 py-2 text-left transition-colors duration-100 last:border-b-0 hover:bg-muted/80 motion-reduce:transition-none",
                isSelected && "bg-muted",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon className={cn("size-4 shrink-0", statusColors[file.status])} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{fileName}</div>
                  {directory && (
                    <div className="truncate text-xs text-muted-foreground">
                      {directory}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 font-mono text-xs">
                  {file.additions > 0 && (
                    <span className={DIFF_ADD_TEXT}>+{file.additions}</span>
                  )}
                  {file.deletions > 0 && (
                    <span className={DIFF_REMOVE_TEXT}>-{file.deletions}</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function useFileNavigation() {
  const fileRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // The app body scrolls in an inner container (not window), so navigate via
  // scrollIntoView + scroll-mt-* on the targets instead of window.scrollTo.
  const scrollToFile = useCallback((path: string) => {
    setSelectedFile(path)
    fileRefs.current.get(path)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  return { fileRefs, selectedFile, scrollToFile }
}

export function DiffStats({
  stats,
}: {
  stats: { additions: number; deletions: number; filesChanged: number }
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-muted-foreground">
        {stats.filesChanged} file{stats.filesChanged !== 1 ? "s" : ""} changed
      </span>
      {stats.additions > 0 && (
        <span className={cn("flex items-center gap-1 font-mono", DIFF_ADD_TEXT)}>
          <RiAddLine className="size-3" />
          {stats.additions} addition{stats.additions !== 1 ? "s" : ""}
        </span>
      )}
      {stats.deletions > 0 && (
        <span className={cn("flex items-center gap-1 font-mono", DIFF_REMOVE_TEXT)}>
          <RiSubtractLine className="size-3" />
          {stats.deletions} deletion{stats.deletions !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  )
}
