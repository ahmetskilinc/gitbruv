"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { SearchBar } from "@/components/search/search-bar"
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb"
import { HeaderActionsSlot } from "@/components/layout/header-actions"

/**
 * The app header: lives on the ground plane next to the sidebar (NOT inside
 * the content card). Breadcrumb on the left, page-injected actions + search
 * on the right.
 */
export function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 pr-2 pl-1 text-sidebar-foreground md:pl-0">
      <SidebarTrigger className="md:hidden" />
      <div className="min-w-0 flex-1 text-sm">
        <AppBreadcrumb />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <HeaderActionsSlot />
        <SearchBar />
      </div>
    </header>
  )
}
