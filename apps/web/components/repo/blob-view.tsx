"use client"

import { notFound, useParams } from "next/navigation"
import { useTheme } from "next-themes"
import { RiCodeLine } from "@remixicon/react"
import { File } from "@pierre/diffs/react"
import {
  useRepoFile,
  useRepositoryWithStars,
  useWordWrapPreference,
} from "@gitbruv/hooks"
import { getLanguage } from "@gitbruv/lib"
import { useSession } from "@/lib/auth-client"
import { ChunkedCodeViewer } from "@/components/chunked-code-viewer"
import { PathBreadcrumb } from "@/components/repo/path-breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"

const LARGE_FILE_THRESHOLD = 100 * 1024

function CodeSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6 md:p-8">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

function PageSkeleton() {
  return (
    <PageContainer size="wide" className="pt-0">
      <div className="overflow-hidden rounded-xl border">
        <div className="h-10 border-b bg-muted/30" />
        <CodeSkeleton />
      </div>
    </PageContainer>
  )
}

export function BlobView() {
  const params = useParams<{ username: string; repo: string; path: string[] }>()
  const username = decodeURIComponent(params.username)
  const repoName = decodeURIComponent(params.repo)
  const pathSegments = (params.path ?? []).map((segment) =>
    decodeURIComponent(segment),
  )

  const branch = pathSegments[0] || "main"
  const filePath = pathSegments.slice(1).join("/")

  const { data: session } = useSession()
  const { data: wordWrapData } = useWordWrapPreference({
    enabled: !!session?.user,
  })

  const {
    data: repo,
    isLoading: repoLoading,
    error: repoError,
  } = useRepositoryWithStars(username, repoName)
  const {
    data: fileData,
    isLoading: fileLoading,
    error: fileError,
  } = useRepoFile(username, repoName, branch, filePath)

  const { resolvedTheme } = useTheme()

  if (repoLoading) {
    return <PageSkeleton />
  }

  if (repoError || !repo) {
    notFound()
  }

  const pathParts = filePath.split("/").filter(Boolean)
  const fileName = pathParts[pathParts.length - 1]
  const wordWrap = wordWrapData?.wordWrap ?? false

  return (
    <PageContainer size="wide" className="pt-0">
      <div className="overflow-hidden rounded-xl border">
        <PathBreadcrumb
          username={username}
          repoName={repoName}
          branch={branch}
          pathParts={pathParts}
        />

        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RiCodeLine className="size-4" />
            <span>{fileName}</span>
          </div>
        </div>

        {fileLoading ? (
          <CodeSkeleton />
        ) : fileError || !fileData ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Failed to load file
          </div>
        ) : (
          (() => {
            const fileSize = new TextEncoder().encode(fileData.content).length
            if (fileSize > LARGE_FILE_THRESHOLD) {
              return (
                <ChunkedCodeViewer
                  username={username}
                  repoName={repoName}
                  branch={branch}
                  filePath={filePath}
                  language={getLanguage(fileName)}
                  initialContent={fileData.content}
                  wordWrap={wordWrap}
                />
              )
            }
            return (
              <File
                file={{
                  name: fileName,
                  contents: fileData.content,
                }}
                options={{
                  disableFileHeader: true,
                  overflow: wordWrap ? "wrap" : "scroll",
                  themeType: resolvedTheme === "light" ? "light" : "dark",
                }}
              />
            )
          })()
        )}
      </div>
    </PageContainer>
  )
}
