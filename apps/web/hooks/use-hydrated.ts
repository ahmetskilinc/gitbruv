import { useSyncExternalStore } from "react"

const noop = () => undefined
const emptySubscribe = () => noop

/**
 * False during SSR and the hydration render, true afterwards — without an
 * effect, so hydration-sensitive UI (e.g. anything derived from the resolved
 * theme) can render a stable placeholder first.
 */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}
