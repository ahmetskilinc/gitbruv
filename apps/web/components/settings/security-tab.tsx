"use client"

import { useState } from "react"
import { RiAddLine, RiDeleteBinLine, RiFingerprintLine } from "@remixicon/react"
import { toast } from "sonner"
import { useCurrentUser } from "@gitbruv/hooks"
import { useAddPasskey, useDeletePasskey, usePasskeys } from "@/lib/hooks/use-passkeys"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Passkey = {
  id: string
  name: string | null
  deviceType: string
  createdAt: string
  backedUp: boolean
}

export function SecurityTab() {
  const { data, isLoading: userLoading } = useCurrentUser()
  const user = data?.user
  const { data: passkeys, isLoading: passkeysLoading, refetch: refetchPasskeys } = usePasskeys()
  const { mutate: addPasskey, isPending: isAdding } = useAddPasskey()
  const { mutate: deletePasskey, isPending: isDeleting } = useDeletePasskey()

  const [newPasskeyName, setNewPasskeyName] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deletePasskeyId, setDeletePasskeyId] = useState<string | null>(null)

  if (userLoading || passkeysLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  function handleAddPasskey() {
    addPasskey(
      { name: newPasskeyName || undefined },
      {
        onSuccess: () => {
          setIsCreateOpen(false)
          setNewPasskeyName("")
          refetchPasskeys()
          toast.success("Passkey added successfully")
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Failed to add passkey"
          toast.error(message)
        },
      },
    )
  }

  function handleDelete(passkeyId: string) {
    deletePasskey(
      { passkeyId },
      {
        onSuccess: () => {
          setDeletePasskeyId(null)
          refetchPasskeys()
          toast.success("Passkey deleted successfully")
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Failed to delete passkey"
          toast.error(message)
        },
      },
    )
  }

  function handleCloseCreate() {
    setIsCreateOpen(false)
    setNewPasskeyName("")
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
          <CardDescription>
            Use passkeys for secure, passwordless authentication. Sign in with biometrics, PINs,
            or security keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium">What are passkeys?</p>
            <p className="text-sm text-muted-foreground">
              Passkeys are a secure alternative to passwords. They use cryptographic keys stored
              on your device, allowing you to sign in with biometrics, PINs, or security keys
              without entering a password.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Your Passkeys</h3>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <RiAddLine className="size-4" />
              Add Passkey
            </Button>
            <Dialog
              open={isCreateOpen}
              onOpenChange={(open) => (open ? setIsCreateOpen(true) : handleCloseCreate())}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Passkey</DialogTitle>
                  <DialogDescription>
                    Register a new passkey for your account. You&apos;ll be prompted to
                    authenticate with your device.
                  </DialogDescription>
                </DialogHeader>
                <Field>
                  <FieldLabel htmlFor="passkey-name">Passkey Name (Optional)</FieldLabel>
                  <Input
                    id="passkey-name"
                    value={newPasskeyName}
                    onChange={(e) => setNewPasskeyName(e.target.value)}
                    placeholder="e.g., My Laptop, iPhone"
                  />
                  <FieldDescription>
                    Give your passkey a name to remember what device it&apos;s for.
                  </FieldDescription>
                </Field>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseCreate} disabled={isAdding}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPasskey} disabled={isAdding}>
                    {isAdding && <Spinner />}
                    Register Passkey
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {passkeys && passkeys.length > 0 ? (
            <div className="divide-y overflow-hidden rounded-xl border">
              {passkeys.map((passkey: Passkey) => (
                <div key={passkey.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <RiFingerprintLine className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{passkey.name || "Unnamed Passkey"}</p>
                      <p className="text-xs text-muted-foreground">
                        {passkey.deviceType} · Created{" "}
                        {new Date(passkey.createdAt).toLocaleDateString()}
                        {passkey.backedUp && " · Backed up"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete passkey"
                    onClick={() => setDeletePasskeyId(passkey.id)}
                  >
                    <RiDeleteBinLine className="size-4 text-muted-foreground" />
                  </Button>
                  <Dialog
                    open={deletePasskeyId === passkey.id}
                    onOpenChange={(open) => setDeletePasskeyId(open ? passkey.id : null)}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Passkey</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this passkey? You&apos;ll no longer be
                          able to sign in with it.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDeletePasskeyId(null)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(passkey.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting && <Spinner />}
                          Delete Passkey
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          ) : (
            <Empty className="border-none py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiFingerprintLine />
                </EmptyMedia>
                <EmptyTitle>No passkeys yet</EmptyTitle>
                <EmptyDescription>Add one to get started.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
