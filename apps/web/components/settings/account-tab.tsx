"use client"

import { useCurrentUser } from "@gitbruv/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { EmailForm } from "@/components/settings/email-form"
import { PasswordForm } from "@/components/settings/password-form"
import { GitSettingsForm } from "@/components/settings/git-settings-form"
import { PreferencesForm } from "@/components/settings/preferences-form"
import { DeleteAccount } from "@/components/settings/delete-account"

export function AccountTab() {
  const { data, isLoading } = useCurrentUser()
  const user = data?.user

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>Change the email associated with your account</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailForm currentEmail={user.email ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Git Settings</CardTitle>
          <CardDescription>Configure git-related preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <GitSettingsForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your application preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm user={user} />
        </CardContent>
      </Card>

      <Card className="border border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect your account</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccount username={user.username} />
        </CardContent>
      </Card>
    </div>
  )
}
