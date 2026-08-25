"use client"

import { useState } from "react"
import { RiCloseLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

export type InlineCommentFormProps = {
  onSubmit: (body: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  placeholder?: string
  submitLabel?: string
  replyTo?: string
}

export function InlineCommentForm({
  onSubmit,
  onCancel,
  isLoading = false,
  placeholder = "Leave a comment...",
  submitLabel = "Add comment",
  replyTo,
}: InlineCommentFormProps) {
  const [body, setBody] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || isLoading) return
    await onSubmit(body)
    setBody("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
    >
      {replyTo && <div className="text-xs text-muted-foreground">Replying to comment</div>}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-none text-sm"
        disabled={isLoading}
      />
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          <RiCloseLine className="size-4" />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!body.trim() || isLoading}>
          {isLoading ? (
            <>
              <Spinner />
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
