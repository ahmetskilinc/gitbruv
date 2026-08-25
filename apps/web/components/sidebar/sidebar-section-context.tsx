"use client"

import { createContext, useContext, useState } from "react"
import { useParams } from "next/navigation"

export type SidebarSection = "main" | "repo"
export type SidebarDirection = "forward" | "back"

type SidebarSectionValue = {
  section: SidebarSection
  direction: SidebarDirection
  /** The repo currently in scope (from the route), or null when not on a repo. */
  repo: { username: string; repo: string } | null
  /** Pop the sidebar back to the main layer WITHOUT navigating. */
  goToMain: () => void
  /** Drill into the repo layer for the current repo (if any). */
  goToRepo: () => void
}

const SidebarSectionContext = createContext<SidebarSectionValue | null>(null)

export function SidebarSectionProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ username?: string; repo?: string }>()
  const repo =
    params.username && params.repo
      ? {
          username: decodeURIComponent(params.username),
          repo: decodeURIComponent(params.repo),
        }
      : null
  const repoKey = repo ? `${repo.username}/${repo.repo}` : null

  const [section, setSection] = useState<SidebarSection>(repoKey ? "repo" : "main")
  const [direction, setDirection] = useState<SidebarDirection>("forward")
  const [prevRepoKey, setPrevRepoKey] = useState<string | null>(repoKey)

  // Auto-switch layers only when the repo *identity* changes — so a manual
  // "back to main" (goToMain) sticks while you stay on the same repo page.
  // Render-time adjustment instead of an effect to avoid a double render pass.
  if (repoKey !== prevRepoKey) {
    setPrevRepoKey(repoKey)
    if (repoKey) {
      setDirection("forward")
      setSection("repo")
    } else {
      setDirection("back")
      setSection("main")
    }
  }

  const goToMain = () => {
    setDirection("back")
    setSection("main")
  }
  const goToRepo = () => {
    if (!repoKey) return
    setDirection("forward")
    setSection("repo")
  }

  return (
    <SidebarSectionContext.Provider value={{ section, direction, repo, goToMain, goToRepo }}>
      {children}
    </SidebarSectionContext.Provider>
  )
}

export function useSidebarSection() {
  const ctx = useContext(SidebarSectionContext)
  if (!ctx) throw new Error("useSidebarSection must be used within SidebarSectionProvider")
  return ctx
}
