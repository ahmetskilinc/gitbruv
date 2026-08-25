"use client"

import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useWebSocket } from "@/lib/websocket"

/**
 * Mounts the notification WebSocket for the lifetime of the main shell:
 * connect when a session exists, disconnect on logout.
 */
export function LiveUpdates() {
  const { data: session } = useSession()
  const { connect, disconnect } = useWebSocket()
  const loggedIn = !!session?.user

  useEffect(() => {
    if (loggedIn) {
      void connect()
    } else {
      disconnect()
    }
  }, [loggedIn, connect, disconnect])

  return null
}
