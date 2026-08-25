"use client"

import { Fragment } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { RepoBreadcrumb } from "@/components/layout/repo-breadcrumb"

const SECTION_LABELS: Record<string, string> = {
  explore: "Explore",
  search: "Search",
  notifications: "Notifications",
  settings: "Settings",
  oauth: "OAuth",
  consent: "Authorize",
}

/**
 * Route-derived breadcrumb for the shell header. Repo routes get the full
 * repo breadcrumb (selectors + id chip); everything else derives a simple
 * trail from the pathname.
 */
export function AppBreadcrumb() {
  const params = useParams<{ username?: string; repo?: string }>()
  const pathname = usePathname()

  // Repo scope → the rich breadcrumb, unchanged.
  if (params.username && params.repo) {
    return <RepoBreadcrumb />
  }

  const segments = pathname.split("/").filter(Boolean)

  // Profile page: /username
  if (params.username && segments.length === 1) {
    return (
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{decodeURIComponent(params.username)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  if (segments.length === 0) {
    return (
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const trail = segments.map((segment, index) => ({
    label:
      SECTION_LABELS[segment] ??
      decodeURIComponent(segment).replace(/^\w/, (c) => c.toUpperCase()),
    href: "/" + segments.slice(0, index + 1).join("/"),
    isLast: index === segments.length - 1,
  }))

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        {trail.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={crumb.href} />}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
