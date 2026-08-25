"use client"

import { useMemo } from "react"
import { useContributions } from "@gitbruv/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const DAY_MS = 24 * 60 * 60 * 1000
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

type Cell = {
  date: string
  count: number
  future: boolean
}

function toUTCDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function buildGrid(counts: Map<string, number>): { weeks: Cell[][]; maxCount: number } {
  const today = new Date()
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const start = new Date(end.getTime() - 364 * DAY_MS)
  // Shift back to the previous Sunday so columns are whole weeks.
  start.setTime(start.getTime() - start.getUTCDay() * DAY_MS)

  const weeks: Cell[][] = []
  let maxCount = 0
  for (let cursor = new Date(start); cursor <= end || cursor.getUTCDay() !== 0; ) {
    const week: Cell[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = toUTCDateString(cursor)
      const future = cursor > end
      const count = future ? 0 : (counts.get(dateStr) ?? 0)
      if (count > maxCount) maxCount = count
      week.push({ date: dateStr, count, future })
      cursor = new Date(cursor.getTime() + DAY_MS)
    }
    weeks.push(week)
    if (cursor > end) break
  }
  return { weeks, maxCount }
}

function bucketClass(count: number, maxCount: number): string {
  if (count === 0) return "bg-muted"
  const q = count / Math.max(maxCount, 1)
  if (q <= 0.25) return "bg-primary/30"
  if (q <= 0.5) return "bg-primary/55"
  if (q <= 0.75) return "bg-primary/80"
  return "bg-primary"
}

function formatDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function ContributionGraph({ username }: { username: string }) {
  const { data, isLoading } = useContributions(username)

  const { weeks, maxCount, monthLabels } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const day of data?.contributions ?? []) {
      counts.set(day.date, day.count)
    }
    const grid = buildGrid(counts)

    // A month label sits over the first column whose Sunday falls in the
    // month's first 7 days; suppress labels closer than 2 columns apart.
    const labels: { col: number; label: string }[] = []
    grid.weeks.forEach((week, col) => {
      const sunday = new Date(`${week[0].date}T00:00:00Z`)
      if (sunday.getUTCDate() <= 7) {
        const label = MONTHS[sunday.getUTCMonth()]
        const prev = labels[labels.length - 1]
        if (!prev || col - prev.col >= 2) {
          labels.push({ col, label })
        }
      }
    })
    return { ...grid, monthLabels: labels }
  }, [data?.contributions])

  if (isLoading) {
    return <Skeleton className="h-[140px] w-full rounded-xl" />
  }

  const total = data?.total ?? 0

  return (
    <div className="rounded-xl border p-4">
      <div className="overflow-x-auto">
        <div className="w-fit">
          {/* Month labels */}
          <div className="relative ml-8 h-4 text-xs text-muted-foreground">
            {monthLabels.map(({ col, label }) => (
              <span
                key={`${col}-${label}`}
                className="absolute"
                style={{ left: `${col * 13}px` }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            {/* Day-of-week gutter */}
            <div className="grid w-6 shrink-0 grid-rows-7 gap-[3px] text-[10px] text-muted-foreground">
              <span />
              <span className="leading-[10px]">Mon</span>
              <span />
              <span className="leading-[10px]">Wed</span>
              <span />
              <span className="leading-[10px]">Fri</span>
              <span />
            </div>
            {/* The grid: columns are weeks, rows are days (Sun→Sat). */}
            <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
              {weeks.flatMap((week, w) =>
                week.map((cell, d) =>
                  cell.future ? (
                    <span key={`${w}-${d}`} className="size-[10px]" />
                  ) : (
                    <Tooltip key={`${w}-${d}`}>
                      <TooltipTrigger
                        render={
                          <span
                            className={cn(
                              "size-[10px] rounded-[2px]",
                              bucketClass(cell.count, maxCount),
                            )}
                          />
                        }
                      />
                      <TooltipContent side="top">
                        {cell.count === 0
                          ? `No contributions on ${formatDay(cell.date)}`
                          : `${cell.count} contribution${cell.count === 1 ? "" : "s"} on ${formatDay(cell.date)}`}
                      </TooltipContent>
                    </Tooltip>
                  ),
                ),
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground tabular-nums">{total}</span>{" "}
          contribution{total === 1 ? "" : "s"} in the last year
        </span>
        <span className="flex items-center gap-1">
          Less
          <span className="size-[10px] rounded-[2px] bg-muted" />
          <span className="size-[10px] rounded-[2px] bg-primary/30" />
          <span className="size-[10px] rounded-[2px] bg-primary/55" />
          <span className="size-[10px] rounded-[2px] bg-primary/80" />
          <span className="size-[10px] rounded-[2px] bg-primary" />
          More
        </span>
      </div>
    </div>
  )
}
