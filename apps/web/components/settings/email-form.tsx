"use client"

import { useState } from "react"
import { useUpdateEmail } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

interface EmailFormProps {
  currentEmail: string
}

export function EmailForm({ currentEmail }: EmailFormProps) {
  const { mutate, isPending } = useUpdateEmail()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    if (email === currentEmail) {
      setError("New email is the same as current email")
      return
    }

    mutate(
      { email },
      {
        onSuccess: () => {
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to update email")
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <Input id="email" name="email" type="email" defaultValue={currentEmail} required />
          <FieldDescription>
            Your email is used for account notifications and git authentication
          </FieldDescription>
        </Field>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
            Email updated successfully!
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner />}
          Update Email
        </Button>
      </FieldGroup>
    </form>
  )
}
