"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiMailLine,
} from "@remixicon/react"
import { getApiUrl } from "@/lib/env"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AuthCard, AuthIconBadge } from "@/components/auth/auth-card"

export function VerifyEmailView() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "no-token"
  >(token ? "loading" : "no-token")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!token) {
      return
    }

    async function verifyEmail() {
      try {
        const res = await fetch(`${getApiUrl()}/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (!res.ok) {
          setStatus("error")
          setErrorMessage(data.error || "Failed to verify email")
          return
        }

        setStatus("success")
      } catch {
        setStatus("error")
        setErrorMessage("Something went wrong")
      }
    }

    verifyEmail()
  }, [token])

  if (status === "loading") {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Spinner className="size-7 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-xl font-semibold">Verifying your email</h1>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </div>
      </AuthCard>
    )
  }

  if (status === "no-token") {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <AuthIconBadge>
              <RiMailLine />
            </AuthIconBadge>
          </div>
          <h1 className="mb-2 text-xl font-semibold">Verify your email</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Check your inbox for a verification link to complete your registration.
          </p>
          <Button variant="outline" className="w-full" render={<Link href="/login" />}>
            Back to sign in
          </Button>
        </div>
      </AuthCard>
    )
  }

  if (status === "success") {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <AuthIconBadge tone="success">
              <RiCheckboxCircleLine />
            </AuthIconBadge>
          </div>
          <h1 className="mb-2 text-xl font-semibold">Email verified</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Your email has been verified successfully. You can now access all
            features.
          </p>
          <Button className="w-full" render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <AuthIconBadge tone="destructive">
            <RiErrorWarningLine />
          </AuthIconBadge>
        </div>
        <h1 className="mb-2 text-xl font-semibold">Verification failed</h1>
        <p className="mb-6 text-sm text-muted-foreground">{errorMessage}</p>
        <Button className="w-full" render={<Link href="/login" />}>
          Back to sign in
        </Button>
      </div>
    </AuthCard>
  )
}
