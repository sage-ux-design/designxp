"use client";

import { FlaskConical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/8bit/tooltip";
import { usePlayer } from "@/hooks/use-player";
import { cn } from "@/lib/utils";

const EXPLAINER =
  "Demo mode: progress is saved only in this browser and the leaderboard shows sample players. Add Supabase credentials to enable the shared live leaderboard.";

export function DemoBadge({ className, bar }: { className?: string; bar?: boolean }) {
  const { mode } = usePlayer();
  if (mode !== "demo") return null;
  if (bar)
    return (
      <p className={cn("items-center gap-2 bg-yellow px-3 py-1 text-xs font-bold text-ink", className)}>
        <FlaskConical className="size-3.5" aria-hidden="true" />
        DEMO MODE · progress saved on this device only
      </p>
    );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn("items-center gap-1.5 bg-yellow px-2 py-1 font-pixel text-[9px] text-ink", className)}
          aria-label={EXPLAINER}
        >
          <FlaskConical className="size-3.5" aria-hidden="true" />
          DEMO MODE
        </button>
      </TooltipTrigger>
      <TooltipContent font="normal" className="max-w-xs text-xs leading-relaxed">{EXPLAINER}</TooltipContent>
    </Tooltip>
  );
}
