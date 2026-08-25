"use client"

import { useRef, useState } from "react"
import { RiCameraLine, RiDeleteBinLine } from "@remixicon/react"
import { toast } from "sonner"
import { useDeleteAvatar, useUpdateAvatar } from "@gitbruv/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface AvatarUploadProps {
  currentAvatar?: string | null
  name: string
}

export function AvatarUpload({ currentAvatar, name }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateAvatarMutation = useUpdateAvatar()
  const deleteAvatarMutation = useDeleteAvatar()

  // Reset the preview whenever the server-side avatar changes (render-time
  // adjustment instead of an effect, per react-hooks/set-state-in-effect).
  const [prevAvatar, setPrevAvatar] = useState(currentAvatar)
  if (prevAvatar !== currentAvatar) {
    setPrevAvatar(currentAvatar)
    setPreview(currentAvatar || null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    updateAvatarMutation.mutate(file, {
      onSuccess: (result) => {
        if (result?.avatarUrl) {
          setPreview(result.avatarUrl)
        }
        toast.success("Avatar updated successfully")
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to upload avatar")
        setPreview(currentAvatar || null)
      },
    })
  }

  function handleDeleteAvatar() {
    deleteAvatarMutation.mutate(undefined, {
      onSuccess: () => {
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        toast.success("Avatar removed")
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete avatar")
      },
    })
  }

  return (
    <div className="flex items-start gap-6">
      <div className="relative">
        <Avatar className="size-24">
          <AvatarImage src={preview || undefined} alt={name} />
          <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {updateAvatarMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
            <Spinner className="size-6" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={updateAvatarMutation.isPending || deleteAvatarMutation.isPending}
          >
            <RiCameraLine className="size-4" />
            Change Avatar
          </Button>
          {preview && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteAvatar}
              disabled={updateAvatarMutation.isPending || deleteAvatarMutation.isPending}
            >
              {deleteAvatarMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <RiDeleteBinLine className="size-4" />
              )}
              Delete Avatar
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
      </div>
    </div>
  )
}
