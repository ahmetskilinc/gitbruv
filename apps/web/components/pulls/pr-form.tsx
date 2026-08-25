"use client"

import { useState } from "react"
import { RiGitBranchLine, RiGitMergeLine } from "@remixicon/react"

import type { ForkedFrom } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type PRFormProps = {
  branches: string[]
  upstreamBranches?: string[]
  defaultBranch: string
  forkedFrom?: ForkedFrom | null
  currentRepoOwner?: string
  currentRepoName?: string
  onSubmit: (data: {
    title: string
    body: string
    headBranch: string
    baseBranch: string
    toUpstream?: boolean
    isDraft?: boolean
  }) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isSubmitting: boolean
  initialTitle?: string
  initialBody?: string
}

export function PRForm({
  branches,
  upstreamBranches = [],
  defaultBranch,
  forkedFrom,
  currentRepoOwner,
  currentRepoName,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
  initialTitle = "",
  initialBody = "",
}: PRFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [headBranch, setHeadBranch] = useState(branches[0] || "")
  const [toUpstream, setToUpstream] = useState(!!forkedFrom)
  const [isDraft, setIsDraft] = useState(false)
  const [baseBranch, setBaseBranch] = useState(
    toUpstream && upstreamBranches.length > 0 ? upstreamBranches[0] : defaultBranch,
  )

  const availableBaseBranches =
    toUpstream && upstreamBranches.length > 0 ? upstreamBranches : branches

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !headBranch || !baseBranch) return

    await onSubmit({
      title,
      body,
      headBranch,
      baseBranch,
      toUpstream: toUpstream && !!forkedFrom,
      isDraft,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {forkedFrom && (
          <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={toUpstream}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true
                  setToUpstream(isChecked)
                  if (isChecked && upstreamBranches.length > 0) {
                    setBaseBranch(upstreamBranches[0])
                  } else {
                    setBaseBranch(defaultBranch)
                  }
                }}
              />
              <span>
                Contribute to upstream repository{" "}
                <span className="font-semibold">
                  {forkedFrom.owner.username}/{forkedFrom.name}
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-2">
            <RiGitBranchLine className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">base:</span>
            {toUpstream && forkedFrom && (
              <span className="font-mono text-sm text-muted-foreground">
                {forkedFrom.owner.username}/{forkedFrom.name}:
              </span>
            )}
            {!toUpstream && currentRepoOwner && (
              <span className="font-mono text-sm text-muted-foreground">
                {currentRepoOwner}/{currentRepoName}:
              </span>
            )}
            <Select
              value={baseBranch}
              onValueChange={(value) => setBaseBranch(value as string)}
            >
              <SelectTrigger aria-label="Base branch" size="sm" className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableBaseBranches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <RiGitMergeLine className="size-4 text-muted-foreground" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">compare:</span>
            {currentRepoOwner && (
              <span className="font-mono text-sm text-muted-foreground">
                {currentRepoOwner}/{currentRepoName}:
              </span>
            )}
            <Select
              value={headBranch}
              onValueChange={(value) => setHeadBranch(value as string)}
            >
              <SelectTrigger aria-label="Compare branch" size="sm" className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor="pr-title">Title</FieldLabel>
          <Input
            id="pr-title"
            placeholder="Pull request title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="pr-body">Description</FieldLabel>
          <Textarea
            id="pr-body"
            placeholder="Add a description..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
          />
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={isDraft}
              onCheckedChange={(checked) => setIsDraft(checked === true)}
            />
            Create as draft
          </label>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !headBranch || !baseBranch}
            >
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Creating..." : isDraft ? "Create draft" : submitLabel}
            </Button>
          </div>
        </div>
      </FieldGroup>
    </form>
  )
}
