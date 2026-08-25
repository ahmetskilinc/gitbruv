import type { Metadata } from "next"
import { Suspense } from "react"
import { ProfileView } from "@/components/profile/profile-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  return { title: decodeURIComponent(username) }
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileView />
    </Suspense>
  )
}
