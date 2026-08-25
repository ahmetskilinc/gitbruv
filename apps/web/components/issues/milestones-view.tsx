"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { RiAddLine, RiDeleteBinLine, RiFlagLine } from "@remixicon/react"
import { toast } from "sonner"
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useRepositoryInfo,
} from "@gitbruv/hooks"
import type { Milestone } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

export function MilestonesView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)
  const [state, setState] = useState<"open" | "closed">("open")

  const { data: repoInfo } = useRepositoryInfo(username, repo)
  const { data, isLoading } = useMilestones(username, repo, state)
  const createMilestone = useCreateMilestone(username, repo)
  const updateMilestone = useUpdateMilestone(username, repo)
  const deleteMilestone = useDeleteMilestone(username, repo)

  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", dueOn: "" })

  const milestones = data?.milestones ?? []
  const isOwner = repoInfo?.isOwner ?? false

  const handleCreate = async () => {
    if (!form.title.trim()) return
    try {
      await createMilestone.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueOn: form.dueOn || undefined,
      })
      setForm({ title: "", description: "", dueOn: "" })
      setIsCreating(false)
      toast.success("Milestone created")
    } catch {
      toast.error("Failed to create milestone")
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Milestones"
        actions={
          isOwner &&
          !isCreating && (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <RiAddLine data-icon="inline-start" className="size-4" />
              New milestone
            </Button>
          )
        }
      />

      <Tabs
        value={state}
        onValueChange={(v) => setState(v as "open" | "closed")}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="open" className="px-2.5">
            Open
          </TabsTrigger>
          <TabsTrigger value="closed" className="px-2.5">
            Closed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isCreating && (
        <Card className="mb-6 gap-3 px-4">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <label htmlFor="milestone-due-date" className="text-sm text-muted-foreground">
              Due date
            </label>
            <Input
              id="milestone-due-date"
              type="date"
              value={form.dueOn}
              onChange={(e) => setForm({ ...form, dueOn: e.target.value })}
              className="w-auto"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMilestone.isPending || !form.title.trim()}>
              {createMilestone.isPending && <Spinner />}
              Create
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-5" />
        </div>
      ) : milestones.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiFlagLine />
            </EmptyMedia>
            <EmptyTitle>No {state} milestones</EmptyTitle>
            <EmptyDescription>
              Milestones group issues and pull requests to track progress toward a goal.
            </EmptyDescription>
          </EmptyHeader>
          {isOwner && !isCreating && state === "open" && (
            <EmptyContent>
              <Button onClick={() => setIsCreating(true)}>
                <RiAddLine data-icon="inline-start" className="size-4" />
                New milestone
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {milestones.map((m: Milestone) => {
            const total = m.openIssues + m.closedIssues
            const pct = total > 0 ? Math.round((m.closedIssues / total) * 100) : 0
            return (
              <div
                key={m.id}
                className="group/row flex items-start justify-between gap-4 p-4 transition-colors duration-100 hover:bg-muted/30 motion-reduce:transition-none"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{m.title}</h3>
                  {m.dueOn && (
                    <p className="text-xs text-muted-foreground">
                      Due {new Date(m.dueOn).toLocaleDateString()}
                    </p>
                  )}
                  {m.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                  )}
                  <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pct}% complete · {m.openIssues} open · {m.closedIssues} closed
                  </p>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-2 opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-focus-within/row:opacity-100 motion-reduce:transition-none">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateMilestone.mutate({
                          id: m.id,
                          data: { state: m.state === "open" ? "closed" : "open" },
                        })
                      }
                    >
                      {m.state === "open" ? "Close" : "Reopen"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete milestone"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMilestone.mutate(m.id)}
                    >
                      <RiDeleteBinLine className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
