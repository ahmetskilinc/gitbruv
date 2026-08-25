"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useEffect, useState, useCallback } from "react"
import { codeToHtml } from "shiki"
import { useTheme } from "next-themes"
import { RiCheckboxCircleLine, RiFileCopyLine } from "@remixicon/react"
import { cn } from "@/lib/utils"

export function CodeViewer({
  content,
  language,
  showLineNumbers = false,
  wordWrap = true,
  className,
}: {
  content: string
  language: string
  showLineNumbers?: boolean
  wordWrap?: boolean
  className?: string
}) {
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const displayLineNumbers = showLineNumbers && !wordWrap

  useEffect(() => {
    if (language === "markdown" || language === "md") return

    async function highlight() {
      try {
        const html = await codeToHtml(content, {
          lang: language === "text" ? "plaintext" : language,
          theme:
            resolvedTheme === "light" ? "github-light-default" : "github-dark-default",
        })
        setHighlightedCode(html)
      } catch {
        setHighlightedCode(null)
      }
    }

    highlight()
  }, [content, language, resolvedTheme])

  if (language === "markdown" || language === "md") {
    return (
      <div
        className={cn(
          "prose prose-neutral dark:prose-invert max-w-none p-6 md:p-8",
          className,
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "")
              const lang = match ? match[1] : ""
              const codeString = String(children).replace(/\n$/, "")
              const hasNewlines = codeString.includes("\n")
              const isInline = !match && !hasNewlines

              if (isInline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return <CodeBlock language={lang}>{codeString}</CodeBlock>
            },
            pre({ children }) {
              return <>{children}</>
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  if (highlightedCode) {
    const lines = content.split("\n")
    const overflowClassName = wordWrap ? "overflow-x-hidden" : "overflow-x-auto"
    const codeClassName = wordWrap
      ? "p-4 [&>pre]:whitespace-pre-wrap! [&>pre]:break-words! [&_code]:leading-6 [&_code]:whitespace-pre-wrap! [&_code]:break-words!"
      : "[&>pre]:bg-transparent! [&_code]:leading-6"
    return (
      <div className={overflowClassName}>
        <div className="flex font-mono text-sm">
          {displayLineNumbers && (
            <div className="shrink-0 border-r bg-muted/30 py-2 pr-4 pl-4 text-right text-muted-foreground select-none">
              {lines.map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          <div
            className={cn("min-w-0 flex-1 py-2 pl-4 [&>pre]:bg-transparent!", codeClassName)}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </div>
      </div>
    )
  }

  const lines = content.split("\n")
  const plainContainerClassName = wordWrap
    ? "font-mono text-sm overflow-x-hidden"
    : "font-mono text-sm overflow-x-auto"
  const plainLineClassName = wordWrap
    ? "pl-4 py-0.5 whitespace-pre-wrap break-words"
    : "pl-4 py-0.5 whitespace-pre"

  return (
    <div className={plainContainerClassName}>
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-muted/30">
              {displayLineNumbers && (
                <td className="w-12 border-r py-0.5 pr-4 pl-4 text-right align-top text-muted-foreground select-none">
                  {i + 1}
                </td>
              )}
              <td className={plainLineClassName}>{line || " "}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CodeBlock({ children, language }: { children: string; language: string }) {
  const { resolvedTheme } = useTheme()
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function highlight() {
      try {
        const result = await codeToHtml(children, {
          lang: language || "text",
          theme:
            resolvedTheme === "light" ? "github-light-default" : "github-dark-default",
        })
        setHtml(result)
      } catch {
        setHtml(null)
      }
    }
    highlight()
  }, [children, language, resolvedTheme])

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [children])

  return (
    <div className="group/cb not-prose relative my-4 overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b bg-secondary/50 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">
          {language || "text"}
        </span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 transition-[color,opacity] duration-150 group-hover/cb:opacity-100 group-focus-within/cb:opacity-100 hover:text-foreground motion-reduce:transition-none"
        >
          {copied ? (
            <>
              <RiCheckboxCircleLine className="size-3.5 text-emerald-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <RiFileCopyLine className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        {html ? (
          <div
            className="p-4 text-sm [&>pre]:m-0! [&>pre]:bg-transparent! [&>pre]:p-0! [&_code]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="p-4 text-sm">
            <code>{children}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
