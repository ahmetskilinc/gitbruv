"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { RiCheckboxCircleLine, RiQuestionLine } from "@remixicon/react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const SCOPE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  openid: {
    name: "OpenID",
    description: "Verify your identity",
  },
  profile: {
    name: "Profile",
    description: "Access your name and profile picture",
  },
  email: {
    name: "Email",
    description: "Access your email address",
  },
  offline_access: {
    name: "Offline Access",
    description: "Access your data while you are offline",
  },
}

export function ConsentView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDenying, setIsDenying] = useState(false)

  const search = {
    client_id: searchParams.get("client_id") || "",
    scope: searchParams.get("scope") || "",
    state: searchParams.get("state") || "",
    redirect_uri: searchParams.get("redirect_uri") || "",
    response_type: searchParams.get("response_type") || "",
    code_challenge: searchParams.get("code_challenge") || "",
    code_challenge_method: searchParams.get("code_challenge_method") || "",
    exp: searchParams.get("exp") || "",
    sig: searchParams.get("sig") || "",
  }

  const clientId = search.client_id
  const requestedScope = search.scope
  const scopes = requestedScope.split(" ").filter(Boolean)

  const oauthQuery = new URLSearchParams({
    client_id: search.client_id,
    scope: search.scope,
    state: search.state,
    redirect_uri: search.redirect_uri,
    response_type: search.response_type,
    code_challenge: search.code_challenge,
    code_challenge_method: search.code_challenge_method,
    exp: search.exp,
    sig: search.sig,
  }).toString()

  useEffect(() => {
    console.group("[OAuth] Consent page loaded")
    console.log("client_id:    ", search.client_id)
    console.log("scope:        ", search.scope)
    console.log("redirect_uri: ", search.redirect_uri)
    console.log("state:        ", search.state)
    console.log("response_type:", search.response_type)
    console.log("code_challenge_method:", search.code_challenge_method)
    console.log(
      "exp:          ",
      search.exp ? new Date(Number(search.exp) * 1000).toISOString() : "—",
    )
    console.groupEnd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    data: client,
    isLoading: clientLoading,
    error: clientError,
  } = useQuery({
    queryKey: ["oauth-public-client", clientId],
    queryFn: async () => {
      console.log("[OAuth] Fetching public client info for:", clientId)
      const result = await authClient.oauth2.publicClient({
        query: { client_id: clientId },
      })
      if (result.error) {
        console.error("[OAuth] Failed to fetch client:", result.error)
        throw result.error
      }
      console.log("[OAuth] Client info:", result.data)
      return result.data
    },
    enabled: !!clientId,
  })

  const consentMutation = useMutation({
    mutationFn: async (accept: boolean) => {
      console.group(`[OAuth] Submitting consent — accept: ${accept}`)
      console.log("oauth_query:", oauthQuery)
      const result = await authClient.oauth2.consent({
        accept,
        scope: accept ? requestedScope : undefined,
        oauth_query: oauthQuery,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      if (result.error) {
        console.error("[OAuth] Consent error:", result.error)
        console.groupEnd()
        throw result.error
      }
      console.log("[OAuth] Consent response:", result.data)
      console.groupEnd()
      // The runtime response carries the redirect target as `uri`; the client
      // types on this better-auth version say `{ redirect, url }`.
      return result.data as unknown as { uri?: string } | null
    },
  })

  async function handleAccept() {
    setIsAccepting(true)
    try {
      const data = await consentMutation.mutateAsync(true)
      if (data?.uri) {
        console.log("[OAuth] Redirecting to callback:", data.uri)
        window.location.href = data.uri
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to grant consent")
      setIsAccepting(false)
    }
  }

  async function handleDeny() {
    setIsDenying(true)
    try {
      const data = await consentMutation.mutateAsync(false)
      if (data?.uri) {
        console.log("[OAuth] Denied — redirecting to:", data.uri)
        window.location.href = data.uri
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deny consent")
      setIsDenying(false)
    }
  }

  useEffect(() => {
    if (!clientId) {
      console.warn("[OAuth] No client_id found, redirecting home")
      router.push("/")
    }
  }, [clientId, router])

  if (!clientId) {
    return null
  }

  if (clientLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (clientError || !client) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            {clientError instanceof Error ? clientError.message : "Application not found"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border bg-card p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            {client.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.logo_uri} alt="" className="size-10 rounded-full" />
            ) : (
              <RiQuestionLine className="size-8 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-xl font-semibold">
            Authorize {client.client_name || "Application"}
          </h1>
          {client.client_uri && (
            <p className="mt-1 text-sm text-muted-foreground">
              {new URL(client.client_uri).hostname}
            </p>
          )}
        </div>

        <div className="mb-6">
          <p className="mb-4 text-sm text-muted-foreground">
            This application is requesting access to:
          </p>
          <div className="flex flex-col gap-3">
            {scopes.map((scope) => {
              const scopeInfo = SCOPE_DESCRIPTIONS[scope] || {
                name: scope,
                description: `Access to ${scope}`,
              }
              return (
                <div
                  key={scope}
                  className="flex items-start gap-3 rounded-xl border bg-muted/50 p-3"
                >
                  <RiCheckboxCircleLine className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">{scopeInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{scopeInfo.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isDenying}
            className="h-11 w-full"
          >
            {isAccepting ? (
              <>
                <Spinner />
                Authorizing...
              </>
            ) : (
              "Authorize"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={isAccepting || isDenying}
            className="h-11 w-full"
          >
            {isDenying ? (
              <>
                <Spinner />
                Canceling...
              </>
            ) : (
              "Cancel"
            )}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By authorizing, you allow this application to access your information as described
          above. You can revoke access at any time in your settings.
        </p>
      </div>
    </div>
  )
}
