"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { RiAddLine, RiDeleteBinLine, RiPriceTag3Line } from "@remixicon/react"
import {
  useReleases,
  useCreateRelease,
  useDeleteRelease,
  useRepositoryInfo,
  useRepoBranches,
} from "@gitbruv/hooks"
import { formatRelativeTime } from "@gitbruv/lib"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

export function ReleasesView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)

  const { data: repoInfo } = useRepositoryInfo(username, repo)
  const { data, isLoading } = useReleases(username, repo)
  const { data: branchesData } = useRepoBranches(username, repo)
  const createRelease = useCreateRelease(username, repo)
  const deleteRelease = useDeleteRelease(username, repo)

  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({
    tagName: "",
    targetCommitish: "",
    name: "",
    body: "",
    isPrerelease: false,
  })

  const releases = data?.releases ?? []
  const isOwner = repoInfo?.isOwner ?? false
  const branches: string[] = branchesData?.branches ?? []
  const defaultBranch = repoInfo?.repo?.defaultBranch ?? branches[0] ?? "main"

  const handleCreate = async () => {
    if (!form.tagName.trim()) return
    await createRelease.mutateAsync({
      tagName: form.tagName.trim(),
      targetCommitish: form.targetCommitish || defaultBranch,
      name: form.name.trim() || undefined,
      body: form.body.trim() || undefined,
      isPrerelease: form.isPrerelease,
    })
    setForm({ tagName: "", targetCommitish: "", name: "", body: "", isPrerelease: false })
    setIsCreating(false)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Releases"
        actions={
          isOwner &&
          !isCreating &&
          releases.length > 0 && (
            <Button onClick={() => setIsCreating(true)}>
              <RiAddLine className="size-4" />
              Draft a new release
            </Button>
          )
        }
      />

      {isCreating && (
        <Card className="mb-6 gap-3">
          <div className="flex gap-2 px-4">
            <Input
              placeholder="Tag (e.g. v1.0.0)"
              value={form.tagName}
              onChange={(e) => setForm({ ...form, tagName: e.target.value })}
            />
            <Select
              value={form.targetCommitish || defaultBranch}
              onValueChange={(value) =>
                setForm({ ...form, targetCommitish: (value as string) ?? "" })
              }
            >
              <SelectTrigger aria-label="Target branch">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3 px-4">
            <Input
              placeholder="Release title"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Textarea
              placeholder="Describe this release"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={5}
            />
            <Label className="flex items-center gap-2 text-sm font-normal">
              <Checkbox
                checked={form.isPrerelease}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isPrerelease: checked === true })
                }
              />
              This is a pre-release
            </Label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createRelease.isPending || !form.tagName.trim()}
              >
                {createRelease.isPending && <Spinner />}
                Publish release
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-5" />
        </div>
      ) : releases.length === 0 ? (
        <Empty className="border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiPriceTag3Line />
            </EmptyMedia>
            <EmptyTitle>No releases published yet</EmptyTitle>
            <EmptyDescription>
              Releases package software, release notes and links to binary files for other people
              to use.
            </EmptyDescription>
          </EmptyHeader>
          {isOwner && !isCreating && (
            <EmptyContent>
              <Button onClick={() => setIsCreating(true)}>
                <RiAddLine className="size-4" />
                Draft a new release
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {releases.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4 px-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{r.name || r.tagName}</h3>
                    {r.isPrerelease && <Badge variant="outline">Pre-release</Badge>}
                    {r.isDraft && <Badge variant="outline">Draft</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{r.tagName}</span>
                    {" · "}
                    {r.author?.username ?? "unknown"} released {formatRelativeTime(r.createdAt)}
                  </p>
                </div>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete release"
                    onClick={() => deleteRelease.mutate(r.id)}
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                )}
              </div>
              {r.body && (
                <div className="prose prose-neutral dark:prose-invert max-w-none px-4 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.body}</ReactMarkdown>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
