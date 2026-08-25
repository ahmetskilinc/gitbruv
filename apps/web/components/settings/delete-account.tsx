"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RiAlertLine } from "@remixicon/react"
import { useDeleteAccount } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldLabel } from "@/components/ui/field"

interface DeleteAccountProps {
  username: string
}

export function DeleteAccount({ username }: DeleteAccountProps) {
  const { mutate, isPending } = useDeleteAccount()
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (confirmation !== username) {
      setError("Please type your username to confirm")
      return
    }

    setError(null)

    mutate(undefined, {
      onSuccess: () => {
        router.push("/")
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to delete account")
      },
    })
  }

  if (!showConfirm) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Once you delete your account, there is no going back. All your repositories and data
          will be permanently deleted.
        </p>
        <Button variant="destructive" onClick={() => setShowConfirm(true)}>
          Delete Account
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
        <RiAlertLine className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-destructive">This action cannot be undone</p>
          <p className="text-sm text-muted-foreground">
            This will permanently delete your account, all repositories, and remove all your data
            from our servers.
          </p>
        </div>
      </div>

      <Field>
        <FieldLabel htmlFor="confirm">
          Type <span className="font-mono font-semibold">{username}</span> to confirm
        </FieldLabel>
        <Input
          id="confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="Enter your username"
        />
      </Field>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowConfirm(false)
            setConfirmation("")
            setError(null)
          }}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending || confirmation !== username}
        >
          {isPending && <Spinner />}
          Delete My Account
        </Button>
      </div>
    </div>
  )
}
