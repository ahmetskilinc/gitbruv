"use client"

import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Markdown body rendering for PR descriptions, reviews, and comments.
 * Local to pulls/ — the issues components are being built in parallel and
 * must not be imported from here.
 */
export function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  )
}
