"use client"

import { useState } from "react"
import {
  useUpdatePreferences,
  useUpdateWordWrapPreference,
  useWordWrapPreference,
} from "@gitbruv/hooks"
import type { UserProfile } from "@gitbruv/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PreferencesForm({ user }: { user: UserProfile }) {
  const { mutateAsync: updatePreferences, isPending: isUpdatingPreferences } =
    useUpdatePreferences()
  const { data: wordWrapData } = useWordWrapPreference()
  const { mutateAsync: updateWordWrap, isPending: isUpdatingWordWrap } =
    useUpdateWordWrapPreference()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const preferences = user.preferences || {}
  const [emailNotifications, setEmailNotifications] = useState(
    preferences.emailNotifications ?? true,
  )
  const [theme, setTheme] = useState<"light" | "dark" | "system">(preferences.theme || "system")
  const [language, setLanguage] = useState(preferences.language || "")
  const [showEmail, setShowEmail] = useState(preferences.showEmail ?? false)
  const [includePrivateContributions, setIncludePrivateContributions] = useState(
    preferences.includePrivateContributions ?? false,
  )
  const [wordWrap, setWordWrap] = useState(wordWrapData?.wordWrap ?? false)
  const [prevWordWrap, setPrevWordWrap] = useState(wordWrapData?.wordWrap)

  // Sync local state when the fetched preference changes (render-time
  // adjustment instead of an effect, per react-hooks/set-state-in-effect).
  if (wordWrapData?.wordWrap !== undefined && wordWrapData.wordWrap !== prevWordWrap) {
    setPrevWordWrap(wordWrapData.wordWrap)
    setWordWrap(wordWrapData.wordWrap)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      await Promise.all([
        updatePreferences({
          emailNotifications,
          theme,
          language: language || undefined,
          showEmail,
          includePrivateContributions,
        }),
        updateWordWrap({ wordWrap }),
      ])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update preferences")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor="emailNotifications">Email Notifications</FieldLabel>
            <p className="text-xs text-muted-foreground">
              Receive email notifications for important updates
            </p>
          </div>
          <Checkbox
            id="emailNotifications"
            checked={emailNotifications}
            onCheckedChange={(checked) => setEmailNotifications(checked === true)}
          />
        </div>

        <Field>
          <FieldLabel htmlFor="theme">Theme</FieldLabel>
          <Select
            items={{ light: "Light", dark: "Dark", system: "System" }}
            value={theme}
            onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
          >
            <SelectTrigger id="theme" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="language">Language</FieldLabel>
          <Input
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g., en, es, fr"
          />
        </Field>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor="showEmail">Show Email</FieldLabel>
            <p className="text-xs text-muted-foreground">
              Display your email address on your public profile
            </p>
          </div>
          <Checkbox
            id="showEmail"
            checked={showEmail}
            onCheckedChange={(checked) => setShowEmail(checked === true)}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor="includePrivateContributions">
              Include private contributions
            </FieldLabel>
            <p className="text-xs text-muted-foreground">
              Show anonymized private activity counts in your profile contribution graph
            </p>
          </div>
          <Checkbox
            id="includePrivateContributions"
            checked={includePrivateContributions}
            onCheckedChange={(checked) => setIncludePrivateContributions(checked === true)}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor="wordWrap">Word Wrap</FieldLabel>
            <p className="text-xs text-muted-foreground">Wrap long lines when viewing files</p>
          </div>
          <Checkbox
            id="wordWrap"
            checked={wordWrap}
            onCheckedChange={(checked) => setWordWrap(checked === true)}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
            Preferences updated successfully!
          </div>
        )}

        <Button type="submit" disabled={isUpdatingPreferences || isUpdatingWordWrap}>
          {(isUpdatingPreferences || isUpdatingWordWrap) && <Spinner />}
          Save Changes
        </Button>
      </FieldGroup>
    </form>
  )
}
