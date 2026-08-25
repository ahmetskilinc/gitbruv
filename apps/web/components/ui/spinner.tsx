import { cn } from "@/lib/utils"
import { RiLoaderLine } from "@remixicon/react"

function Spinner({
  className,
  ...props
}: Omit<React.ComponentProps<"svg">, "children">) {
  return (
    <RiLoaderLine data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
