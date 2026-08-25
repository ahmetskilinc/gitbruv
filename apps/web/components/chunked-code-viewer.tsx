"use client"

import { useState, useEffect, useCallback } from "react"
import { CodeViewer } from "@/components/code-viewer"
import { Spinner } from "@/components/ui/spinner"
import { getApiUrl } from "@/lib/env"

const LARGE_FILE_THRESHOLD = 100 * 1024

interface ChunkedCodeViewerProps {
  username: string
  repoName: string
  branch: string
  filePath: string
  language: string
  initialContent?: string
  wordWrap?: boolean
}

/**
 * Streaming viewer for large blobs: reads X-Total-Size, then renders the file
 * incrementally from the response stream with a progress bar.
 */
export function ChunkedCodeViewer({
  username,
  repoName,
  branch,
  filePath,
  language,
  initialContent,
  wordWrap,
}: ChunkedCodeViewerProps) {
  const [content, setContent] = useState(initialContent || "")
  const [loading, setLoading] = useState(!initialContent)
  const [progress, setProgress] = useState(initialContent ? 100 : 0)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async () => {
    if (initialContent) return

    setLoading(true)
    setError(null)

    try {
      const apiUrl = getApiUrl()
      if (!apiUrl) {
        throw new Error("API URL not configured")
      }

      const pathSegments = filePath
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")
      const response = await fetch(
        `${apiUrl}/file/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/${encodeURIComponent(branch)}/${pathSegments}`,
      )

      if (!response.ok) {
        throw new Error("Failed to load file")
      }

      const size = parseInt(response.headers.get("X-Total-Size") || "0", 10)

      if (size < LARGE_FILE_THRESHOLD || !response.body) {
        const text = await response.text()
        setContent(text)
        setProgress(100)
        setLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ""
      let loaded = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        result += decoder.decode(value, { stream: true })
        loaded += value.length
        setProgress(Math.min(Math.round((loaded / size) * 100), 100))
        setContent(result)
      }

      result += decoder.decode()
      setContent(result)
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file")
    } finally {
      setLoading(false)
    }
  }, [username, repoName, branch, filePath, initialContent])

  useEffect(() => {
    // Deferred so the fetch kickoff's state updates never run synchronously
    // inside the effect body.
    const id = setTimeout(loadFile, 0)
    return () => clearTimeout(id)
  }, [loadFile])

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {loading && progress < 100 && (
        <div className="absolute top-0 right-0 left-0 z-10">
          <div className="h-1 overflow-hidden bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-300 ease-out-expo motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-2 rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground">
            <Spinner className="size-3" />
            <span>{progress}%</span>
          </div>
        </div>
      )}
      {content ? (
        <CodeViewer
          content={content}
          language={language}
          showLineNumbers
          wordWrap={wordWrap}
        />
      ) : (
        <div className="flex items-center justify-center p-8">
          <Spinner className="size-8 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
