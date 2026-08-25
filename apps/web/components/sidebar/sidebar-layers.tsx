"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { SidebarDirection } from "./sidebar-section-context"

const SLIDE_DISTANCE = 40

const variants = {
  enter: (direction: SidebarDirection) => ({
    opacity: 0,
    x: direction === "forward" ? SLIDE_DISTANCE : -SLIDE_DISTANCE,
  }),
  center: { opacity: 1, x: 0 },
  exit: (direction: SidebarDirection) => ({
    opacity: 0,
    x: direction === "forward" ? -SLIDE_DISTANCE : SLIDE_DISTANCE,
  }),
}

/**
 * Drilling between the main and repository navigation layers. The outgoing
 * layer is popped out of flow so the incoming one never jumps; direction is
 * route-derived (into a repo = forward, back to main = back).
 */
export function SidebarLayers({
  activeKey,
  direction,
  children,
}: {
  activeKey: string
  direction: SidebarDirection
  children: React.ReactNode
}) {
  const reducedMotion = useReducedMotion()

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={activeKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.25, type: "spring", bounce: 0 }
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
