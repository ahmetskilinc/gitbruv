"use client"

import { useState } from "react"
import { useUpdatePassword } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

export function PasswordForm() {
  const { mutate, isPending } = useUpdatePassword()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setSuccess(true)
          ;(e.target as HTMLFormElement).reset()
          setTimeout(() => setSuccess(false), 3000)
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to update password")
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
          <Input id="currentPassword" name="currentPassword" type="password" required />
        </Field>

        <Field>
          <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
          <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
          <FieldDescription>Must be at least 8 characters</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
        </Field>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
            Password updated successfully!
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner />}
          Update Password
        </Button>
      </FieldGroup>
    </form>
  )
}
