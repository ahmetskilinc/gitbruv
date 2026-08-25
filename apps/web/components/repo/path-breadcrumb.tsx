"use client"

import Link from "next/link"
import { RiArrowRightSLine, RiHome5Line } from "@remixicon/react"

/**
 * In-card path navigation for tree/blob browsing: repo root, then each path
 * segment; intermediate segments link back to their tree view.
 */
export function PathBreadcrumb({
  username,
  repoName,
  branch,
  pathParts,
}: {
  username: string
  repoName: string
  branch: string
  pathParts: string[]
}) {
  const encodedBranch = encodeURIComponent(branch)

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b bg-muted/30 px-4 py-2 text-sm whitespace-nowrap">
      <Link
        href={`/${username}/${repoName}`}
        className="flex items-center gap-1 text-primary transition-colors duration-100 hover:underline motion-reduce:transition-none"
      >
        <RiHome5Line className="size-4" />
        {repoName}
      </Link>
      {pathParts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          <RiArrowRightSLine className="size-4 text-muted-foreground" />
          {i === pathParts.length - 1 ? (
            <span className="font-medium">{part}</span>
          ) : (
            <Link
              href={`/${username}/${repoName}/tree/${encodedBranch}/${pathParts
                .slice(0, i + 1)
                .map(encodeURIComponent)
                .join("/")}`}
              className="text-primary transition-colors duration-100 hover:underline motion-reduce:transition-none"
            >
              {part}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
