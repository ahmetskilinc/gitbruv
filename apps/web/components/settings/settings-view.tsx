"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import {
  RiCodeSSlashLine,
  RiFingerprintLine,
  RiShieldLine,
  RiUserLine,
} from "@remixicon/react"
import { useSession } from "@/lib/auth-client"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { ProfileTab } from "@/components/settings/profile-tab"
import { AccountTab } from "@/components/settings/account-tab"
import { SecurityTab } from "@/components/settings/security-tab"
import { OAuthTab } from "@/components/settings/oauth-tab"

const TABS = ["profile", "account", "security", "oauth"] as const

export function SettingsView() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TABS).withDefault("profile"),
  )

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [isPending, session, router])

  if (isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <PageContainer size="narrow">
      <PageHeader title="Settings" description="Manage your account and preferences" />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          setTab(value === "profile" ? null : (value as "account" | "security" | "oauth"))
        }
      >
        <TabsList className="mb-6 h-12 w-full">
          <TabsTrigger value="profile">
            <RiUserLine className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account">
            <RiShieldLine className="size-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security">
            <RiFingerprintLine className="size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="oauth">
            <RiCodeSSlashLine className="size-4" />
            OAuth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="account" className="mt-0">
          <AccountTab />
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="oauth" className="mt-0">
          <OAuthTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
