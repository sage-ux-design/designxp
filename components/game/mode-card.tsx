import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Icon } from "@/components/common/ui-bits";
import { MODE_SCENES, PixelScene } from "@/components/scene/pixel-scene";
import type { GameMode } from "@/types";
import { cn } from "@/lib/utils";

/** A game mode "cartridge": its own pixel world on top, title and progress below. */
export function ModeCard({
  mode,
  questionCount,
  answered,
  compact,
}: {
  mode: GameMode;
  questionCount: number;
  answered: number;
  compact?: boolean;
}) {
  const pct = questionCount ? Math.round((answered / questionCount) * 100) : 0;
  return (
    <Link
      href={`/play/${mode.id}`}
      className="group pixel-frame flex h-full flex-col overflow-hidden rounded-lg transition-transform duration-150 [transition-timing-function:var(--ease-out)] hover:-translate-y-1 active:translate-y-0.5"
    >
      <span className={cn("relative block border-b-4 border-ink", compact ? "h-20" : "h-28")} aria-hidden="true">
        <PixelScene variant={MODE_SCENES[mode.id]} />
        <span className="absolute left-3 top-3 grid size-10 place-items-center rounded-md border-4 border-ink bg-ink text-light">
          <Icon name={mode.icon} className="size-5" />
        </span>
        <span className="absolute right-3 top-3 rounded-sm bg-ink px-2 py-1 font-pixel text-[9px] text-yellow">
          MODE {mode.number}
        </span>
      </span>
      <span className={cn("flex flex-1 flex-col gap-3", compact ? "p-4" : "p-5")}>
        <span className="space-y-1">
          <span className="block font-pixel text-[12px] leading-relaxed text-cream">{mode.title.toUpperCase()}</span>
          <span className={cn("block text-sm font-bold", mode.accentText)}>{mode.tagline}</span>
        </span>
        {!compact && <span className="block text-sm text-muted-foreground">{mode.description}</span>}
        <span className="mt-auto block space-y-2 pt-2">
          <span className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular">
              {answered}/{questionCount} explored
            </span>
            <span className="flex items-center gap-1 font-bold text-cream">
              Play <ChevronRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </span>
          <span className="block h-2 rounded-full bg-paper-3" aria-hidden="true">
            <span className={cn("block h-full rounded-full", mode.accent)} style={{ width: `${pct}%` }} />
          </span>
        </span>
      </span>
    </Link>
  );
}
