import type { Metadata } from "next"
import { Suspense } from "react"
import { ConsentView } from "./consent-view"

export const metadata: Metadata = { title: "Authorize Application" }

export default function OAuthConsentPage() {
  return (
    <Suspense>
      <ConsentView />
    </Suspense>
  )
}
