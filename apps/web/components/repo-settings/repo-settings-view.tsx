"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { RiAlertLine, RiDeleteBinLine, RiLockLine } from "@remixicon/react"
import { toast } from "sonner"
import {
  useRepoPageData,
  useUpdateRepository,
  useDeleteRepository,
  useRepositoryInfo,
  useBranchProtectionRules,
  useCreateBranchProtectionRule,
  useUpdateBranchProtectionRule,
  useDeleteBranchProtectionRule,
} from "@gitbruv/hooks"
import type { BranchProtectionRule } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisibilityRadioGroup } from "@/components/visibility-radio-group"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

export function RepoSettingsView() {
  const params = useParams<{ username: string; repo: string }>()
  const username = decodeURIComponent(params.username)
  const repoName = decodeURIComponent(params.repo)
  const router = useRouter()
  const { data: pageData, isLoading } = useRepoPageData(username, repoName)
  const { data: repoInfo, isLoading: isLoadingInfo } = useRepositoryInfo(username, repoName)
  const repo = repoInfo?.repo
  const isOwner = pageData?.isOwner ?? false
  const { mutate: updateRepo, isPending: saving } = useUpdateRepository(repo?.id || "")
  const { mutate: deleteRepo, isPending: deleting } = useDeleteRepository(repo?.id || "")

  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public" as "public" | "private",
  })
  const [initialized, setInitialized] = useState(false)

  if (!initialized && repo) {
    setFormData({
      name: repo.name,
      description: repo.description || "",
      visibility: repo.visibility,
    })
    setInitialized(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!repo) return

    updateRepo(
      {
        name: formData.name,
        description: formData.description,
        visibility: formData.visibility,
      },
      {
        onSuccess: (updated) => {
          toast.success("Settings saved")
          if (updated && updated.name !== repo.name) {
            router.push(`/${username}/${updated.name}/settings`)
          }
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to save settings")
        },
      },
    )
  }

  async function handleDelete() {
    if (!repo || deleteConfirm !== repo.name) return

    deleteRepo(undefined, {
      onSuccess: () => {
        toast.success("Repository deleted")
        router.push(`/${username}`)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete repository")
      },
    })
  }

  if (isLoading || isLoadingInfo) {
    return (
      <PageContainer size="narrow">
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8 text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  if (!repo || !isOwner) {
    return (
      <PageContainer size="narrow">
        <Card>
          <CardContent className="p-12 text-center">
            <RiAlertLine className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
            <p className="mb-6 text-muted-foreground">
              You don&apos;t have permission to access this page
            </p>
            <Button render={<Link href={`/${username}/${repoName}`} />}>
              Back to repository
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        title="Settings"
        description="Manage this repository's details, visibility and branch protection"
      />
      <div className="flex flex-col gap-8">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Basic repository information</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Repository name</FieldLabel>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    pattern="^[a-zA-Z0-9_.-]+$"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="A short description of your repository"
                    rows={3}
                  />
                </Field>

                <Field>
                  <FieldLabel>Visibility</FieldLabel>
                  <VisibilityRadioGroup
                    value={formData.visibility}
                    onValueChange={(visibility) => setFormData({ ...formData, visibility })}
                  />
                </Field>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving && <Spinner />}
                    Save changes
                  </Button>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </form>

        <BranchProtectionSection username={username} repoName={repoName} />

        <Card className="border border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that can affect your repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div>
                <p className="font-medium">Delete this repository</p>
                <p className="text-sm text-muted-foreground">
                  Once deleted, it cannot be recovered
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <RiDeleteBinLine className="size-4" />
                Delete
              </Button>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete repository</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete the{" "}
                      <strong>
                        {username}/{repo.name}
                      </strong>{" "}
                      repository and all of its contents.
                    </DialogDescription>
                  </DialogHeader>
                  <Field className="py-4">
                    <FieldLabel htmlFor="confirm">
                      Type <strong>{repo.name}</strong> to confirm
                    </FieldLabel>
                    <Input
                      id="confirm"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={repo.name}
                    />
                  </Field>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteOpen(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteConfirm !== repo.name || deleting}
                    >
                      {deleting && <Spinner />}
                      Delete repository
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function BranchProtectionSection({
  username,
  repoName,
}: {
  username: string
  repoName: string
}) {
  const { data, isLoading } = useBranchProtectionRules(username, repoName)
  const createRule = useCreateBranchProtectionRule(username, repoName)
  const updateRule = useUpdateBranchProtectionRule(username, repoName)
  const deleteRule = useDeleteBranchProtectionRule(username, repoName)

  const [updatingRuleIds, setUpdatingRuleIds] = useState<Set<string>>(new Set())
  const [deletingRuleIds, setDeletingRuleIds] = useState<Set<string>>(new Set())

  const [newBranch, setNewBranch] = useState("")
  const [newRule, setNewRule] = useState({
    preventDirectPush: true,
    preventForcePush: true,
    preventDeletion: true,
    requireReviews: false,
    requiredReviewCount: 1,
  })

  function handleCreate() {
    if (!newBranch.trim()) return
    createRule.mutate(
      { branchName: newBranch.trim(), ...newRule },
      {
        onSuccess: () => {
          toast.success("Branch protection rule created")
          setNewBranch("")
          setNewRule({
            preventDirectPush: true,
            preventForcePush: true,
            preventDeletion: true,
            requireReviews: false,
            requiredReviewCount: 1,
          })
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create rule")
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiLockLine className="size-5" />
          Branch Protection
        </CardTitle>
        <CardDescription>Configure protection rules for specific branches</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        )}

        {data?.rules?.map((rule) => (
          <BranchProtectionRuleRow
            key={rule.id}
            rule={rule}
            onUpdate={(data) => {
              setUpdatingRuleIds((prev) => new Set(prev).add(rule.id))
              updateRule.mutate(
                { ruleId: rule.id, data },
                {
                  onSuccess: () => {
                    setUpdatingRuleIds((prev) => {
                      const next = new Set(prev)
                      next.delete(rule.id)
                      return next
                    })
                    toast.success("Rule updated")
                  },
                  onError: (err) => {
                    setUpdatingRuleIds((prev) => {
                      const next = new Set(prev)
                      next.delete(rule.id)
                      return next
                    })
                    toast.error(err instanceof Error ? err.message : "Failed to update")
                  },
                },
              )
            }}
            onDelete={() => {
              setDeletingRuleIds((prev) => new Set(prev).add(rule.id))
              deleteRule.mutate(rule.id, {
                onSuccess: () => {
                  setDeletingRuleIds((prev) => {
                    const next = new Set(prev)
                    next.delete(rule.id)
                    return next
                  })
                  toast.success("Rule deleted")
                },
                onError: (err) => {
                  setDeletingRuleIds((prev) => {
                    const next = new Set(prev)
                    next.delete(rule.id)
                    return next
                  })
                  toast.error(err instanceof Error ? err.message : "Failed to delete")
                },
              })
            }}
            saving={updatingRuleIds.has(rule.id)}
            deleting={deletingRuleIds.has(rule.id)}
          />
        ))}

        {data?.rules?.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">
            No branch protection rules configured.
          </p>
        )}

        <div className="flex flex-col gap-4 border-t pt-6">
          <h4 className="text-sm font-medium">Add new rule</h4>
          <Field>
            <FieldLabel htmlFor="new-branch">Branch name</FieldLabel>
            <Input
              id="new-branch"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="e.g. main"
            />
          </Field>
          <ProtectionCheckboxes
            values={newRule}
            onChange={(updates) => setNewRule({ ...newRule, ...updates })}
          />
          <Button onClick={handleCreate} disabled={!newBranch.trim() || createRule.isPending}>
            {createRule.isPending && <Spinner />}
            Add rule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function BranchProtectionRuleRow({
  rule,
  onUpdate,
  onDelete,
  saving,
  deleting,
}: {
  rule: BranchProtectionRule
  onUpdate: (data: {
    preventDirectPush?: boolean
    preventForcePush?: boolean
    preventDeletion?: boolean
    requireReviews?: boolean
    requiredReviewCount?: number
  }) => void
  onDelete: () => void
  saving: boolean
  deleting: boolean
}) {
  const [values, setValues] = useState({
    preventDirectPush: rule.preventDirectPush,
    preventForcePush: rule.preventForcePush,
    preventDeletion: rule.preventDeletion,
    requireReviews: rule.requireReviews,
    requiredReviewCount: rule.requiredReviewCount,
  })

  // Re-sync local edits when the server rule changes (render-time adjustment
  // instead of an effect, per react-hooks/set-state-in-effect).
  const [prevRule, setPrevRule] = useState(rule)
  if (
    prevRule.id !== rule.id ||
    prevRule.preventDirectPush !== rule.preventDirectPush ||
    prevRule.preventForcePush !== rule.preventForcePush ||
    prevRule.preventDeletion !== rule.preventDeletion ||
    prevRule.requireReviews !== rule.requireReviews ||
    prevRule.requiredReviewCount !== rule.requiredReviewCount
  ) {
    setPrevRule(rule)
    setValues({
      preventDirectPush: rule.preventDirectPush,
      preventForcePush: rule.preventForcePush,
      preventDeletion: rule.preventDeletion,
      requireReviews: rule.requireReviews,
      requiredReviewCount: rule.requiredReviewCount,
    })
  }

  const hasChanges =
    values.preventDirectPush !== rule.preventDirectPush ||
    values.preventForcePush !== rule.preventForcePush ||
    values.preventDeletion !== rule.preventDeletion ||
    values.requireReviews !== rule.requireReviews ||
    values.requiredReviewCount !== rule.requiredReviewCount

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiLockLine className="size-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">{rule.branchName}</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Delete protection rule for ${rule.branchName}`}
        >
          {deleting ? <Spinner /> : <RiDeleteBinLine className="size-4" />}
        </Button>
      </div>
      <ProtectionCheckboxes
        values={values}
        onChange={(updates) => setValues({ ...values, ...updates })}
      />
      {hasChanges && (
        <Button size="sm" onClick={() => onUpdate(values)} disabled={saving}>
          {saving && <Spinner />}
          Save changes
        </Button>
      )}
    </div>
  )
}

function ProtectionCheckboxes({
  values,
  onChange,
}: {
  values: {
    preventDirectPush: boolean
    preventForcePush: boolean
    preventDeletion: boolean
    requireReviews: boolean
    requiredReviewCount: number
  }
  onChange: (updates: Partial<typeof values>) => void
}) {
  const reviewCountId = useId()
  return (
    <div className="flex flex-col gap-3">
      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox
          checked={values.preventDirectPush}
          onCheckedChange={(checked) => onChange({ preventDirectPush: checked === true })}
        />
        Prevent direct pushes (require pull requests)
      </Label>
      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox
          checked={values.preventForcePush}
          onCheckedChange={(checked) => onChange({ preventForcePush: checked === true })}
        />
        Prevent force pushes
      </Label>
      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox
          checked={values.preventDeletion}
          onCheckedChange={(checked) => onChange({ preventDeletion: checked === true })}
        />
        Prevent branch deletion
      </Label>
      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox
          checked={values.requireReviews}
          onCheckedChange={(checked) => onChange({ requireReviews: checked === true })}
        />
        Require pull request reviews before merging
      </Label>
      {values.requireReviews && (
        <div className="ml-6 flex items-center gap-2">
          <Label htmlFor={reviewCountId} className="text-sm whitespace-nowrap">
            Required approvals:
          </Label>
          <Input
            id={reviewCountId}
            type="number"
            min={1}
            max={10}
            value={values.requiredReviewCount}
            onChange={(e) => onChange({ requiredReviewCount: parseInt(e.target.value) || 1 })}
            className="w-20"
          />
        </div>
      )}
    </div>
  )
}
