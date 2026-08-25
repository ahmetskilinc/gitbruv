"use client"

import { useState } from "react"
import { RiArrowDownSLine, RiCheckboxCircleLine, RiFileCopyLine } from "@remixicon/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { buttonVariants } from "@/components/ui/button"
import { getApiUrl } from "@/lib/env"

export function CloneUrl({ username, repoName }: { username: string; repoName: string }) {
  const [copied, setCopied] = useState(false)
  const [protocol, setProtocol] = useState<"https" | "ssh">("https")

  const httpsUrl = `${getApiUrl()}/${username}/${repoName}.git`
  const sshUrl = `git@gitbruv.local:${username}/${repoName}.git`

  const url = protocol === "https" ? httpsUrl : sshUrl

  async function copyToClipboard() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "outline", size: "default" })}
        >
          {protocol.toUpperCase()}
          <RiArrowDownSLine className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setProtocol("https")}>HTTPS</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setProtocol("ssh")}>SSH</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <InputGroup className="min-w-[280px] flex-1">
        <InputGroupInput value={url} readOnly className="font-mono text-xs" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="Copy clone URL"
            size="icon-xs"
            onClick={copyToClipboard}
          >
            {copied ? (
              <RiCheckboxCircleLine className="size-3.5 text-emerald-500" />
            ) : (
              <RiFileCopyLine className="size-3.5" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
