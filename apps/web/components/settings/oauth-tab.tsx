"use client"

import { useState } from "react"
import {
  RiAddLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCodeSSlashLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiPencilLine,
  RiRefreshLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { useCurrentUser } from "@gitbruv/hooks"
import {
  useCreateOAuthClient,
  useDeleteOAuthClient,
  useDeleteOAuthConsent,
  useOAuthClients,
  useOAuthConsents,
  useRotateClientSecret,
  useUpdateOAuthClient,
} from "@/lib/hooks/use-oauth"
import type { OAuthClient, OAuthConsent } from "@/lib/hooks/use-oauth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
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

function SecretField({
  label,
  value,
  copied,
  onCopy,
}: {
  label?: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && <FieldLabel>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput value={value} readOnly className="font-mono text-sm" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={`Copy ${label || "value"}`}
            onClick={onCopy}
          >
            {copied ? (
              <RiCheckLine className="size-4 text-emerald-500" />
            ) : (
              <RiFileCopyLine className="size-4" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

export function OAuthTab() {
  const { data, isLoading: userLoading } = useCurrentUser()
  const user = data?.user
  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = useOAuthClients()
  const {
    data: consents,
    isLoading: consentsLoading,
    refetch: refetchConsents,
  } = useOAuthConsents()
  const { mutate: createClient, isPending: isCreating } = useCreateOAuthClient()
  const { mutate: updateClient, isPending: isUpdating } = useUpdateOAuthClient()
  const { mutate: deleteClient, isPending: isDeletingClient } = useDeleteOAuthClient()
  const { mutate: rotateSecret, isPending: isRotating } = useRotateClientSecret()
  const { mutate: deleteConsent, isPending: isDeletingConsent } = useDeleteOAuthConsent()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newAppName, setNewAppName] = useState("")
  const [newAppRedirectUris, setNewAppRedirectUris] = useState("")
  const [newAppUri, setNewAppUri] = useState("")
  const [createdApp, setCreatedApp] = useState<{
    clientId: string
    clientSecret?: string
  } | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const [editingClient, setEditingClient] = useState<OAuthClient | null>(null)
  const [editName, setEditName] = useState("")
  const [editRedirectUris, setEditRedirectUris] = useState("")
  const [editUri, setEditUri] = useState("")

  const [deleteClientId, setDeleteClientId] = useState<string | null>(null)
  const [rotateClientId, setRotateClientId] = useState<string | null>(null)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copiedNewSecret, setCopiedNewSecret] = useState(false)

  const [deleteConsentId, setDeleteConsentId] = useState<string | null>(null)

  if (userLoading || clientsLoading || consentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  function handleCreate() {
    const redirectUris = newAppRedirectUris
      .split("\n")
      .map((uri) => uri.trim())
      .filter(Boolean)

    if (redirectUris.length === 0) {
      toast.error("At least one redirect URI is required")
      return
    }

    createClient(
      {
        name: newAppName || "My Application",
        redirectUris,
        uri: newAppUri || undefined,
      },
      {
        onSuccess: (result) => {
          setCreatedApp({
            clientId: result.client_id,
            clientSecret: result.client_secret,
          })
          setNewAppName("")
          setNewAppRedirectUris("")
          setNewAppUri("")
          refetchClients()
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create application")
        },
      },
    )
  }

  function handleCloseCreate() {
    setIsCreateOpen(false)
    setCreatedApp(null)
    setNewAppName("")
    setNewAppRedirectUris("")
    setNewAppUri("")
    setCopiedId(false)
    setCopiedSecret(false)
  }

  function handleCopyId() {
    if (createdApp?.clientId) {
      navigator.clipboard.writeText(createdApp.clientId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  function handleCopySecret() {
    if (createdApp?.clientSecret) {
      navigator.clipboard.writeText(createdApp.clientSecret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  function handleEditOpen(client: OAuthClient) {
    setEditingClient(client)
    setEditName(client.client_name || "")
    setEditRedirectUris(client.redirect_uris.join("\n"))
    setEditUri(client.client_uri || "")
  }

  function handleEditClose() {
    setEditingClient(null)
    setEditName("")
    setEditRedirectUris("")
    setEditUri("")
  }

  function handleUpdate() {
    if (!editingClient) return

    const redirectUris = editRedirectUris
      .split("\n")
      .map((uri) => uri.trim())
      .filter(Boolean)

    if (redirectUris.length === 0) {
      toast.error("At least one redirect URI is required")
      return
    }

    updateClient(
      {
        clientId: editingClient.client_id,
        update: {
          name: editName || undefined,
          redirect_uris: redirectUris,
          client_uri: editUri || undefined,
        },
      },
      {
        onSuccess: () => {
          handleEditClose()
          refetchClients()
          toast.success("Application updated")
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update application")
        },
      },
    )
  }

  function handleDeleteClient(clientId: string) {
    deleteClient(
      { clientId },
      {
        onSuccess: () => {
          setDeleteClientId(null)
          refetchClients()
          toast.success("Application deleted")
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to delete application")
        },
      },
    )
  }

  function handleRotateSecret(clientId: string) {
    rotateSecret(
      { clientId },
      {
        onSuccess: (result) => {
          setNewSecret(result.client_secret)
          refetchClients()
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to rotate secret")
        },
      },
    )
  }

  function handleCloseRotate() {
    setRotateClientId(null)
    setNewSecret(null)
    setCopiedNewSecret(false)
  }

  function handleCopyNewSecret() {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret)
      setCopiedNewSecret(true)
      setTimeout(() => setCopiedNewSecret(false), 2000)
    }
  }

  function handleDeleteConsent(id: string) {
    deleteConsent(
      { id },
      {
        onSuccess: () => {
          setDeleteConsentId(null)
          refetchConsents()
          toast.success("Access revoked")
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to revoke access")
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>OAuth Applications</CardTitle>
          <CardDescription>
            Create OAuth applications to allow third-party services to authenticate with your
            account or on behalf of your users.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Your Applications</h3>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <RiAddLine className="size-4" />
              New Application
            </Button>
            <Dialog
              open={isCreateOpen}
              onOpenChange={(open) => (open ? setIsCreateOpen(true) : handleCloseCreate())}
            >
              <DialogContent>
                {createdApp ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Application Created</DialogTitle>
                      <DialogDescription>
                        Save your client credentials now. The client secret will only be shown
                        once.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                        <RiAlertLine className="mt-0.5 size-5 shrink-0 text-amber-500" />
                        <p className="text-sm text-muted-foreground">
                          Make sure to copy your client secret now. For security reasons, we
                          won&apos;t show it again.
                        </p>
                      </div>
                      <SecretField
                        label="Client ID"
                        value={createdApp.clientId}
                        copied={copiedId}
                        onCopy={handleCopyId}
                      />
                      {createdApp.clientSecret && (
                        <SecretField
                          label="Client Secret"
                          value={createdApp.clientSecret}
                          copied={copiedSecret}
                          onCopy={handleCopySecret}
                        />
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCloseCreate}>Done</Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Register New Application</DialogTitle>
                      <DialogDescription>
                        Create a new OAuth application to integrate with gitbruv.
                      </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="app-name">Application Name</FieldLabel>
                        <Input
                          id="app-name"
                          value={newAppName}
                          onChange={(e) => setNewAppName(e.target.value)}
                          placeholder="My Application"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="app-uri">Homepage URL (Optional)</FieldLabel>
                        <Input
                          id="app-uri"
                          value={newAppUri}
                          onChange={(e) => setNewAppUri(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="app-redirect-uris">
                          Authorization Callback URLs
                        </FieldLabel>
                        <Textarea
                          id="app-redirect-uris"
                          value={newAppRedirectUris}
                          onChange={(e) => setNewAppRedirectUris(e.target.value)}
                          placeholder={"https://example.com/callback\nhttps://example.com/auth/callback"}
                          rows={3}
                        />
                        <FieldDescription>
                          Enter one URL per line. These are the URLs where users will be
                          redirected after authorization.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                    <DialogFooter>
                      <Button variant="outline" onClick={handleCloseCreate} disabled={isCreating}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreate} disabled={isCreating}>
                        {isCreating && <Spinner />}
                        Register Application
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {clients && clients.length > 0 ? (
            <div className="divide-y overflow-hidden rounded-xl border">
              {clients.map((client: OAuthClient) => (
                <div key={client.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      {client.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={client.icon} alt="" className="size-6 rounded-lg" />
                      ) : (
                        <RiCodeSSlashLine className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {client.client_name || "Unnamed Application"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(client.client_id_issued_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit application"
                      onClick={() => handleEditOpen(client)}
                    >
                      <RiPencilLine className="size-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Rotate client secret"
                      onClick={() => setRotateClientId(client.client_id)}
                    >
                      <RiRefreshLine className="size-4 text-muted-foreground" />
                    </Button>
                    <Dialog
                      open={rotateClientId === client.client_id}
                      onOpenChange={(open) => {
                        if (open) {
                          setRotateClientId(client.client_id)
                        } else {
                          handleCloseRotate()
                        }
                      }}
                    >
                      <DialogContent>
                        {newSecret ? (
                          <>
                            <DialogHeader>
                              <DialogTitle>New Client Secret</DialogTitle>
                              <DialogDescription>
                                Your new client secret has been generated. Copy it now.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                                <RiAlertLine className="mt-0.5 size-5 shrink-0 text-amber-500" />
                                <p className="text-sm text-muted-foreground">
                                  The previous secret has been invalidated. Update your
                                  application with this new secret.
                                </p>
                              </div>
                              <SecretField
                                value={newSecret}
                                copied={copiedNewSecret}
                                onCopy={handleCopyNewSecret}
                              />
                            </div>
                            <DialogFooter>
                              <Button onClick={handleCloseRotate}>Done</Button>
                            </DialogFooter>
                          </>
                        ) : (
                          <>
                            <DialogHeader>
                              <DialogTitle>Rotate Client Secret</DialogTitle>
                              <DialogDescription>
                                This will generate a new client secret and invalidate the current
                                one. Any applications using the old secret will stop working.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={handleCloseRotate}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleRotateSecret(client.client_id)}
                                disabled={isRotating}
                              >
                                {isRotating && <Spinner />}
                                Rotate Secret
                              </Button>
                            </DialogFooter>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete application"
                      onClick={() => setDeleteClientId(client.client_id)}
                    >
                      <RiDeleteBinLine className="size-4 text-muted-foreground" />
                    </Button>
                    <Dialog
                      open={deleteClientId === client.client_id}
                      onOpenChange={(open) =>
                        setDeleteClientId(open ? client.client_id : null)
                      }
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Application</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this application? All users who have
                            authorized this application will lose access.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteClientId(null)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteClient(client.client_id)}
                            disabled={isDeletingClient}
                          >
                            {isDeletingClient && <Spinner />}
                            Delete Application
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty className="border-none py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiCodeSSlashLine />
                </EmptyMedia>
                <EmptyTitle>No OAuth applications yet</EmptyTitle>
                <EmptyDescription>Create one to get started.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <Dialog open={!!editingClient} onOpenChange={(open) => !open && handleEditClose()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Application</DialogTitle>
                <DialogDescription>Update your OAuth application settings.</DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="edit-name">Application Name</FieldLabel>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="My Application"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-uri">Homepage URL (Optional)</FieldLabel>
                  <Input
                    id="edit-uri"
                    value={editUri}
                    onChange={(e) => setEditUri(e.target.value)}
                    placeholder="https://example.com"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-redirect-uris">
                    Authorization Callback URLs
                  </FieldLabel>
                  <Textarea
                    id="edit-redirect-uris"
                    value={editRedirectUris}
                    onChange={(e) => setEditRedirectUris(e.target.value)}
                    placeholder="https://example.com/callback"
                    rows={3}
                  />
                  <FieldDescription>Enter one URL per line.</FieldDescription>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button variant="outline" onClick={handleEditClose} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={isUpdating}>
                  {isUpdating && <Spinner />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authorized Applications</CardTitle>
          <CardDescription>
            These are applications you have authorized to access your account. You can revoke
            access at any time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consents && consents.length > 0 ? (
            <div className="divide-y overflow-hidden rounded-xl border">
              {consents.map((consent: OAuthConsent) => (
                <div key={consent.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      {consent.client?.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={consent.client.icon} alt="" className="size-6 rounded-lg" />
                      ) : (
                        <RiCodeSSlashLine className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {consent.client?.name || "Unknown Application"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Scopes: {consent.scopes.split(" ").join(", ")} · Authorized{" "}
                        {new Date(consent.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConsentId(consent.id)}
                  >
                    Revoke
                  </Button>
                  <Dialog
                    open={deleteConsentId === consent.id}
                    onOpenChange={(open) => setDeleteConsentId(open ? consent.id : null)}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Revoke Access</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to revoke access for{" "}
                          {consent.client?.name || "this application"}? It will no longer be able
                          to access your account.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConsentId(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteConsent(consent.id)}
                          disabled={isDeletingConsent}
                        >
                          {isDeletingConsent && <Spinner />}
                          Revoke Access
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
                  <RiCheckboxCircleLine />
                </EmptyMedia>
                <EmptyTitle>No authorized applications</EmptyTitle>
                <EmptyDescription>
                  When you authorize an application, it will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
