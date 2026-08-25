import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

/** Renders issue/comment markdown bodies inside the app's prose styles. */
export function MarkdownBody({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none text-sm", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
