"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { validateUsername } from "@gitbruv/lib"
import { toast } from "sonner"
import { signUpWithUsername } from "@/lib/auth-client"
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
  AuthCard,
  AuthCardHeader,
  AuthFooter,
  AuthLink,
} from "@/components/auth/auth-card"

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const usernameValidation = validateUsername(formData.username)
    if (!usernameValidation.valid) {
      toast.error(usernameValidation.error)
      setLoading(false)
      return
    }

    try {
      const { error } = await signUpWithUsername({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        username: formData.username.toLowerCase(),
      })

      if (error) {
        toast.error(error.message || "Failed to create account")
        return
      }

      toast.success("Account created successfully!")
      router.push("/")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AuthCard>
        <AuthCardHeader title="Create your account" />
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                autoComplete="username"
                required
              />
              <FieldDescription>
                This will be your unique identifier on gitbruv
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <FieldDescription>Must be at least 8 characters</FieldDescription>
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Spinner />}
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </FieldGroup>
        </form>
      </AuthCard>
      <AuthFooter>
        Already have an account? <AuthLink href="/login">Sign in</AuthLink>
      </AuthFooter>
    </>
  )
}
