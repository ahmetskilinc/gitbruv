"use client"

import { useState } from "react"
import {
  RiGithubFill,
  RiLinkedinBoxFill,
  RiLinksLine,
  RiTwitterXFill,
} from "@remixicon/react"
import { useUpdateSocialLinks } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

interface SocialLinksFormProps {
  socialLinks?: {
    github?: string
    twitter?: string
    linkedin?: string
    custom?: string[]
  } | null
}

export function SocialLinksForm({ socialLinks }: SocialLinksFormProps) {
  const { mutate, isPending } = useUpdateSocialLinks()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [customLinks, setCustomLinks] = useState<string[]>([
    socialLinks?.custom?.[0] || "",
    socialLinks?.custom?.[1] || "",
    socialLinks?.custom?.[2] || "",
  ])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)

    mutate(
      {
        github: formData.get("github") as string,
        twitter: formData.get("twitter") as string,
        linkedin: formData.get("linkedin") as string,
        custom: customLinks.filter(Boolean),
      },
      {
        onSuccess: () => {
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to update social links")
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="github" className="flex items-center gap-2">
            <RiGithubFill className="size-4" />
            GitHub
          </FieldLabel>
          <Input
            id="github"
            name="github"
            defaultValue={socialLinks?.github || ""}
            placeholder="https://github.com/username"
            type="url"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="twitter" className="flex items-center gap-2">
            <RiTwitterXFill className="size-4" />
            Twitter / X
          </FieldLabel>
          <Input
            id="twitter"
            name="twitter"
            defaultValue={socialLinks?.twitter || ""}
            placeholder="https://twitter.com/username"
            type="url"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="linkedin" className="flex items-center gap-2">
            <RiLinkedinBoxFill className="size-4" />
            LinkedIn
          </FieldLabel>
          <Input
            id="linkedin"
            name="linkedin"
            defaultValue={socialLinks?.linkedin || ""}
            placeholder="https://linkedin.com/in/username"
            type="url"
          />
        </Field>

        <Field>
          <FieldLabel className="flex items-center gap-2">
            <RiLinksLine className="size-4" />
            Custom Links
          </FieldLabel>
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Input
                key={i}
                value={customLinks[i]}
                onChange={(e) => {
                  const newLinks = [...customLinks]
                  newLinks[i] = e.target.value
                  setCustomLinks(newLinks)
                }}
                placeholder={`Custom link ${i + 1}`}
                type="url"
              />
            ))}
          </div>
          <FieldDescription>Add up to 3 custom links to your profile</FieldDescription>
        </Field>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
            Social links updated!
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner />}
          Save Social Links
        </Button>
      </FieldGroup>
    </form>
  )
}
