"use client"

import { useState } from "react"
import { RiSearchLine } from "@remixicon/react"
import { parseAsString, useQueryState } from "nuqs"
import { useSearch } from "@gitbruv/hooks"
import { SearchResultsList } from "@/components/search/search-results"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { PageContainer } from "@/components/layout/page-container"

const SEARCH_TYPES = [
  { value: "all", label: "All" },
  { value: "repositories", label: "Repositories" },
  { value: "issues", label: "Issues" },
  { value: "pulls", label: "Pull Requests" },
  { value: "users", label: "Users" },
]

export function SearchView() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""))
  const [type, setType] = useQueryState("type", parseAsString.withDefault("all"))

  const [query, setQuery] = useState(q)

  const { data, isLoading, isFetching } = useSearch(q, {
    type: type as Parameters<typeof useSearch>[1] extends { type?: infer T } ? T : never,
    limit: 30,
    enabled: q.length >= 2,
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      void setQ(query.trim())
    }
  }

  return (
    <PageContainer>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search repositories, issues, pull requests, and users..."
              className="pl-10"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!query.trim()}>
            Search
          </Button>
        </div>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {SEARCH_TYPES.map((t) => (
          <Button
            key={t.value}
            variant={type === t.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => void setType(t.value === "all" ? null : t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {q.length < 2 ? (
        <div className="py-16 text-center text-muted-foreground">
          <RiSearchLine className="mx-auto mb-4 size-12 opacity-50" />
          <p>Enter at least 2 characters to search</p>
        </div>
      ) : isLoading || isFetching ? (
        <div className="py-16 text-center">
          <Spinner className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Searching...</p>
        </div>
      ) : data?.results ? (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            {data.results.length} result{data.results.length !== 1 ? "s" : ""} for
            &ldquo;{q}&rdquo;
          </div>
          <SearchResultsList results={data.results} />
        </>
      ) : null}
    </PageContainer>
  )
}
