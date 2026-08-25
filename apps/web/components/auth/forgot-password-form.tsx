"use client"

import { useState } from "react"
import { RiCheckboxCircleLine, RiMailLine } from "@remixicon/react"
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

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${getApiUrl()}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to send reset email")
        return
      }

      setSent(true)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <>
        <AuthCard>
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <AuthIconBadge tone="success">
                <RiCheckboxCircleLine />
              </AuthIconBadge>
            </div>
            <h1 className="mb-2 text-xl font-semibold">Check your email</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{email}</span>, we&apos;ve
              sent a password reset link.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-medium text-foreground hover:underline"
              >
                try again
              </button>
            </p>
          </div>
        </AuthCard>
        <AuthFooter>
          Remember your password? <AuthLink href="/login">Sign in</AuthLink>
        </AuthFooter>
      </>
    )
  }

  return (
    <>
      <AuthCard>
        <AuthCardHeader
          icon={
            <AuthIconBadge>
              <RiMailLine />
            </AuthIconBadge>
          }
          title="Reset your password"
          description="Enter your email address and we'll send you a link to reset your password."
        />
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Spinner />}
              {loading ? "Sending..." : "Send reset link"}
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
