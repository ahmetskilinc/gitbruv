"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleStar } from "@/lib/hooks/use-repositories";
import { cn } from "@/lib/utils";
import { mutate } from "swr";

export function StarButton({
  repoId,
  initialStarred,
  initialCount,
}: {
  repoId: string;
  initialStarred: boolean;
  initialCount: number;
}) {
  const [starred, setStarred] = useState(initialStarred);
  const [count, setCount] = useState(initialCount);
  const { trigger, isMutating } = useToggleStar(repoId);

  async function handleClick() {
    try {
      const result = await trigger();
      if (result) {
        setStarred(result.starred);
        setCount((c) => (result.starred ? c + 1 : c - 1));
        mutate((key) => typeof key === "string" && key.includes("/repositories"));
      }
    } catch {}
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isMutating}
      className={cn(
        "gap-2 transition-colors",
        starred && "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
      )}
    >
      <Star className={cn("h-4 w-4", starred && "fill-current")} />
      <span>{starred ? "Starred" : "Star"}</span>
      <span className="px-2 py-0.5 rounded bg-secondary text-xs font-medium">{count}</span>
    </Button>
  );
}
