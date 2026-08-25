"use client"

import { useState } from "react"
import { useUpdateProfile } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

interface ProfileFormProps {
  user: {
    name: string
    username: string
    bio?: string | null
    location?: string | null
    website?: string | null
    pronouns?: string | null
    company?: string | null
    gitEmail?: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { mutate, isPending } = useUpdateProfile()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)

    mutate(
      {
        name: formData.get("name") as string,
        username: formData.get("username") as string,
        bio: formData.get("bio") as string,
        location: formData.get("location") as string,
        website: formData.get("website") as string,
        pronouns: formData.get("pronouns") as string,
        company: formData.get("company") as string,
        gitEmail: formData.get("gitEmail") as string,
      },
      {
        onSuccess: () => {
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to update profile")
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Display Name</FieldLabel>
          <Input id="name" name="name" defaultValue={user.name} placeholder="Your display name" required />
          <FieldDescription>Your name as it appears on your profile</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            name="username"
            defaultValue={user.username}
            placeholder="username"
            required
            pattern="[a-zA-Z0-9_-]+"
            minLength={3}
          />
          <FieldDescription>
            Your unique handle. Letters, numbers, underscores, and hyphens only.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={user.bio || ""}
            placeholder="Tell us about yourself"
            maxLength={160}
            rows={3}
          />
          <FieldDescription>Brief description for your profile. Max 160 characters.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="pronouns">Pronouns</FieldLabel>
          <Input
            id="pronouns"
            name="pronouns"
            defaultValue={user.pronouns || ""}
            placeholder="e.g., they/them, she/her, he/him"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <Input
            id="location"
            name="location"
            defaultValue={user.location || ""}
            placeholder="City, Country"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="website">Website</FieldLabel>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={user.website || ""}
            placeholder="https://yourwebsite.com"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="company">Company</FieldLabel>
          <Input
            id="company"
            name="company"
            defaultValue={user.company || ""}
            placeholder="Your company or organization"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="gitEmail">Git Email</FieldLabel>
          <Input
            id="gitEmail"
            name="gitEmail"
            type="email"
            defaultValue={user.gitEmail || ""}
            placeholder="Email for git commits"
          />
          <FieldDescription>
            Email address used for git commits. Defaults to your account email if not set.
          </FieldDescription>
        </Field>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
            Profile updated successfully!
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
