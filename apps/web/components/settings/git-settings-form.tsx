"use client"

import { useState } from "react"
import { useUpdateProfile } from "@gitbruv/hooks"
import type { UserProfile } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function GitSettingsForm({ user }: { user: UserProfile }) {
  const { mutate, isPending } = useUpdateProfile()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [gitEmail, setGitEmail] = useState(user.gitEmail || "")
  const [defaultVisibility, setDefaultVisibility] = useState<"public" | "private">(
    user.defaultRepositoryVisibility || "public",
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    mutate(
      {
        gitEmail: gitEmail || undefined,
        defaultRepositoryVisibility: defaultVisibility,
      },
      {
        onSuccess: () => {
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to update git settings")
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="gitEmail">Git Email</FieldLabel>
          <Input
            id="gitEmail"
            type="email"
            value={gitEmail}
            onChange={(e) => setGitEmail(e.target.value)}
            placeholder="Email for git commits"
          />
          <FieldDescription>
            Email address used for git commits. Defaults to your account email if not set.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="defaultVisibility">Default Repository Visibility</FieldLabel>
          <Select
            items={{ public: "Public", private: "Private" }}
            value={defaultVisibility}
            onValueChange={(v) => setDefaultVisibility(v as "public" | "private")}
          >
            <SelectTrigger id="defaultVisibility" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>Default visibility for new repositories</FieldDescription>
        </Field>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
            Settings updated successfully!
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner />}
          Save Changes
        </Button>
      </FieldGroup>
    </form>
  )
}
