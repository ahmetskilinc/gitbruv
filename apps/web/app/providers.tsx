"use client"

import { lazy, Suspense, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ApiProvider } from "@gitbruv/hooks"
import { DEFAULT_QUERY_OPTIONS } from "@gitbruv/lib"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { api } from "@/lib/api/client"

const Databuddy = lazy(() =>
  import("@databuddy/sdk/react").then((m) => ({ default: m.Databuddy })),
)

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: DEFAULT_QUERY_OPTIONS } }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={api}>
        <NuqsAdapter>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors position="top-right" />
            {process.env.NODE_ENV === "production" && (
              <Suspense>
                <Databuddy
                  clientId="f2d7ca37-ab52-4782-be5a-f88b59c8bac2"
                  trackErrors
                  trackPerformance
                  trackWebVitals
                  trackAttributes
                />
              </Suspense>
            )}
          </ThemeProvider>
        </NuqsAdapter>
      </ApiProvider>
    </QueryClientProvider>
  )
}
