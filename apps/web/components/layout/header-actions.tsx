"use client"

import { createContext, useContext, useEffect, useState } from "react"

type HeaderActionsValue = {
  actions: React.ReactNode
  setActions: (node: React.ReactNode) => void
}

const HeaderActionsContext = createContext<HeaderActionsValue | null>(null)

export function HeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<React.ReactNode>(null)
  return (
    <HeaderActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </HeaderActionsContext.Provider>
  )
}

/** Render slot in the app header — the shell mounts this once. */
export function HeaderActionsSlot() {
  const ctx = useContext(HeaderActionsContext)
  return <>{ctx?.actions}</>
}

/**
 * Pages inject buttons into the shell header by rendering this anywhere in
 * their tree: `<HeaderActions><Button>New PR</Button></HeaderActions>`.
 */
export function HeaderActions({ children }: { children: React.ReactNode }) {
  const ctx = useContext(HeaderActionsContext)
  const setActions = ctx?.setActions

  useEffect(() => {
    if (!setActions) return
    setActions(children)
    return () => setActions(null)
  }, [children, setActions])

  return null
}
