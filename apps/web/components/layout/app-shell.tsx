"use client"

import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { SidebarSectionProvider } from "@/components/sidebar/sidebar-section-context"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { HeaderActionsProvider } from "@/components/layout/header-actions"
import { SearchBar } from "@/components/search/search-bar"
import { BrandMark } from "@/components/brand-mark"
import { LiveUpdates } from "@/components/live-updates"

/**
 * Logged in: ground plane with sidebar + header, content floating as the
 * inset card. Logged out: no sidebar, no inset — a plain page with a simple
 * top nav.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
            <BrandMark />
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/explore"
                className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors duration-100 hover:bg-muted hover:text-foreground motion-reduce:transition-none"
              >
                Explore
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <SearchBar />
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                Sign up
              </Button>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 pt-14">{children}</main>
      </div>
    )
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <SidebarSectionProvider>
        <HeaderActionsProvider>
          <AppSidebar />
          <div className="flex h-svh min-w-0 flex-1 flex-col">
            <AppHeader />
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:mr-2 md:mb-2 md:rounded-lg md:shadow-sm md:ring-1 md:ring-border/60">
              {/* Scroll lives on this node; padding on the inner block child so
                  Chromium/WebKit don't drop the end padding at scroll-end. */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="min-h-full">{children}</div>
              </div>
            </main>
          </div>
          <LiveUpdates />
        </HeaderActionsProvider>
      </SidebarSectionProvider>
    </SidebarProvider>
  )
}
