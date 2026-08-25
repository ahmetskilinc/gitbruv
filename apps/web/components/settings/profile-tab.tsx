"use client"

import { useCurrentUser } from "@gitbruv/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { AvatarUpload } from "@/components/settings/avatar-upload"
import { ProfileForm } from "@/components/settings/profile-form"
import { SocialLinksForm } from "@/components/settings/social-links-form"

export function ProfileTab() {
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
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Upload a picture to personalize your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload currentAvatar={user.avatarUrl} name={user.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your profile details visible to other users</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={{
              name: user.name,
              username: user.username,
              bio: user.bio,
              location: user.location,
              website: user.website,
              pronouns: user.pronouns,
              company: user.company,
              gitEmail: user.gitEmail,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Add links to your social profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <SocialLinksForm socialLinks={user.socialLinks} />
        </CardContent>
      </Card>
    </div>
  )
}
