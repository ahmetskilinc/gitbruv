"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCreateDiscussion, useDiscussionCategories } from "@gitbruv/hooks"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

export function NewDiscussionView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repo = decodeURIComponent(params.repo)
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")

  const { data: categoriesData } = useDiscussionCategories(username, repo)
  const createDiscussion = useCreateDiscussion(username, repo)

  const categories = categoriesData?.categories || []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required")
      return
    }

    try {
      const discussion = await createDiscussion.mutateAsync({
        title,
        body,
        categoryId: categoryId || undefined,
      })

      toast.success("Discussion created")
      router.push(`/${username}/${repo}/discussions/${discussion.number}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create discussion")
    }
  }

  return (
    <PageContainer size="narrow">
      <PageHeader title="Start a new discussion" />

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          {categories.length > 0 && (
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={categoryId || null}
                onValueChange={(value) => setCategoryId((value as string) ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="body">Body</FieldLabel>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts, ask a question, or start a conversation..."
              rows={10}
              required
            />
          </Field>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${username}/${repo}/discussions`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createDiscussion.isPending || !title.trim() || !body.trim()}
            >
              {createDiscussion.isPending && <Spinner />}
              {createDiscussion.isPending ? "Creating..." : "Start discussion"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </PageContainer>
  )
}
