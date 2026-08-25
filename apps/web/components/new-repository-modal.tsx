"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCreateRepository, useCurrentUser } from "@gitbruv/hooks"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisibilityRadioGroup } from "@/components/visibility-radio-group"

interface NewRepositoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewRepositoryModal({ open, onOpenChange }: NewRepositoryModalProps) {
  const { data: session } = useSession()
  const { data: currentUser } = useCurrentUser()
  const router = useRouter()
  const { mutate: createRepo, isPending: isCreating } = useCreateRepository()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public" as "public" | "private",
  })

  const defaultVisibility =
    (currentUser?.user.defaultRepositoryVisibility as "public" | "private") || "public"

  // Render-time adjustments (React-recommended alternative to setState-in-effect):
  // adopt the user's default visibility when it loads, and reset the form on close.
  const [prevDefault, setPrevDefault] = useState(defaultVisibility)
  if (prevDefault !== defaultVisibility) {
    setPrevDefault(defaultVisibility)
    setFormData((prev) => ({ ...prev, visibility: defaultVisibility }))
  }
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) {
      setFormData({ name: "", description: "", visibility: defaultVisibility })
    }
  }

  if (!session?.user) {
    return null
  }

  const username = (session.user as { username?: string }).username || ""

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createRepo(
      {
        name: formData.name,
        description: formData.description || undefined,
        visibility: formData.visibility,
      },
      {
        onSuccess: () => {
          toast.success("Repository created!")
          onOpenChange(false)
          router.push(
            `/${username}/${formData.name.toLowerCase().replace(/\s+/g, "-")}`,
          )
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create repository")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new repository</DialogTitle>
          <DialogDescription>
            A repository contains all project files, including the revision history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">
                Repository name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="my-awesome-project"
                required
                pattern="^[a-zA-Z0-9_.-]+$"
                autoFocus
              />
              <FieldDescription>
                Great repository names are short and memorable.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="description">
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="A short description of your project"
              />
            </Field>

            <VisibilityRadioGroup
              value={formData.visibility}
              onValueChange={(visibility) => setFormData({ ...formData, visibility })}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !formData.name}>
                {isCreating && <Spinner />}
                {isCreating ? "Creating..." : "Create repository"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
