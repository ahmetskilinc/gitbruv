"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RiFingerprintLine } from "@remixicon/react"
import { toast } from "sonner"
import { authClient, signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  AuthCard,
  AuthCardHeader,
  AuthFooter,
  AuthLink,
} from "@/components/auth/auth-card"

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !PublicKeyCredential.isConditionalMediationAvailable
    ) {
      return
    }
    void PublicKeyCredential.isConditionalMediationAvailable().then((available) => {
      if (available) {
        void authClient.signIn.passkey({ autoFill: true })
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn.email({ email, password })

      if (error) {
        toast.error(error.message || "Failed to sign in")
        return
      }

      toast.success("Welcome back!")
      router.push("/")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handlePasskeySignIn() {
    setPasskeyLoading(true)

    try {
      const { error } = await authClient.signIn.passkey()

      if (error) {
        toast.error(error.message || "Failed to sign in with passkey")
        return
      }

      toast.success("Welcome back!")
      router.push("/")
    } catch (err) {
      if (err instanceof Error && err.name !== "NotAllowedError") {
        toast.error("Something went wrong")
      }
    } finally {
      setPasskeyLoading(false)
    }
  }

  return (
    <>
      <AuthCard>
        <AuthCardHeader title="Sign in to gitbruv" />
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
                autoComplete="username webauthn"
                required
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <AuthLinkMuted href="/forgot-password">Forgot password?</AuthLinkMuted>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password webauthn"
                required
              />
            </Field>
            <Button type="submit" disabled={loading || passkeyLoading} className="w-full">
              {loading && <Spinner />}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <FieldSeparator>Or</FieldSeparator>
            <Button
              type="button"
              variant="outline"
              onClick={handlePasskeySignIn}
              disabled={loading || passkeyLoading}
              className="w-full"
            >
              {passkeyLoading ? <Spinner /> : <RiFingerprintLine />}
              {passkeyLoading ? "Signing in..." : "Sign in with Passkey"}
            </Button>
          </FieldGroup>
        </form>
      </AuthCard>
      <AuthFooter>
        New to gitbruv? <AuthLink href="/register">Create an account</AuthLink>
      </AuthFooter>
    </>
  )
}

function AuthLinkMuted({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className="text-xs text-muted-foreground hover:text-foreground">
      {children}
    </Link>
  )
}
