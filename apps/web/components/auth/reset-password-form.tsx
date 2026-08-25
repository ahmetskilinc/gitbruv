"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiLockPasswordLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/env"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  AuthCard,
  AuthCardHeader,
  AuthFooter,
  AuthIconBadge,
  AuthLink,
} from "@/components/auth/auth-card"

function StatusCard({
  tone,
  icon,
  title,
  description,
  action,
}: {
  tone: "success" | "destructive"
  icon: React.ReactNode
  title: string
  description: React.ReactNode
  action: React.ReactNode
}) {
  return (
    <AuthCard>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <AuthIconBadge tone={tone}>{icon}</AuthIconBadge>
        </div>
        <h1 className="mb-2 text-xl font-semibold">{title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{description}</p>
        {action}
      </div>
    </AuthCard>
  )
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${getApiUrl()}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to reset password")
        return
      }

      setSuccess(true)
      toast.success("Password reset successfully")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <StatusCard
        tone="destructive"
        icon={<RiErrorWarningLine />}
        title="Invalid reset link"
        description="This password reset link is invalid or has expired."
        action={
          <Button className="w-full" render={<Link href="/forgot-password" />}>
            Request a new link
          </Button>
        }
      />
    )
  }

  if (success) {
    return (
      <StatusCard
        tone="success"
        icon={<RiCheckboxCircleLine />}
        title="Password reset complete"
        description="Your password has been reset successfully. You can now sign in with your new password."
        action={
          <Button className="w-full" render={<Link href="/login" />}>
            Sign in
          </Button>
        }
      />
    )
  }

  if (error) {
    return (
      <StatusCard
        tone="destructive"
        icon={<RiErrorWarningLine />}
        title="Reset failed"
        description={error}
        action={
          <Button className="w-full" render={<Link href="/forgot-password" />}>
            Request a new link
          </Button>
        }
      />
    )
  }

  return (
    <>
      <AuthCard>
        <AuthCardHeader
          icon={
            <AuthIconBadge>
              <RiLockPasswordLine />
            </AuthIconBadge>
          }
          title="Create new password"
          description="Enter your new password below."
        />
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Spinner />}
              {loading ? "Resetting..." : "Reset password"}
            </Button>
          </FieldGroup>
        </form>
      </AuthCard>
      <AuthFooter>
        Remember your password? <AuthLink href="/login">Sign in</AuthLink>
      </AuthFooter>
    </>
  )
}
