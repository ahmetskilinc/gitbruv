"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

interface IssueFormProps {
  initialTitle?: string
  initialBody?: string
  onSubmit: (data: { title: string; body: string }) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  isSubmitting?: boolean
}

export function IssueForm({
  initialTitle = "",
  initialBody = "",
  onSubmit,
  onCancel,
  submitLabel = "Submit new issue",
  isSubmitting = false,
}: IssueFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await onSubmit({ title: title.trim(), body: body.trim() })
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="issue-title">Title</FieldLabel>
          <Input
            id="issue-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="issue-body">Description</FieldLabel>
          <Textarea
            id="issue-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the issue... (Markdown supported)"
            rows={10}
            className="resize-none font-mono text-sm"
          />
        </Field>

        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting && <Spinner />}
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
